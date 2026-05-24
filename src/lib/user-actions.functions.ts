import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: favs, error } = await supabaseAdmin
      .from("favorites")
      .select("provider_place_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (favs ?? []).map((f) => f.provider_place_id);
    if (ids.length === 0) return { providers: [] };
    const { data: providers } = await supabaseAdmin
      .from("providers")
      .select(
        "place_id, slug, name, city, city_slug, rating, review_count, services, hero_photo_url, address"
      )
      .in("place_id", ids);
    return { providers: providers ?? [] };
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(160) }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: existing } = await supabaseAdmin
      .from("favorites")
      .select("user_id")
      .eq("user_id", userId)
      .eq("provider_place_id", data.placeId)
      .maybeSingle();
    if (existing) {
      const { error } = await supabaseAdmin
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("provider_place_id", data.placeId);
      if (error) throw new Error(error.message);
      return { favorited: false };
    }
    const { error } = await supabaseAdmin
      .from("favorites")
      .insert({ user_id: userId, provider_place_id: data.placeId });
    if (error) throw new Error(error.message);
    return { favorited: true };
  });

export const submitClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      placeId: z.string().min(1).max(160),
      contactEmail: z.string().email().max(255),
      contactPhone: z.string().max(40).optional(),
      businessRole: z.string().max(80).optional(),
      proofNotes: z.string().max(2000).optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin.from("claims").insert({
      provider_place_id: data.placeId,
      user_id: context.userId,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone,
      business_role: data.businessRole,
      proof_notes: data.proofNotes,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitBusiness = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      businessName: z.string().min(2).max(200),
      city: z.string().min(2).max(100),
      address: z.string().max(300).optional(),
      website: z.string().url().max(300).optional().or(z.literal("")),
      contactEmail: z.string().email().max(255),
      contactPhone: z.string().max(40).optional(),
      notes: z.string().max(2000).optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("submissions").insert({
      business_name: data.businessName,
      city: data.city,
      address: data.address,
      website: data.website || null,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone,
      notes: data.notes,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
