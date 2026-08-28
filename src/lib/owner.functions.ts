import { fail } from "@/lib/errors";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callerIsSuperAdmin } from "@/lib/caller-role";
import { BUDGET_BANDS, slugify } from "@/lib/cities";



export const listMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("providers")
      .select("place_id, slug, name, city, city_slug, address, website, specialists, services, branch_label, hero_photo_url, is_verified")
      .eq("claimed_by", userId)
      .order("name");
    if (error) fail(error);
    return { listings: data ?? [] };
  });

export const getMyListing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Only super admins may open a studio they do not own (manual onboarding).
    const superAdmin = await callerIsSuperAdmin(supabase as never, userId);
    let query = supabase.from("providers").select("*").eq("place_id", data.placeId);
    if (!superAdmin) query = query.eq("claimed_by", userId);
    const { data: row, error } = await query.maybeSingle();
    if (error) fail(error);
    return { listing: row, asAdmin: superAdmin, asSuperAdmin: superAdmin };
  });

export const updateMyListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      placeId: z.string().min(1).max(200),
      name: z.string().trim().min(2).max(160).optional(),
      specialists: z.string().max(2000).optional(),
      about_description: z.string().max(4000).optional(),
      website: z.string().max(500).optional(),
      logo_url: z.string().max(1000).optional(),
      address: z.string().max(300).optional(),
      city: z.string().max(120).optional(),
      state: z.string().max(2).optional(),
      postal_code: z.string().max(20).optional(),
      hours: z
        .record(
          z.string().max(12),
          z.object({ closed: z.boolean(), open: z.string().max(10), close: z.string().max(10) }),
        )
        .optional(),

      branch_label: z.string().max(120).optional(),
      services: z.array(z.string().min(1).max(80)).max(40).optional(),
      styles: z.array(z.string().min(1).max(80)).max(20).optional(),
      project_types: z.array(z.string().min(1).max(80)).max(20).optional(),
      typical_project_budget: z.string().max(40).optional(),
      remote_services: z.boolean().optional(),
      gallery_urls: z.array(z.string().max(500)).max(20).optional(),
      video_urls: z.array(z.string().max(500)).max(10).optional(),
      certificate_urls: z.array(z.string().max(500)).max(20).optional(),
      document_urls: z.array(z.string().max(500)).max(20).optional(),
      social_links: z.record(z.string().max(40), z.string().max(500)).optional(),
      team: z
        .array(z.object({ name: z.string().min(1).max(120), role: z.string().min(1).max(120), bio: z.string().max(600).optional() }))
        .max(30)
        .optional(),
      email_forward_to: z.string().email().max(255).optional().or(z.literal("")),
      credentials: z.string().max(2000).optional(),
      founded_year: z.number().int().min(1800).max(2100).nullable().optional(),
      years_in_business: z.number().int().min(0).max(200).nullable().optional(),
      service_area: z.enum(["local", "regional", "nationwide", "national_international"]).nullable().optional(),
      service_area_note: z.string().max(500).optional(),
      team_size: z.string().max(60).optional(),
      client_types: z.string().max(2000).optional(),
      not_a_fit: z.string().max(2000).optional(),
      price_ranges: z
        .array(z.object({ name: z.string().max(120), price: z.string().max(80).optional(), note: z.string().max(300).optional() }))
        .max(20)
        .optional(),
    }).parse(d),

  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { placeId, email_forward_to, ...rest } = data;
    // Price tier is no longer edited directly — derive it from the chosen job-cost band.
    const derivedTier =
      rest.typical_project_budget !== undefined
        ? (BUDGET_BANDS.find((b) => b.slug === rest.typical_project_budget)?.tier ?? null)
        : undefined;
    // Keep the directory grouping in sync when the studio edits its city/state.
    const normalizedState = rest.state ? rest.state.toUpperCase() : undefined;
    const citySlug =
      rest.city && normalizedState ? `${slugify(rest.city)}-${normalizedState.toLowerCase()}` : undefined;
    const patch = {
      ...rest,
      ...(normalizedState ? { state: normalizedState } : {}),
      ...(citySlug ? { city_slug: citySlug } : {}),
      ...(derivedTier !== undefined ? { price_tier: derivedTier === "flexible" ? null : derivedTier } : {}),
      ...(email_forward_to !== undefined ? { email_forward_to: email_forward_to === "" ? null : email_forward_to } : {}),
    };
    const superAdmin = await callerIsSuperAdmin(supabase as never, userId);
    let query = supabase.from("providers").update(patch).eq("place_id", placeId);
    if (!superAdmin) query = query.eq("claimed_by", userId);
    const { error } = await query;
    if (error) fail(error);
    return { ok: true };
  });


export const listMyLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(200).optional() }).optional().parse(d))
  .handler(async ({ data: input, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("contact_messages")
      .select("id, provider_place_id, first_name, last_name, email, phone, message, status, created_at, location, project_type, budget, style, timeline, rooms");
    if (input?.placeId) q = q.eq("provider_place_id", input.placeId);
    const { data, error } = await q
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) fail(error);
    return { leads: data ?? [] };
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "contacted", "closed"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("contact_messages")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) fail(error);
    return { ok: true };
  });

export const listMyReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(200).optional() }).optional().parse(d))
  .handler(async ({ data: input, context }) => {
    const { supabase, userId } = context;
    if (input?.placeId) {
      const { data: one } = await supabase.from("providers").select("place_id, name").eq("place_id", input.placeId).maybeSingle();
      const { data: rows, error: err } = await supabase
        .from("reviews")
        .select("id, provider_place_id, author_name, rating, text, published_at")
        .eq("provider_place_id", input.placeId)
        .order("published_at", { ascending: false })
        .limit(200);
      if (err) fail(err);
      return { reviews: (rows ?? []).map((r) => ({ ...r, providerName: one?.name ?? "" })) };
    }
    // Fetch owned place_ids first (RLS-scoped via owner UPDATE policy still allows SELECT through public read).
    const { data: mine } = await supabase
      .from("providers")
      .select("place_id, name")
      .eq("claimed_by", userId);
    const placeIds = (mine ?? []).map((m) => m.place_id);
    if (!placeIds.length) return { reviews: [] };
    const nameMap = new Map((mine ?? []).map((m) => [m.place_id, m.name]));
    const { data, error } = await supabase
      .from("reviews")
      .select("id, provider_place_id, author_name, rating, text, published_at")
      .in("provider_place_id", placeIds)
      .order("published_at", { ascending: false })
      .limit(200);
    if (error) fail(error);
    return { reviews: (data ?? []).map((r) => ({ ...r, providerName: nameMap.get(r.provider_place_id) ?? "" })) };
  });

/** Claims filed by the signed-in account, with their private thread links. */
export const listMyClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("claims")
      .select("id, provider_place_id, status, decision_reason, submitted_at, last_message_at, access_token, contact_email, user_id");
    q = profile?.email
      ? q.or(`user_id.eq.${userId},contact_email.eq.${profile.email.toLowerCase()}`)
      : q.eq("user_id", userId);
    const { data: claims, error } = await q.order("submitted_at", { ascending: false }).limit(50);
    if (error) fail(error);
    const ids = Array.from(new Set((claims ?? []).map((c) => c.provider_place_id)));
    const { data: providers } = ids.length
      ? await supabaseAdmin.from("providers").select("place_id, name, city, state").in("place_id", ids)
      : { data: [] };
    const pmap = new Map((providers ?? []).map((p) => [p.place_id, p]));
    return { claims: (claims ?? []).map((c) => ({ ...c, provider: pmap.get(c.provider_place_id) ?? null })) };
  });

export const submitClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      placeId: z.string().min(1).max(200),
      contactEmail: z.string().email().max(255),
      contactPhone: z.string().max(40).optional(),
      businessRole: z.string().max(120).optional(),
      proofNotes: z.string().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("claims").insert({
      provider_place_id: data.placeId,
      user_id: userId,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone || null,
      business_role: data.businessRole || null,
      proof_notes: data.proofNotes || null,
    });
    if (error) fail(error);
    return { ok: true };
  });

// Onboarding / approval status for the signed-in account: pending claims and
// submissions awaiting admin review, plus whether the profile has been set up.
export const getMyOnboardingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: listings }, { data: claims }, { data: subs }, { data: profile }] = await Promise.all([
      supabase.from("providers").select("place_id").eq("claimed_by", userId),
      supabase.from("claims").select("id, status, provider_place_id, submitted_at").eq("user_id", userId).order("submitted_at", { ascending: false }),
      supabase.from("submissions").select("id, status, business_name, created_at").eq("submitted_by", userId).order("created_at", { ascending: false }),
      supabase.from("profiles").select("account_type, contact_name, phone, business_role").eq("id", userId).maybeSingle(),
    ]);

    const profileComplete = !!(profile?.contact_name && profile?.phone && profile?.business_role);

    return {
      listingCount: listings?.length ?? 0,
      pendingClaims: (claims ?? []).filter((c) => c.status === "pending"),
      pendingSubmissions: (subs ?? []).filter((s) => s.status === "pending"),
      latestClaim: claims?.[0] ?? null,
      latestSubmission: subs?.[0] ?? null,
      profileComplete,
    };
  });
