import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function isAdminUser(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

async function ownsProvider(userId: string, placeId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (await isAdminUser(userId)) return true;
  const { data } = await supabaseAdmin
    .from("providers")
    .select("place_id")
    .eq("place_id", placeId)
    .eq("claimed_by", userId)
    .maybeSingle();
  return !!data;
}

// --- Review responses ---
export const respondToReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ reviewId: z.string().uuid(), body: z.string().min(2).max(2000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: review } = await supabaseAdmin
      .from("reviews")
      .select("id, provider_place_id")
      .eq("id", data.reviewId)
      .maybeSingle();
    if (!review) throw new Error("Review not found");
    if (!(await ownsProvider(context.userId, review.provider_place_id))) {
      throw new Error("Forbidden");
    }
    const { error } = await supabaseAdmin
      .from("review_responses")
      .upsert({ review_id: data.reviewId, owner_id: context.userId, body: data.body });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listReviewResponses = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ reviewIds: z.array(z.string().uuid()).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!data.reviewIds.length) return { responses: [] };
    const { data: rows } = await supabaseAdmin
      .from("review_responses")
      .select("review_id, body, updated_at")
      .in("review_id", data.reviewIds);
    return { responses: rows ?? [] };
  });

// --- FAQs ---
export const listProviderFaqs = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("provider_faqs")
      .select("id, question, answer, sort_order")
      .eq("provider_place_id", data.placeId)
      .order("sort_order");
    return { faqs: rows ?? [] };
  });

export const upsertProviderFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid().optional(),
      placeId: z.string().min(1).max(200),
      question: z.string().min(3).max(300),
      answer: z.string().min(3).max(2000),
      sortOrder: z.number().int().min(0).max(99).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await ownsProvider(context.userId, data.placeId))) throw new Error("Forbidden");
    const row = {
      provider_place_id: data.placeId,
      question: data.question,
      answer: data.answer,
      sort_order: data.sortOrder ?? 0,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("provider_faqs").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("provider_faqs").insert(row);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteProviderFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), placeId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await ownsProvider(context.userId, data.placeId))) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("provider_faqs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Listing metrics ---
export const getListingMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await ownsProvider(context.userId, data.placeId))) throw new Error("Forbidden");
    const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
    const [views30, leads30, reviewsCount, provider] = await Promise.all([
      supabaseAdmin.from("provider_views").select("*", { count: "exact", head: true }).eq("provider_place_id", data.placeId).gte("viewed_at", since30),
      supabaseAdmin.from("contact_messages").select("*", { count: "exact", head: true }).eq("provider_place_id", data.placeId).gte("created_at", since30),
      supabaseAdmin.from("reviews").select("*", { count: "exact", head: true }).eq("provider_place_id", data.placeId),
      supabaseAdmin.from("providers").select("rating, review_count, view_count").eq("place_id", data.placeId).maybeSingle(),
    ]);
    return {
      views30d: views30.count ?? 0,
      leads30d: leads30.count ?? 0,
      reviewsTotal: reviewsCount.count ?? 0,
      rating: provider.data?.rating ?? null,
      reviewCount: provider.data?.review_count ?? 0,
      totalViews: provider.data?.view_count ?? 0,
    };
  });

// --- Record a public profile view (no auth) ---
export const recordProviderView = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("provider_views").insert({ provider_place_id: data.placeId });
    return { ok: true };
  });
