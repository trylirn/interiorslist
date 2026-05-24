import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const cityArg = z.object({
  citySlug: z.string().min(1).max(80),
  service: z.string().min(1).max(80).optional(),
  minRating: z.number().min(0).max(5).optional(),
  sort: z.enum(["rating", "reviews", "name"]).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export const listProvidersByCity = createServerFn({ method: "GET" })
  .inputValidator((d) => cityArg.parse(d))
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("providers")
      .select(
        "place_id, slug, name, city, city_slug, address, rating, review_count, services, hero_photo_url, phone, website"
      )
      .eq("business_status", "OPERATIONAL")
      .eq("city_slug", data.citySlug);

    if (data.service) q = q.contains("services", [data.service]);
    if (data.minRating) q = q.gte("rating", data.minRating);

    const sort = data.sort ?? "rating";
    if (sort === "rating") q = q.order("rating", { ascending: false, nullsFirst: false });
    else if (sort === "reviews") q = q.order("review_count", { ascending: false });
    else q = q.order("name");

    q = q.limit(data.limit ?? 60);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { providers: rows ?? [] };
  });

export const getProviderBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(160) }).parse(d))
  .handler(async ({ data }) => {
    const { data: provider, error } = await supabaseAdmin
      .from("providers")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!provider) return { provider: null, reviews: [] };
    const { data: reviews } = await supabaseAdmin
      .from("reviews")
      .select("id, author_name, author_photo, rating, text, relative_time, published_at")
      .eq("provider_place_id", provider.place_id)
      .order("published_at", { ascending: false })
      .limit(8);
    return { provider, reviews: reviews ?? [] };
  });

export const getFeaturedProviders = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("providers")
    .select(
      "place_id, slug, name, city, city_slug, rating, review_count, services, hero_photo_url, address"
    )
    .eq("business_status", "OPERATIONAL")
    .gte("rating", 4.5)
    .gte("review_count", 25)
    .order("review_count", { ascending: false })
    .limit(8);
  if (error) throw new Error(error.message);
  return { providers: data ?? [] };
});

export const getCityStats = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("providers")
    .select("city_slug")
    .eq("business_status", "OPERATIONAL");
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.city_slug] = (counts[row.city_slug] ?? 0) + 1;
  }
  return { counts };
});

export const searchProviders = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      q: z.string().min(1).max(120),
      city: z.string().max(80).optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("providers")
      .select(
        "place_id, slug, name, city, city_slug, rating, review_count, services, hero_photo_url, address"
      )
      .eq("business_status", "OPERATIONAL")
      .ilike("name", `%${data.q}%`);
    if (data.city) q = q.eq("city_slug", data.city);
    q = q.limit(40);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { providers: rows ?? [] };
  });
