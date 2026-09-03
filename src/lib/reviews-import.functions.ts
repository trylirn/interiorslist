import { fail } from "@/lib/errors";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callerIsAdmin } from "@/lib/caller-role";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

type GoogleReview = {
  author_name?: string;
  profile_photo_url?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
  time?: number;
};

/**
 * Google Places Details returns at most 5 reviews per place — a hard API limit.
 */
export const importGoogleReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const admin = await callerIsAdmin(supabase as never, userId);
    const { data: owned } = await supabase
      .from("providers")
      .select("place_id, claimed_by")
      .eq("place_id", data.placeId)
      .maybeSingle();
    if (!owned) throw new Error("Studio not found");
    if (!admin && owned.claimed_by !== userId) throw new Error("You do not manage this studio");

    const { enforceRateLimit } = await import("@/lib/rate-limit.server");
    await enforceRateLimit(`google-reviews:${data.placeId}`, { max: 5, windowMinutes: 60 });

    const lovableKey = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableKey || !mapsKey) throw new Error("Google reviews are not configured for this site yet.");

    const url =
      `${GATEWAY_URL}/maps/api/place/details/json?place_id=${encodeURIComponent(data.placeId)}` +
      `&fields=reviews,rating,user_ratings_total&reviews_sort=newest`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": mapsKey },
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Places details failed [${res.status}]: ${body}`);
      throw new Error("Google could not be reached right now. Please try again.");
    }
    const body = (await res.json()) as {
      status?: string;
      error_message?: string;
      result?: { reviews?: GoogleReview[]; rating?: number; user_ratings_total?: number };
    };
    if (body.status && body.status !== "OK") {
      console.error(`Places details status ${body.status}: ${body.error_message ?? ""}`);
      if (body.status === "NOT_FOUND" || body.status === "INVALID_REQUEST") {
        throw new Error("This studio has no matching Google listing.");
      }
      throw new Error("Google could not return reviews right now. Please try again.");
    }

    const reviews = body.result?.reviews ?? [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let imported = 0;
    for (const r of reviews) {
      const externalId = `${r.time ?? ""}-${(r.author_name ?? "anon").toLowerCase().replace(/\s+/g, "-")}`.slice(0, 200);
      const { error } = await supabaseAdmin
        .from("reviews")
        .upsert(
          {
            provider_place_id: data.placeId,
            source: "google",
            external_id: externalId,
            author_name: r.author_name ?? "Google reviewer",
            author_photo: r.profile_photo_url ?? null,
            rating: r.rating ?? null,
            text: r.text ?? null,
            relative_time: r.relative_time_description ?? null,
            published_at: r.time ? new Date(r.time * 1000).toISOString() : new Date().toISOString(),
          },
          { onConflict: "provider_place_id,source,external_id" },
        );
      if (error) fail(error);
      imported += 1;
    }

    const patch: { rating?: number; review_count?: number } = {};
    if (typeof body.result?.rating === "number") patch.rating = body.result.rating;
    if (typeof body.result?.user_ratings_total === "number") patch.review_count = body.result.user_ratings_total;
    if (Object.keys(patch).length) {
      await supabaseAdmin.from("providers").update(patch).eq("place_id", data.placeId);
    }

    return { imported, limit: 5 };
  });
