/**
 * Admin seeding endpoint — populates the providers table from Google Maps.
 * Auth: requires Bearer token matching SUPABASE_SERVICE_ROLE_KEY OR the
 * project's anon key plus an x-seed-admin header equal to the service key.
 *
 * Usage:
 *   POST /api/public/seed             -> seed all cities (skips already-seeded)
 *   POST /api/public/seed?city=austin -> seed one city
 *   POST /api/public/seed?refresh=1   -> re-sync rows older than 30 days
 */
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TEXAS_CITIES, slugify } from "@/lib/cities";
import {
  searchPlacesText,
  fetchPlaceDetails,
  resolvePhotoUri,
  type PlaceSearchResult,
} from "@/lib/google-places.server";

const SEARCH_TERMS = [
  "aesthetic injector",
  "botox clinic",
  "medspa botox filler",
  "lip filler",
];

function inferServices(text: string): string[] {
  const t = text.toLowerCase();
  const out: string[] = [];
  if (/botox|neurotoxin|dysport|xeomin|jeuveau/.test(t)) out.push("botox");
  if (/lip filler|lip aug/.test(t)) out.push("lip-filler");
  if (/filler|juvederm|restylane|rha/.test(t)) out.push("fillers");
  if (/sculptra/.test(t)) out.push("sculptra");
  if (/kybella/.test(t)) out.push("kybella");
  if (/\bprp\b|\bprf\b|platelet/.test(t)) out.push("prp");
  if (/microneedl|skinpen/.test(t)) out.push("microneedling");
  if (/chemical peel/.test(t)) out.push("chemical-peels");
  if (/iv therapy|iv drip|vitamin drip/.test(t)) out.push("iv-therapy");
  return Array.from(new Set(out));
}

function pickCityComponent(p: PlaceSearchResult, cityName: string): boolean {
  const comps = p.addressComponents ?? [];
  const stateOk = comps.some((c) => c.types.includes("administrative_area_level_1") && c.shortText === "TX");
  if (!stateOk) return false;
  const localityName = comps.find((c) => c.types.includes("locality"))?.longText?.toLowerCase();
  return !localityName || localityName.includes(cityName.toLowerCase()) || cityName.toLowerCase().includes(localityName);
}

async function seedCity(citySlug: string, opts: { refresh: boolean }) {
  const city = TEXAS_CITIES.find((c) => c.slug === citySlug);
  if (!city) return { citySlug, error: "unknown city" };

  const seen = new Set<string>();
  const allResults: PlaceSearchResult[] = [];
  for (const term of SEARCH_TERMS) {
    const query = `${term} in ${city.name}, TX`;
    try {
      const results = await searchPlacesText(query, { pageSize: 20 });
      for (const r of results) {
        if (!r.id || seen.has(r.id)) continue;
        if (r.businessStatus && r.businessStatus !== "OPERATIONAL") continue;
        if (!pickCityComponent(r, city.name)) continue;
        seen.add(r.id);
        allResults.push(r);
      }
    } catch (e) {
      console.error(`searchText failed for ${query}`, e);
    }
  }

  let inserted = 0, updated = 0, skipped = 0;
  for (const r of allResults) {
    const { data: existing } = await supabaseAdmin
      .from("providers")
      .select("place_id, last_synced_at")
      .eq("place_id", r.id)
      .maybeSingle();

    if (existing && !opts.refresh) { skipped++; continue; }
    if (existing && opts.refresh) {
      const ageDays = (Date.now() - new Date(existing.last_synced_at).getTime()) / 86400000;
      if (ageDays < 30) { skipped++; continue; }
    }

    // Fetch full details
    let details: Awaited<ReturnType<typeof fetchPlaceDetails>>;
    try { details = await fetchPlaceDetails(r.id); }
    catch (e) { console.error(`details failed ${r.id}`, e); continue; }

    if (details.businessStatus && details.businessStatus !== "OPERATIONAL") { skipped++; continue; }

    const name = details.displayName?.text ?? r.displayName?.text ?? "Unknown";
    const baseSlug = slugify(`${name} ${city.name}`);
    const summary = details.editorialSummary?.text ?? "";
    const services = inferServices(`${name} ${summary}`);

    // Hero photo
    let heroUrl: string | null = null;
    if (details.photos?.[0]) {
      heroUrl = await resolvePhotoUri(details.photos[0].name, 1600);
    }

    const row = {
      place_id: r.id,
      slug: baseSlug,
      name,
      city: city.name,
      city_slug: city.slug,
      state: "TX",
      address: details.formattedAddress ?? null,
      lat: details.location?.latitude ?? null,
      lng: details.location?.longitude ?? null,
      phone: details.nationalPhoneNumber ?? null,
      website: details.websiteUri ?? null,
      rating: details.rating ?? null,
      review_count: details.userRatingCount ?? 0,
      hours_json: details.regularOpeningHours ?? null,
      photos_json: details.photos?.slice(0, 6) ?? null,
      services,
      hero_photo_url: heroUrl,
      google_maps_url: details.googleMapsUri ?? null,
      business_status: details.businessStatus ?? "OPERATIONAL",
      last_synced_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from("providers").upsert(row, { onConflict: "place_id" });
    if (error) { console.error(`upsert failed for ${name}: ${error.message}`); continue; }
    if (existing) updated++; else inserted++;

    // Reviews
    if (details.reviews) {
      await supabaseAdmin.from("reviews").delete().eq("provider_place_id", r.id);
      const reviewRows = details.reviews.slice(0, 8).map((rv) => ({
        provider_place_id: r.id,
        author_name: rv.authorAttribution?.displayName ?? null,
        author_photo: rv.authorAttribution?.photoUri ?? null,
        rating: rv.rating ?? null,
        text: rv.text?.text ?? null,
        relative_time: rv.relativePublishTimeDescription ?? null,
        published_at: rv.publishTime ?? null,
      }));
      if (reviewRows.length) await supabaseAdmin.from("reviews").insert(reviewRows);
    }
  }

  return { citySlug, found: allResults.length, inserted, updated, skipped };
}

export const Route = createFileRoute("/api/public/seed")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        const token = auth?.replace(/^Bearer\s+/i, "");
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey || token !== serviceKey) {
          return new Response("Unauthorized", { status: 401 });
        }

        const url = new URL(request.url);
        const onlyCity = url.searchParams.get("city");
        const refresh = url.searchParams.get("refresh") === "1" || url.searchParams.get("refresh") === "true";

        const cities = onlyCity ? [onlyCity] : TEXAS_CITIES.map((c) => c.slug);
        const results = [];
        for (const c of cities) {
          // Sequential to respect rate limits
          const r = await seedCity(c, { refresh });
          results.push(r);
        }

        return new Response(JSON.stringify({ ok: true, results }, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      },
      GET: async () => new Response("Use POST with Bearer service key", { status: 405 }),
    },
  },
});
