import { fail } from "@/lib/errors";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("claims").insert({
      provider_place_id: data.placeId,
      user_id: context.userId,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone,
      business_role: data.businessRole,
      proof_notes: data.proofNotes,
    });
    if (error) fail(error);
    return { ok: true };
  });

export const submitBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("submissions").insert({
      business_name: data.businessName,
      city: data.city,
      address: data.address,
      website: data.website || null,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone,
      notes: data.notes,
      submitted_by: userId,
    });
    if (error) fail(error);
    return { ok: true };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { callerIsSuperAdmin } = await import("@/lib/caller-role");
    if (await callerIsSuperAdmin(supabase as never, userId)) {
      throw new Error("Super admin accounts cannot be closed from the dashboard.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("providers").update({ claimed_by: null }).eq("claimed_by", userId);
    await supabaseAdmin.from("claims").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) fail(error);
    return { ok: true };
  });
