import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function callerIsAdmin(supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> }, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return data === true;
}



export const listMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("providers")
      .select("place_id, slug, name, city, city_slug, address, website, phone, specialists, services, branch_label, hero_photo_url, notes, is_verified")
      .eq("claimed_by", userId)
      .order("name");
    if (error) throw new Error(error.message);
    return { listings: data ?? [] };
  });

export const getMyListing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const admin = await callerIsAdmin(supabase as never, userId);
    let query = supabase.from("providers").select("*").eq("place_id", data.placeId);
    if (!admin) query = query.eq("claimed_by", userId);
    const { data: row, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    return { listing: row, asAdmin: admin };
  });

export const updateMyListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      placeId: z.string().min(1).max(200),
      specialists: z.string().max(2000).optional(),
      notes: z.string().max(4000).optional(),
      about_description: z.string().max(4000).optional(),
      website: z.string().max(500).optional(),
      phone: z.string().max(40).optional(),
      hero_photo_url: z.string().max(500).optional(),
      branch_label: z.string().max(120).optional(),
      services: z.array(z.string().min(1).max(80)).max(40).optional(),
      gallery_urls: z.array(z.string().max(500)).max(20).optional(),
      video_urls: z.array(z.string().max(500)).max(10).optional(),
      certificate_urls: z.array(z.string().max(500)).max(20).optional(),
      document_urls: z.array(z.string().max(500)).max(20).optional(),
      social_links: z.record(z.string().max(40), z.string().max(500)).optional(),
      email_forward_to: z.string().email().max(255).optional().or(z.literal("")),
      credentials: z.string().max(2000).optional(),
      founded_year: z.number().int().min(1800).max(2100).nullable().optional(),
      years_in_business: z.number().int().min(0).max(200).nullable().optional(),
      service_area: z.enum(["local", "regional", "nationwide"]).nullable().optional(),
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
    const patch = {
      ...rest,
      ...(email_forward_to !== undefined ? { email_forward_to: email_forward_to === "" ? null : email_forward_to } : {}),
    };
    const admin = await callerIsAdmin(supabase as never, userId);
    let query = supabase.from("providers").update(patch).eq("place_id", placeId);
    if (!admin) query = query.eq("claimed_by", userId);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const listMyLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(200).optional() }).optional().parse(d))
  .handler(async ({ data: input, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("contact_messages")
      .select("id, provider_place_id, first_name, last_name, email, phone, message, status, created_at");
    if (input?.placeId) q = q.eq("provider_place_id", input.placeId);
    const { data, error } = await q
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
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
    if (error) throw new Error(error.message);
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
      if (err) throw new Error(err.message);
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
    if (error) throw new Error(error.message);
    return { reviews: (data ?? []).map((r) => ({ ...r, providerName: nameMap.get(r.provider_place_id) ?? "" })) };
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
    if (error) throw new Error(error.message);
    return { ok: true };
  });
