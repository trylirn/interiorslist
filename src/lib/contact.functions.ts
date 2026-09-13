import { fail } from "@/lib/errors";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        placeId: z.string().min(1).max(160),
        firstName: z.string().min(1).max(80),
        lastName: z.string().min(1).max(80),
        email: z.string().email().max(255),
        phone: z.string().min(7).max(40),
        message: z.string().min(1).max(4000),
        location: z.string().max(160).optional().or(z.literal("")),
        projectType: z.string().max(160).optional().or(z.literal("")),
        budget: z.string().max(120).optional().or(z.literal("")),
        style: z.string().max(200).optional().or(z.literal("")),
        timeline: z.string().max(120).optional().or(z.literal("")),
        rooms: z.string().max(300).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { enforceRateLimit } = await import("@/lib/rate-limit.server");
    await enforceRateLimit("contact", { max: 5, windowMinutes: 60 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inserted, error } = await supabaseAdmin
      .from("contact_messages")
      .insert({
        provider_place_id: data.placeId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone || null,
        message: data.message,
        location: data.location || null,
        project_type: data.projectType || null,
        budget: data.budget || null,
        style: data.style || null,
        timeline: data.timeline || null,
        rooms: data.rooms || null,
      })
      .select("id")
      .single();
    if (error) fail(error);

    // Forward the lead to the studio by email. The lead is already saved — an
    // email failure must never lose or block it, so this is best-effort.
    const leadId = inserted?.id ?? crypto.randomUUID();
    let providerName: string | undefined;

    try {
      const { data: provider } = await supabaseAdmin
        .from("providers")
        .select("name, slug, email, email_forward_to")
        .eq("place_id", data.placeId)
        .maybeSingle();
      providerName = provider?.name ?? undefined;
      const recipient = provider?.email_forward_to || provider?.email || null;
      const templateData = {
        studioName: providerName,
        clientName: `${data.firstName} ${data.lastName}`.trim(),
        clientEmail: data.email,
        clientPhone: data.phone || undefined,
        location: data.location || undefined,
        projectType: data.projectType || undefined,
        rooms: data.rooms || undefined,
        budget: data.budget || undefined,
        style: data.style || undefined,
        timeline: data.timeline || undefined,
        message: data.message,
        dashboardUrl: "https://intearior.com/dashboard",
      };

      if (recipient) {
        const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
        await sendTemplateEmail("new-lead", recipient, {
          templateData,
          idempotencyKey: `new-lead-${leadId}`,
        });
      } else {
        // Unclaimed studio or no contact address on file → alert every admin and
        // super admin with the full lead so it can be followed up manually.
        const { sendOpsAlert } = await import("@/lib/email-templates/ops.server");
        await sendOpsAlert("new-lead", {
          idempotencyKey: `new-lead-${leadId}-ops`,
          templateData: {
            ...templateData,
            studioName: providerName ? `${providerName} (no contact email on file)` : "Unclaimed studio",
            dashboardUrl: "https://intearior.com/admin?tab=orphanleads",
          },
        });
      }
    } catch (emailError) {
      console.error("Lead email forwarding failed:", emailError);
    }

    // Confirmation to the homeowner, attempted independently so a forwarding
    // failure never leaves the enquiry unacknowledged.
    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      await sendTemplateEmail("enquiry-confirmation", data.email, {
        templateData: {
          clientName: data.firstName,
          studioNames: providerName ? [providerName] : [],
          message: data.message,
          searchUrl: "https://intearior.com/search",
        },
        idempotencyKey: `enquiry-confirm-${leadId}`,
      });
    } catch (emailError) {
      console.error("Enquiry confirmation email failed:", emailError);
    }
    return { ok: true };
  });

// Authenticated: signed-in users can post a review. Email captured for moderation.
export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        placeId: z.string().min(1).max(160),
        authorName: z.string().trim().min(1).max(120),
        email: z.string().trim().email().max(255),
        rating: z.number().int().min(1).max(5),
        text: z.string().max(4000).optional().or(z.literal("")),
        clientType: z.string().max(80).optional().or(z.literal("")),
        isCurrentClient: z.string().max(40).optional().or(z.literal("")),
        startYear: z.number().int().min(1950).max(2100).nullable().optional(),
        endYear: z.number().int().min(1950).max(2100).nullable().optional(),
        decisionFactors: z.string().max(2000).optional().or(z.literal("")),
        ratingCommunication: z.number().int().min(1).max(5).nullable().optional(),
        ratingResults: z.number().int().min(1).max(5).nullable().optional(),
        ratingCleanliness: z.number().int().min(1).max(5).nullable().optional(),
        ratingValue: z.number().int().min(1).max(5).nullable().optional(),
        relationshipDisclosure: z.string().max(200).optional().or(z.literal("")),
        benefitDisclosure: z.string().max(200).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("reviews").insert({
      provider_place_id: data.placeId,
      author_name: data.authorName,
      email: data.email,
      rating: data.rating,
      text: data.text || null,
      relative_time: "just now",
      published_at: new Date().toISOString(),
      client_type: data.clientType || null,
      is_current_client: data.isCurrentClient || null,
      start_year: data.startYear ?? null,
      end_year: data.endYear ?? null,
      decision_factors: data.decisionFactors || null,
      rating_communication: data.ratingCommunication ?? null,
      rating_results: data.ratingResults ?? null,
      rating_cleanliness: data.ratingCleanliness ?? null,
      rating_value: data.ratingValue ?? null,
      relationship_disclosure: data.relationshipDisclosure || null,
      benefit_disclosure: data.benefitDisclosure || null,
    });
    if (error) fail(error);
    return { ok: true };
  });

