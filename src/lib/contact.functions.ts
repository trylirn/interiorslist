import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
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
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      provider_place_id: data.placeId,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
    });
    if (error) throw new Error(error.message);
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
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

