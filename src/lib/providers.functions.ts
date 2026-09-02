import { fail } from "@/lib/errors";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { fetchAllPublished } from "./providers.server";

type ProviderRow = Database["public"]["Tables"]["providers"]["Row"];
// Public detail projection — excludes private fields (email, email_forward_to, document_urls).
type ProviderDetail = Omit<ProviderRow, "email" | "email_forward_to" | "document_urls">;

const PROVIDER_COLS =
  "place_id, slug, name, city, city_slug, address, specialists, credentials, notes, branch_label, is_verified, badges, services, styles, services_raw, about_description, social_links, gallery_urls, video_urls, certificate_urls, hero_photo_url, logo_url, rating, review_count";


const PROVIDER_DETAIL_COLS =
  PROVIDER_COLS +
  ", latitude, longitude, published, claimed_by, business_status, state, hours, price_ranges, skin_types, recovery_tags, personality, team, before_after_urls, google_maps_url, postal_code, founded_year, years_in_business, service_area, service_area_note, team_size, client_types, not_a_fit, price_tier, typical_project_budget, remote_services";



const cityArg = z.object({
  citySlug: z.string().min(1).max(80),
  service: z.string().min(1).max(80).optional(),
  sort: z.enum(["name", "verified"]).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export const listProvidersByCity = createServerFn({ method: "GET" })
  .inputValidator((d) => cityArg.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("providers").select(PROVIDER_COLS).eq("city_slug", data.citySlug).eq("published", true);
    if (data.service) q = q.contains("services", [data.service]);
    q = q.order("is_verified", { ascending: false }).order("name").limit(data.limit ?? 100);
    const { data: rows, error } = await q;
    if (error) fail(error);
    return { providers: rows ?? [] };
  });

export const getProviderBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(160) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: provider, error } = await supabaseAdmin
      .from("providers")
      .select(PROVIDER_DETAIL_COLS)
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle<ProviderDetail>();
    if (error) fail(error);
    if (!provider) return { provider: null, reviews: [] };

    // Best-effort: warm coords for maps when we have an address but no lat/lng.
    if ((provider.latitude == null || provider.longitude == null) && provider.address) {
      try {
        const { ensureProviderCoords } = await import("./geocode.functions");
        const loc = await ensureProviderCoords(provider.place_id);
        if (loc) {
          (provider as any).latitude = loc.lat;
          (provider as any).longitude = loc.lng;
        }
      } catch {
        // ignore — map falls back to "Get directions"
      }
    }

    const { data: reviews } = await supabaseAdmin
      .from("reviews")
      .select("id, author_name, author_photo, rating, text, relative_time, published_at")
      .eq("provider_place_id", provider.place_id)
      .order("published_at", { ascending: false })
      .limit(20);

    // Never expose the owner's user id publicly — only whether it is claimed.
    const { claimed_by, ...safe } = provider as ProviderDetail & { claimed_by?: string | null };
    return { provider: { ...safe, is_claimed: !!claimed_by }, reviews: reviews ?? [] };
  });


export const getFeaturedProviders = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("providers")
    .select(PROVIDER_COLS)
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("is_verified", { ascending: false })
    .order("rating", { ascending: false, nullsFirst: false })
    .order("review_count", { ascending: false, nullsFirst: false })
    .order("name")
    .limit(8);
  if (error) fail(error);
  return { providers: data ?? [] };
});

export const getCityStats = createServerFn({ method: "GET" }).handler(async () => {
  const data = await fetchAllPublished<{ city_slug: string }>("city_slug");
  const counts: Record<string, number> = {};
  for (const row of data) counts[row.city_slug] = (counts[row.city_slug] ?? 0) + 1;
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
    if (error) fail(error);
    return { providers: rows ?? [] };
  });

export const getRelatedProviders = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(200), limit: z.number().int().min(1).max(12).optional() }).parse(d))
  .handler(async ({ data }) => {
    const max = data.limit ?? 4;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
        .limit(max);
      related = rows ?? [];
    }
    // Fallback: same city top-rated
    if (related.length < max) {
      const { data: rows } = await supabaseAdmin
        .from("providers")
        .select(PROVIDER_COLS)
        .eq("city_slug", me.city_slug)
        .eq("published", true)
        .neq("place_id", me.place_id)
        .order("is_verified", { ascending: false })
        .order("rating", { ascending: false, nullsFirst: false })
        .limit(max);
      const have = new Set(related.map((r) => r.place_id));
      for (const r of rows ?? []) {
        if (related.length >= max) break;
        if (!have.has(r.place_id)) related.push(r);
      }
    }
    return { providers: related.slice(0, max) };
  });

// Haversine distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const getNearbyProviders = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: me } = await supabaseAdmin
      .from("providers")
      .select("place_id, city_slug, latitude, longitude")
      .eq("place_id", data.placeId)
      .maybeSingle();
    if (!me) return { providers: [] };

    // Path A: geographic distance when coords available.
    if (me.latitude != null && me.longitude != null) {
      const { data: rows } = await supabaseAdmin
        .from("providers")
        .select(PROVIDER_COLS + ", latitude, longitude")
        .eq("published", true)
        .neq("place_id", me.place_id)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(500);
      const scored = (rows ?? [])
        .map((r: any) => ({
          ...r,
          _km: haversineKm(me.latitude as number, me.longitude as number, r.latitude, r.longitude),
        }))
        .sort((a, b) => a._km - b._km)
        .slice(0, 6);
      if (scored.length) return { providers: scored };
    }

    // Path B: fallback — same city, then just top-rated.
    const { data: rows } = await supabaseAdmin
      .from("providers")
      .select(PROVIDER_COLS)
      .eq("city_slug", me.city_slug)
      .eq("published", true)
      .neq("place_id", me.place_id)
      .order("is_verified", { ascending: false })
      .order("rating", { ascending: false, nullsFirst: false })
      .limit(6);
    return { providers: rows ?? [] };
  });

export const listByTreatment = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ service: z.string().min(1).max(80), city: z.string().max(80).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("providers").select(PROVIDER_COLS).contains("services", [data.service]).eq("published", true);
    if (data.city) q = q.eq("city_slug", data.city);
    q = q.order("is_verified", { ascending: false }).order("rating", { ascending: false, nullsFirst: false }).order("name").limit(100);
    const { data: rows, error } = await q;
    if (error) fail(error);
    return { providers: rows ?? [] };
  });

// Cities that have ≥1 provider offering this treatment — for local-intent interlinks.
export const listCitiesForTreatment = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ service: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("providers")
      .select("city_slug, city")
      .contains("services", [data.service])
      .eq("published", true);
    const counts = new Map<string, { slug: string; name: string; count: number }>();
    for (const r of rows ?? []) {
      if (!r.city_slug) continue;
      const cur = counts.get(r.city_slug) ?? { slug: r.city_slug, name: r.city ?? r.city_slug, count: 0 };
      cur.count += 1;
      counts.set(r.city_slug, cur);
    }
    return { cities: Array.from(counts.values()).sort((a, b) => b.count - a.count) };
  });

/* ------------------------------------------------------------------ */
/* Geography — derived from the real data, not a hand-written list.    */
/* ------------------------------------------------------------------ */

export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky",
  LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

export const listStates = createServerFn({ method: "GET" }).handler(async () => {
  const data = await fetchAllPublished<{ state: string | null }>("state");
  const counts = new Map<string, number>();
  for (const r of data) {
    const s = (r.state ?? "").toUpperCase();
    if (!s) continue;
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  const states = Array.from(counts.entries())
    .map(([code, count]) => ({ code, name: STATE_NAMES[code] ?? code, slug: code.toLowerCase(), count }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { states };
});

export const getStateSummary = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ state: z.string().min(2).max(2) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.state.toUpperCase();
    const { data: rows, error } = await supabaseAdmin
      .from("providers")
      .select("city, city_slug")
      .eq("state", code)
      .eq("published", true);
    if (error) fail(error);
    const cities = new Map<string, { slug: string; name: string; count: number }>();
    for (const r of rows) {
      if (!r.city_slug) continue;
      const cur = cities.get(r.city_slug) ?? { slug: r.city_slug, name: r.city ?? r.city_slug, count: 0 };
      cur.count += 1;
      cities.set(r.city_slug, cur);
    }
    const { data: top } = await supabaseAdmin
      .from("providers")
      .select(PROVIDER_COLS)
      .eq("state", code)
      .eq("published", true)
      .order("is_verified", { ascending: false })
      .order("rating", { ascending: false, nullsFirst: false })
      .order("name")
      .limit(12);
    return {
      code,
      name: STATE_NAMES[code] ?? code,
      total: rows?.length ?? 0,
      cities: Array.from(cities.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      providers: top ?? [],
    };
  });

/** Top cities by real studio count — used by the footer and home page. */
export const listTopCities = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ limit: z.number().int().min(1).max(60).optional() }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const rows = await fetchAllPublished<{ city: string | null; city_slug: string | null; state: string | null }>("city, city_slug, state");
    const map = new Map<string, { slug: string; name: string; state: string; count: number }>();
    for (const r of rows) {
      if (!r.city_slug) continue;
      const cur = map.get(r.city_slug) ?? { slug: r.city_slug, name: r.city ?? r.city_slug, state: (r.state ?? "").toUpperCase(), count: 0 };
      cur.count += 1;
      map.set(r.city_slug, cur);
    }
    return {
      cities: Array.from(map.values())
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, data?.limit ?? 24),
    };
  });

/** Resolve a city slug against real data (falls back to nothing when empty). */
export const getCitySummary = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ citySlug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("providers")
      .select("city, state")
      .eq("city_slug", data.citySlug)
      .eq("published", true)
      .limit(1);
    if (error) fail(error);
    const row = rows?.[0];
    if (!row) return { city: null };
    const code = (row.state ?? "").toUpperCase();
    return { city: { slug: data.citySlug, name: row.city ?? data.citySlug, state: code, stateName: STATE_NAMES[code] ?? code } };
  });

/** Paginated search used by /search. */
export const searchProvidersPaged = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      q: z.string().max(120).optional(),
      city: z.string().max(120).optional(),
      state: z.string().max(2).optional(),
      service: z.string().max(80).optional(),
      style: z.string().max(80).optional(),
      sort: z.enum(["verified", "name", "rating"]).optional(),
      page: z.number().int().min(1).max(500).optional(),
      pageSize: z.number().int().min(6).max(48).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const pageSize = data.pageSize ?? 24;
    const page = data.page ?? 1;
    const from = (page - 1) * pageSize;

    let q = supabaseAdmin.from("providers").select(PROVIDER_COLS, { count: "exact" }).eq("published", true);
    const term = (data.q ?? "").replace(/[,()*%\\]/g, " ").trim();
    if (term) q = q.or(`name.ilike.%${term}%,specialists.ilike.%${term}%,city.ilike.%${term}%,about_description.ilike.%${term}%`);
    if (data.city) q = q.eq("city_slug", data.city);
    if (data.state) q = q.eq("state", data.state.toUpperCase());
    if (data.service) q = q.contains("services", [data.service]);
    if (data.style) q = q.contains("styles", [data.style]);
    const sort = data.sort ?? "verified";
    if (sort === "rating") q = q.order("rating", { ascending: false, nullsFirst: false }).order("name");
    else if (sort === "name") q = q.order("name");
    else q = q.order("is_verified", { ascending: false }).order("rating", { ascending: false, nullsFirst: false }).order("name");

    const { data: rows, error, count } = await q.range(from, from + pageSize - 1);
    if (error) fail(error);
    const total = count ?? 0;
    return { providers: rows ?? [], total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
  });

/** Cities that actually have published studios, optionally scoped to a state. */
export const listCities = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ state: z.string().max(2).optional() }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const rows = await fetchAllPublished<{ city: string | null; city_slug: string | null; state: string | null }>(
      "city, city_slug, state",
      data?.state ? (q: any) => q.eq("state", data.state!.toUpperCase()) : undefined,
    );
    const map = new Map<string, { slug: string; name: string; state: string; count: number }>();
    for (const r of rows) {
      if (!r.city_slug) continue;
      const cur = map.get(r.city_slug) ?? { slug: r.city_slug, name: r.city ?? r.city_slug, state: (r.state ?? "").toUpperCase(), count: 0 };
      cur.count += 1;
      map.set(r.city_slug, cur);
    }
    return { cities: Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)) };
  });

/** Live directory totals for the homepage hero card. */
export const getDirectoryStats = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await fetchAllPublished<{ city_slug: string | null; state: string | null }>("city_slug, state");
  const cities = new Set<string>();
  const states = new Set<string>();
  for (const r of rows) {
    if (r.city_slug) cities.add(r.city_slug);
    const s = (r.state ?? "").toUpperCase().trim();
    if (s) states.add(s);
  }
  return { studios: rows.length, cities: cities.size, states: states.size };
});
