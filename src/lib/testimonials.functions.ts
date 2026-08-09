import { createServerFn } from "@tanstack/react-start";

export const listFeaturedTestimonials = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select("id, author, location, treatment, quote, rating")
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw new Error(error.message);
  return { testimonials: data ?? [] };
});
