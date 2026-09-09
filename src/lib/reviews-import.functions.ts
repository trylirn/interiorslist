import { fail } from "@/lib/errors";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callerIsAdmin } from "@/lib/caller-role";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

type NewReview = {
  name?: string;
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  relativePublishTimeDescription?: string;
  publishTime?: string;
  authorAttribution?: { displayName?: string; photoUri?: string };
};

function mapsHeaders(lovableKey: string, mapsKey: string, fieldMask: string) {
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": mapsKey,
    "Content-Type": "application/json",
    "X-Goog-FieldMask": fieldMask,
  };
}

async function readError(res: Response, where: string): Promise<never> {
  const body = await res.text();
  console.error(`Google ${where} failed [${res.status}]: ${body}`);
  if (res.status === 403) {
    throw new Error(
      "Google denied the request. The Google Maps key needs the Places API enabled and no HTTP-referrer restriction.",
    );
  }
  throw new Error("Google could not be reached right now. Please try again.");
}

/**
 * Google Places returns at most 5 reviews per place — a hard API limit.
 */
export const importGoogleReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const admin = await callerIsAdmin(supabase as never, userId);
    const { data: owned } = await supabase
      .from("providers")
      .select("place_id, claimed_by, name, address, city, state, postal_code, google_place_id")
      .eq("place_id", data.placeId)
      .maybeSingle();
    if (!owned) throw new Error("Studio not found");
    if (!admin && owned.claimed_by !== userId) throw new Error("You do not manage this studio");

    const { enforceRateLimit } = await import("@/lib/rate-limit.server");
    await enforceRateLimit(`google-reviews:${data.placeId}`, { max: 5, windowMinutes: 60 });

    const lovableKey = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"] ?? process.env["GOOGLE_MAPS_SERVER_KEY"];
    if (!lovableKey || !mapsKey) throw new Error("Google reviews are not configured for this site yet.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Resolve the studio's Google listing id (cached on the record after the first lookup).
    let googleId = owned.google_place_id ?? null;
    if (!googleId) {
      const textQuery = [owned.name, owned.address, owned.city, owned.state, owned.postal_code]
        .filter(Boolean)
        .join(", ");
      const findRes = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
        method: "POST",
        headers: mapsHeaders(lovableKey, mapsKey, "places.id,places.displayName,places.formattedAddress"),
        body: JSON.stringify({ textQuery, maxResultCount: 1 }),
      });
      if (!findRes.ok) await readError(findRes, "place search");
      const found = (await findRes.json()) as { places?: Array<{ id?: string }> };
      googleId = found.places?.[0]?.id ?? null;
      if (!googleId) {
        throw new Error("We couldn't find this studio on Google — check the business name and address.");
      }
      await supabaseAdmin.from("providers").update({ google_place_id: googleId }).eq("place_id", data.placeId);
    }

    // 2. Pull details + reviews.
    const detailsRes = await fetch(`${GATEWAY_URL}/places/v1/places/${encodeURIComponent(googleId)}`, {
      headers: mapsHeaders(lovableKey, mapsKey, "id,rating,userRatingCount,reviews"),
    });
    if (!detailsRes.ok) {
      if (detailsRes.status === 404) {
        throw new Error("We couldn't find this studio on Google — check the business name and address.");
      }
      await readError(detailsRes, "place details");
    }
    const details = (await detailsRes.json()) as {
      rating?: number;
      userRatingCount?: number;
      reviews?: NewReview[];
    };

    const reviews = details.reviews ?? [];

    let imported = 0;
    for (const r of reviews) {
      const author = r.authorAttribution?.displayName ?? "Google reviewer";
      const externalId = (r.name ?? `${r.publishTime ?? ""}-${author}`)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .slice(0, 200);
      const { error } = await supabaseAdmin.from("reviews").upsert(
        {
          provider_place_id: data.placeId,
          source: "google",
          external_id: externalId,
          author_name: author,
          author_photo: r.authorAttribution?.photoUri ?? null,
          rating: r.rating ?? null,
          text: r.text?.text ?? r.originalText?.text ?? null,
          relative_time: r.relativePublishTimeDescription ?? null,
          published_at: r.publishTime ?? new Date().toISOString(),
        },
        { onConflict: "provider_place_id,source,external_id" },
      );
      if (error) fail(error);
      imported += 1;
    }

    const patch: { rating?: number; review_count?: number } = {};
    if (typeof details.rating === "number") patch.rating = details.rating;
    if (typeof details.userRatingCount === "number") patch.review_count = details.userRatingCount;
    if (Object.keys(patch).length) {
      await supabaseAdmin.from("providers").update(patch).eq("place_id", data.placeId);
    }

    return { imported, limit: 5 };
  });
