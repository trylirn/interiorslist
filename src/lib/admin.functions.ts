import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

export const adminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const since7 = new Date(Date.now() - 7 * 86400_000).toISOString();
    const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
    const [providers, claimed, pendingClaims, pendingSubs, msgs7, msgs30, reviews7, reviews30, signups7, signups30] = await Promise.all([
      supabaseAdmin.from("providers").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("providers").select("*", { count: "exact", head: true }).not("claimed_by", "is", null),
      supabaseAdmin.from("claims").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("contact_messages").select("*", { count: "exact", head: true }).gte("created_at", since7),
      supabaseAdmin.from("contact_messages").select("*", { count: "exact", head: true }).gte("created_at", since30),
      supabaseAdmin.from("reviews").select("*", { count: "exact", head: true }).gte("published_at", since7),
      supabaseAdmin.from("reviews").select("*", { count: "exact", head: true }).gte("published_at", since30),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", since7),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", since30),
    ]);
    const { data: byCity } = await supabaseAdmin.from("providers").select("city_slug, city");
    const cityCounts: Record<string, { city: string; count: number }> = {};
    for (const r of byCity ?? []) {
      const k = r.city_slug;
      cityCounts[k] = { city: r.city, count: (cityCounts[k]?.count ?? 0) + 1 };
    }
    const topCities = Object.entries(cityCounts).map(([slug, v]) => ({ slug, ...v })).sort((a, b) => b.count - a.count).slice(0, 10);
    return {
      totals: {
        providers: providers.count ?? 0,
        claimed: claimed.count ?? 0,
        pendingClaims: pendingClaims.count ?? 0,
        pendingSubmissions: pendingSubs.count ?? 0,
      },
      activity: {
        messages7d: msgs7.count ?? 0,
        messages30d: msgs30.count ?? 0,
        reviews7d: reviews7.count ?? 0,
        reviews30d: reviews30.count ?? 0,
        signups7d: signups7.count ?? 0,
        signups30d: signups30.count ?? 0,
      },
      topCities,
    };
  });

export const listPendingClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: claims } = await supabaseAdmin
      .from("claims")
      .select("id, provider_place_id, user_id, contact_email, contact_phone, business_role, proof_notes, status, submitted_at")
      .order("submitted_at", { ascending: false })
      .limit(200);
    const ids = Array.from(new Set((claims ?? []).map((c) => c.provider_place_id)));
    const { data: providers } = ids.length
      ? await supabaseAdmin.from("providers").select("place_id, name, slug, city").in("place_id", ids)
      : { data: [] };
    const pmap = new Map((providers ?? []).map((p) => [p.place_id, p]));
    return {
      claims: (claims ?? []).map((c) => ({ ...c, provider: pmap.get(c.provider_place_id) ?? null })),
    };
  });

export const reviewClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), action: z.enum(["approve", "reject"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: claim, error } = await supabaseAdmin
      .from("claims")
      .select("id, user_id, provider_place_id, status, contact_email")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !claim) throw new Error("Claim not found");
    const status = data.action === "approve" ? "approved" : "rejected";
    const { error: upErr } = await supabaseAdmin
      .from("claims")
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: context.userId })
      .eq("id", data.id);
    if (upErr) throw new Error(upErr.message);
    if (data.action === "approve") {
      // Public claims can arrive without an account. If an account already
      // exists for the contact email, attach the listing to it.
      let ownerId = claim.user_id as string | null;
      if (!ownerId && claim.contact_email) {
        const { data: match } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .ilike("email", claim.contact_email as string)
          .maybeSingle();
        ownerId = match?.id ?? null;
      }
      await supabaseAdmin
        .from("providers")
        .update({ claimed_by: ownerId, is_verified: true, published: true })
        .eq("place_id", claim.provider_place_id);
    }
    return { ok: true };
  });

export const listPendingSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return { submissions: data ?? [] };
  });

export const reviewSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), action: z.enum(["approve", "reject"]), notes: z.string().max(2000).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: sub, error } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !sub) throw new Error("Submission not found");

    let placeId: string | null = null;
    if (data.action === "approve") {
      const slug = (sub.business_name as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") + "-" + (sub.city as string).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      placeId = "submission-" + sub.id.slice(0, 12);
      const { error: insErr } = await supabaseAdmin.from("providers").insert({
        place_id: placeId,
        slug,
        name: sub.business_name,
        city: sub.city,
        city_slug: (sub.city as string).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        address: sub.address ?? null,
        website: sub.website ?? null,
        phone: sub.contact_phone ?? null,
        claimed_by: sub.submitted_by ?? null,
        is_verified: true,
        business_status: "OPERATIONAL",
      });
      if (insErr) throw new Error(insErr.message);
    }
    await supabaseAdmin
      .from("submissions")
      .update({
        status: data.action === "approve" ? "approved" : "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
        resulting_place_id: placeId,
      })
      .eq("id", data.id);
    return { ok: true, placeId };
  });

export const listAllProviders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        q: z.string().max(120).optional(),
        status: z.enum(["all", "published", "unpublished"]).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const status = data.status ?? "all";
    const build = () => {
      let q = supabaseAdmin
        .from("providers")
        .select("place_id, slug, name, city, claimed_by, is_verified, published, featured, rating, review_count", {
          count: "exact",
        })
        .order("name");
      if (status === "published") q = q.eq("published", true);
      if (status === "unpublished") q = q.eq("published", false);
      if (data.q) {
        const term = data.q.replace(/[,()*%\\]/g, " ").trim();
        if (term) q = q.ilike("name", `%${term}%`);
      }
      return q;
    };

    // Page past PostgREST's 1000-row cap so nothing is silently cut off.
    type Row = Awaited<ReturnType<typeof build>>["data"] extends (infer R)[] | null ? R : never;
    const rows: Row[] = [];
    let total = 0;
    for (let from = 0; from < 5000; from += 1000) {
      const { data: page, error, count } = await build().range(from, from + 999);
      if (error) throw new Error(error.message);
      if (typeof count === "number") total = count;
      rows.push(...((page ?? []) as Row[]));
      if (!page || page.length < 1000) break;
    }
    return { providers: rows, total };
  });

export const toggleProviderFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      placeId: z.string().min(1).max(200),
      field: z.enum(["published", "featured", "is_verified"]),
      value: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const patch: Record<string, boolean> = { [data.field]: data.value };
    const { error } = await (supabaseAdmin
      .from("providers") as unknown as { update: (p: Record<string, boolean>) => { eq: (k: string, v: string) => Promise<{ error: { message: string } | null }> } })
      .update(patch)
      .eq("place_id", data.placeId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getLicenseDocSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ path: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: signed, error } = await supabaseAdmin.storage
      .from("business-docs")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

export const purgeAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ confirm: z.literal("PURGE") }).parse(d))
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const events = await supabaseAdmin.from("analytics_events").delete().gt("id", 0);
    if (events.error) throw new Error(events.error.message);
    const sessions = await supabaseAdmin
      .from("analytics_sessions")
      .delete()
      .gte("started_at", "1970-01-01T00:00:00Z");
    if (sessions.error) throw new Error(sessions.error.message);
    return { ok: true };
  });
