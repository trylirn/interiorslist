import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const sendContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        placeId: z.string().min(1).max(160),
        firstName: z.string().min(1).max(80),
        lastName: z.string().min(1).max(80),
        email: z.string().email().max(255),
        phone: z.string().max(40).optional().or(z.literal("")),
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

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        placeId: z.string().min(1).max(160),
        authorName: z.string().min(1).max(120),
        rating: z.number().int().min(1).max(5),
        text: z.string().max(4000).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("reviews").insert({
      provider_place_id: data.placeId,
      author_name: data.authorName,
      rating: data.rating,
      text: data.text || null,
      relative_time: "just now",
      published_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
