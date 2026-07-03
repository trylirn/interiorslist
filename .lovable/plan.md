## Add a location map to every medspa page

Embed an interactive Google Map on each provider detail page (`/provider/$slug`) showing the medspa's location with a marker, using the existing Google Maps connector — no new API keys or setup required.

### What the user will see

- A new "Location" section on every medspa page with:
  - An interactive map (~360px tall) centered on the provider's address, with a pin marker
  - The full address displayed above the map
  - A "Get directions" link that opens Google Maps in a new tab
- Graceful fallback: if the address can't be geocoded, the section just shows the address text and directions link (no broken map).

### How it works (technical)

**Geocoding (one-time per provider, cached in DB):**
- Add `latitude double precision` and `longitude double precision` columns to `providers`.
- New server function `geocodeProviderIfNeeded({ placeId })` that:
  - Skips if the provider already has lat/lng
  - Calls Google Geocoding API via the connector gateway (`/maps/api/geocode/json`) using `SUPABASE_URL` server env + `LOVABLE_API_KEY` + `GOOGLE_MAPS_API_KEY`
  - Persists the result via `supabaseAdmin`
- `getProviderBySlug` returns `latitude`/`longitude` in its select, and lazily triggers geocoding on the server if missing (fire-and-forget so first page load isn't blocked).
- Backfill migration is out of scope — coords fill in as pages are visited. (Optional follow-up: a one-shot admin endpoint to bulk geocode.)

**Map component (browser):**
- New `src/components/provider-map.tsx` — a client-only component that:
  - Loads the Maps JS API asynchronously using `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY` with `loading=async` and a `callback=initMap` global, plus the tracking `channel` param
  - Uses a shared loader (idempotent, singleton promise) so multiple mounts / navigations don't re-inject the script
  - Renders `google.maps.Map` + `google.maps.Marker` (not `AdvancedMarkerElement`, no `mapId`)
  - Skips render entirely if lat/lng are missing

**Wiring:**
- `src/routes/_site.provider.$slug.tsx` renders `<ProviderMap lat={...} lng={...} name={...} address={...} />` in a new "Location" section, placed after the About section and before the reviews / related providers.

### Files touched

New:
- `supabase/migrations/<ts>_add_provider_coordinates.sql` — add `latitude`, `longitude` columns
- `src/lib/geocode.functions.ts` — `geocodeProviderIfNeeded` server function
- `src/components/provider-map.tsx` — Google Maps embed component
- `src/lib/google-maps-loader.ts` — small singleton script loader

Edited:
- `src/lib/providers.functions.ts` — include `latitude`, `longitude` in `getProviderBySlug`'s select; kick off geocoding if missing
- `src/routes/_site.provider.$slug.tsx` — render the new Location section

### Out of scope (can follow up)

- Bulk backfill of coordinates for all 161 existing providers (they'll fill in on first visit; happy to add an admin one-shot if you want it now)
- Map on city/search/brand listing pages (aggregate map with multiple pins)
- Custom-branded marker icon / info window styling
