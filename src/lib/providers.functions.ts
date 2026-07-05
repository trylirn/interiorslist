import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PROVIDER_COLS =
  "place_id, slug, name, city, city_slug, address, website, specialists, credentials, notes, brand_id, branch_label, is_verified, badges, services, services_raw, about_description, social_links, gallery_urls, video_urls, certificate_urls, hero_photo_url, rating, review_count";

// Explicit safe column list for the public provider detail page.
// Excludes private fields: email, email_forward_to, document_urls.
const PROVIDER_DETAIL_COLS =
  PROVIDER_COLS +
  ", phone, latitude, longitude, published, claimed_by, business_status, state, hours, price_ranges, skin_types, recovery_tags, personality, team, before_after_urls, google_maps_url, postal_code";


const cityArg = z.object({
  citySlug: z.string().min(1).max(80),
  service: z.string().min(1).max(80).optional(),
  sort: z.enum(["name", "verified"]).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export const listProvidersByCity = createServerFn({ method: "GET" })
  .inputValidator((d) => cityArg.parse(d))
  .handler(async ({ data }) => {
    let q = supabaseAdmin.from("providers").select(PROVIDER_COLS).eq("city_slug", data.citySlug).eq("published", true);
    if (data.service) q = q.contains("services", [data.service]);
    q = q.order("is_verified", { ascending: false }).order("name").limit(data.limit ?? 100);
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
    if (!provider) return { provider: null, reviews: [], brandSiblings: [] };

    const { data: reviews } = await supabaseAdmin
      .from("reviews")
      .select("id, author_name, author_photo, rating, text, relative_time, published_at")
      .eq("provider_place_id", provider.place_id)
      .order("published_at", { ascending: false })
      .limit(20);

    let brandSiblings: Array<{ slug: string; city: string; branch_label: string | null }> = [];
    if (provider.brand_id) {
      const { data: siblings } = await supabaseAdmin
        .from("providers")
        .select("slug, city, branch_label")
        .eq("brand_id", provider.brand_id)
        .neq("place_id", provider.place_id)
        .order("city");
      brandSiblings = siblings ?? [];
    }
    return { provider, reviews: reviews ?? [], brandSiblings };
  });

export const getFeaturedProviders = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("providers")
    .select(PROVIDER_COLS)
    .eq("is_verified", true)
    .eq("published", true)
    .order("name")
    .limit(8);
  if (error) throw new Error(error.message);
  return { providers: data ?? [] };
});

export const getCityStats = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("providers").select("city_slug").eq("published", true);
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.city_slug] = (counts[row.city_slug] ?? 0) + 1;
  return { counts };
});

export const searchProviders = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      q: z.string().max(120).optional(),
      city: z.string().max(80).optional(),
      service: z.string().max(80).optional(),
      sort: z.enum(["verified", "name", "rating"]).optional(),
      limit: z.number().int().min(1).max(120).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin.from("providers").select(PROVIDER_COLS).eq("published", true);
    const term = (data.q ?? "").replace(/[,()*%\\]/g, " ").trim();
    if (term) q = q.or(`name.ilike.%${term}%,specialists.ilike.%${term}%,city.ilike.%${term}%,about_description.ilike.%${term}%`);
    if (data.city) q = q.eq("city_slug", data.city);
    if (data.service) q = q.contains("services", [data.service]);
    const sort = data.sort ?? "verified";
    if (sort === "rating") q = q.order("rating", { ascending: false, nullsFirst: false }).order("name");
    else if (sort === "name") q = q.order("name");
    else q = q.order("is_verified", { ascending: false }).order("rating", { ascending: false, nullsFirst: false }).order("name");
    q = q.limit(data.limit ?? 120);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { providers: rows ?? [] };
  });

export const getRelatedProviders = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { data: me } = await supabaseAdmin
      .from("providers")
      .select("place_id, city_slug, services")
      .eq("place_id", data.placeId)
      .maybeSingle();
    if (!me) return { providers: [] };
    // Step 1: same city, overlapping services
    let related: any[] = [];
    if ((me.services ?? []).length > 0) {
      const { data: rows } = await supabaseAdmin
        .from("providers")
        .select(PROVIDER_COLS)
        .eq("city_slug", me.city_slug)
        .eq("published", true)
        .neq("place_id", me.place_id)
        .overlaps("services", me.services as string[])
        .limit(8);
      related = rows ?? [];
    }
    // Fallback: same city top-rated
    if (related.length < 4) {
      const { data: rows } = await supabaseAdmin
        .from("providers")
        .select(PROVIDER_COLS)
        .eq("city_slug", me.city_slug)
        .eq("published", true)
        .neq("place_id", me.place_id)
        .order("is_verified", { ascending: false })
        .order("rating", { ascending: false, nullsFirst: false })
        .limit(8);
      const have = new Set(related.map((r) => r.place_id));
      for (const r of rows ?? []) {
        if (related.length >= 4) break;
        if (!have.has(r.place_id)) related.push(r);
      }
    }
    return { providers: related.slice(0, 4) };
  });

export const listBrands = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("brands")
    .select("id, slug, name, website, description")
    .order("name");
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((b) => b.id);
  const counts: Record<string, number> = {};
  if (ids.length) {
    const { data: branches } = await supabaseAdmin.from("providers").select("brand_id").in("brand_id", ids);
    for (const r of branches ?? []) if (r.brand_id) counts[r.brand_id] = (counts[r.brand_id] ?? 0) + 1;
  }
  return { brands: (data ?? []).map((b) => ({ ...b, branchCount: counts[b.id] ?? 0 })) };
});

export const getBrandBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(160) }).parse(d))
  .handler(async ({ data }) => {
    const { data: brand, error } = await supabaseAdmin
      .from("brands")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!brand) return { brand: null, branches: [] };
    const { data: branches } = await supabaseAdmin
      .from("providers")
      .select(PROVIDER_COLS)
      .eq("brand_id", brand.id)
      .order("city");
    return { brand, branches: branches ?? [] };
  });

export const listByTreatment = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ service: z.string().min(1).max(80), city: z.string().max(80).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin.from("providers").select(PROVIDER_COLS).contains("services", [data.service]).eq("published", true);
    if (data.city) q = q.eq("city_slug", data.city);
    q = q.order("name").limit(100);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { providers: rows ?? [] };
  });
