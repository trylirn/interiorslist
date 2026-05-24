# TexasInjectors — Aesthetic Injector Directory

A samslist-style directory for aesthetic injectors (Botox, fillers, etc.) across Texas's top 10 metros, seeded from Google Maps and refreshed periodically.

## Scope

**Metros (initial seed):** Houston, Dallas, Austin, San Antonio, Fort Worth, El Paso, Arlington, Plano, Corpus Christi, Lubbock.

**Search terms used for seeding:** "aesthetic injector", "botox", "medspa", "dermal filler" — filtered to currently-operating businesses (`businessStatus = OPERATIONAL`).

## Pages / Routes

- `/` — Hero, search bar (city + service), featured metros, top-rated picks, trust signals
- `/tx/$city` — City landing page (SEO): listings + filters (service, rating, price, open-now)
- `/provider/$slug` — Detail page: hero photo, rating, hours, address + embedded map, services, Google reviews, phone/website CTAs, "claim this listing", favorite/compare buttons
- `/search` — Global search results
- `/compare` — Side-by-side comparison of up to 3 saved providers
- `/favorites` — Saved providers (per user)
- `/claim/$slug` — Owner claim form (auth required)
- `/submit` — Submit a missing business
- `/login`, `/signup` — Auth (email + Google)
- `/dashboard` — For claimed-business owners to edit their listing
- `/about`, `/contact`

Each route gets its own `head()` metadata (title, description, og:title, og:description). Provider pages use the business hero photo as `og:image`.

## Design

I will generate **3 distinct rendered design directions** for a Texas-flavored, trustworthy, beauty-industry directory. You pick one before I build. Locked constraints across all three: directory layout with prominent search, listing cards, detail pages.

## Data Model (Lovable Cloud / Postgres)

```text
providers          place_id (PK), name, slug, city, address, lat, lng,
                   phone, website, rating, review_count, price_level,
                   hours_json, photos_json, services[], business_status,
                   claimed_by (FK users, null), last_synced_at
reviews            id, provider_place_id, author, rating, text, time
services           id, name, slug   -- Botox, Filler, Sculptra, Kybella, PRP...
favorites          user_id, provider_place_id, created_at
claims             id, provider_place_id, user_id, status, submitted_at,
                   verification_notes
submissions        id, name, city, contact_email, status, payload_json
profiles           id (= auth.uid), email, display_name, role
user_roles         user_id, role ('user'|'owner'|'admin')   -- separate table
```

RLS: providers/reviews/services are public read; favorites/claims scoped to `auth.uid`; admin role gates submission approval and listing edits not yet claimed.

## Data Pipeline

**Seeding (`/api/public/seed` — admin-protected server route, idempotent):**
1. For each metro × search term, call Google Maps Places API (New) `places:searchText` via the connector gateway.
2. For each result, fetch `places/v1/places/{id}` for hours, photos, reviews.
3. Filter `businessStatus === 'OPERATIONAL'`, upsert into `providers`, store reviews.
4. Generate slug `{name}-{city}`.

**Refresh:** Same endpoint with `?refresh=true` — re-syncs records older than 30 days. Triggered manually (or pg_cron later).

**Live detail refresh:** When a provider page loads and `last_synced_at > 14 days`, a server fn re-pulls reviews/hours in the background.

## Integrations needed

- **Lovable Cloud** — database, auth (email + Google), RLS
- **Google Maps Platform connector** — Places API (New) for seeding + Maps JS for embedded map on detail pages

## Features

- City + service + min-rating filters with URL state
- Sort by rating, review count, distance (when user grants geolocation)
- Favorites (logged-in) with localStorage fallback for guests
- Compare up to 3 providers side-by-side
- Claim listing flow: user signs in → submits claim with proof → admin approves → role upgraded to `owner` → can edit hours/services/photos
- Submit new business (anyone, queued for admin review)
- Mobile-responsive throughout

## Technical Notes

- TanStack Start, server functions for all DB/Places calls
- `createServerFn` for reads/writes; `/api/public/*` only for the seed/refresh endpoint (admin-token gated)
- Maps JS uses `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`; all Places lookups go through the gateway
- Tanstack Query for caching with `useSuspenseQuery`
- Slug-based URLs everywhere for SEO; JSON-LD `LocalBusiness` schema on detail pages
- Zod validation on every server fn input

## Build Order

1. Enable Lovable Cloud + connect Google Maps Platform
2. Generate 3 design directions → you pick one
3. DB schema + RLS + auth
4. Seeding endpoint → run for all 10 metros
5. Home, city, and detail pages with chosen design
6. Filters, search, favorites, compare
7. Claim/submit + owner dashboard
8. SEO polish (meta, sitemap, JSON-LD)

## Disclaimers

We'll add a footer disclaimer: data sourced from Google Maps, not medical advice, verify credentials directly with providers. This protects you legally given the medical-adjacent niche.