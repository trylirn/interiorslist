import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public claim submission — no account required. Writes go through the trusted
// server client after validation; no anonymous insert policy is opened.
export const submitPublicClaim = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        placeId: z.string().trim().min(1).max(200),
        firstName: z.string().trim().min(1).max(80),
        lastName: z.string().trim().min(1).max(80),
        contactEmail: z.string().trim().email().max(255),
        contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
        businessRole: z.string().trim().max(120).optional().or(z.literal("")),
        proofNotes: z.string().trim().max(2000).optional().or(z.literal("")),
        userId: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = data.contactEmail.toLowerCase();
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Throttle: max 5 claims per email per hour, and one pending claim per listing/email.
    const { count } = await supabaseAdmin
      .from("claims")
      .select("id", { count: "exact", head: true })
      .eq("contact_email", email)
      .gte("submitted_at", since);
    if ((count ?? 0) >= 5) {
      throw new Error("Too many claim submissions. Please try again later.");
    }

    const { data: dupe } = await supabaseAdmin
      .from("claims")
      .select("id, access_token")
      .eq("contact_email", email)
      .eq("provider_place_id", data.placeId)
      .in("status", ["pending", "needs_info"])
      .maybeSingle();
    if (dupe) return { ok: true, duplicate: true, claimId: dupe.id, token: dupe.access_token as string };

    const { data: created, error } = await supabaseAdmin
      .from("claims")
      .insert({
        provider_place_id: data.placeId,
        user_id: data.userId ?? null,
        contact_name: `${data.firstName} ${data.lastName}`.trim(),
        contact_email: email,
        contact_phone: data.contactPhone || null,
        business_role: data.businessRole || null,
        proof_notes: data.proofNotes || null,
      })
      .select("id, access_token")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { ok: true, duplicate: false, claimId: created?.id ?? null, token: (created?.access_token as string | undefined) ?? null };
  });

