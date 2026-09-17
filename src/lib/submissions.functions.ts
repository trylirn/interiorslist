import { fail } from "@/lib/errors";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public studio submission — no account required. Validated and throttled,
// then written through the trusted server client (no anon insert policy).
export const submitPublicBusiness = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        businessName: z.string().trim().min(2).max(200),
        city: z.string().trim().min(2).max(100),
        address: z.string().trim().max(300).optional().or(z.literal("")),
        website: z.string().trim().url().max(300).optional().or(z.literal("")),
        contactEmail: z.string().trim().email().max(255),
        contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
        notes: z.string().trim().max(2000).optional().or(z.literal("")),
        userId: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { enforceRateLimit } = await import("@/lib/rate-limit.server");
    await enforceRateLimit("submission", { max: 5, windowMinutes: 60 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = data.contactEmail.toLowerCase();

    const { assertNoExistingStudio } = await import("@/lib/one-studio.server");
    await assertNoExistingStudio(data.userId ?? null, email);

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count } = await supabaseAdmin
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("contact_email", email)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) {
      throw new Error("Too many submissions. Please try again later.");
    }

    const { data: dupe } = await supabaseAdmin
      .from("submissions")
      .select("id, submitted_by")
      .eq("contact_email", email)
      .eq("business_name", data.businessName)
      .eq("status", "pending")
      .maybeSingle();
    if (dupe) {
      if (data.userId && !dupe.submitted_by) {
        await supabaseAdmin.from("submissions").update({ submitted_by: data.userId }).eq("id", dupe.id);
      }
      return { ok: true, duplicate: true };
    }

    const { error, data: created } = await supabaseAdmin.from("submissions").insert({
      business_name: data.businessName,
      city: data.city,
      address: data.address || null,
      website: data.website || null,
      contact_email: email,
      contact_phone: data.contactPhone || null,
      notes: data.notes || null,
      submitted_by: data.userId ?? null,
    }).select("id").maybeSingle();
    if (error) fail(error);

    // Confirmation to the person who submitted — sent to their account email
    // when they have one, otherwise the address on the form.
    try {
      let recipient = email;
      if (data.userId) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("id", data.userId)
          .maybeSingle();
        if (profile?.email) recipient = profile.email;
      }
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      await sendTemplateEmail("submission-received", recipient, {
        idempotencyKey: `submission-${created?.id ?? email}-received`,
        templateData: {
          studioName: data.businessName,
          actionUrl: "https://intearior.com/dashboard",
        },
      });
    } catch (e) {
      console.error("submission confirmation email failed", e);
    }

    // Internal alert — best-effort, never blocks the submission.
    try {
      const { sendOpsAlert } = await import("@/lib/email-templates/ops.server");
      await sendOpsAlert("submission-received-admin", {
        idempotencyKey: `submission-${email}-${data.businessName}-${Date.now()}`,
        templateData: {
          title: "New studio submission awaiting review",
          lines: [
            `Studio: ${data.businessName}`,
            `City: ${data.city}`,
            `From: ${email}`,
            data.website ? `Website: ${data.website}` : "",
          ].filter(Boolean),
          actionUrl: "https://intearior.com/admin?tab=submissions",
          actionLabel: "Review submission",
        },
      });
    } catch (e) {
      console.error("submission ops alert failed", e);
    }

    return { ok: true, duplicate: false };
  });
