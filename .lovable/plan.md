# Plan: Excel-backed directory + franchise model + trust features

The uploaded sheet has **101 verified TX medspas** across all 10 cities we already support (Houston 14, Dallas 6, Austin 7, San Antonio 7, Fort Worth 7, El Paso 11, Arlington 11, Plano 7, Corpus Christi 15, Lubbock 16). Columns: Name, Address, City, State, Email, Specialists, Website, Status, Notes. No phone, no coordinates, no photos, no hours, no rating, no reviews.

Because of that, I'm splitting the work into 3 phases. **Phase 1 is mandatory** to get the site working off the spreadsheet. Phases 2–3 are big — I'll do Phase 2 in this build and we can iterate on Phase 3 in a follow-up.

---

## Phase 1 — Rip out Google Maps, seed from the spreadsheet

**Remove**

- `src/lib/google-places.server.ts`
- `src/routes/api.public.seed.ts`
- `GOOGLE_MAPS_API_KEY` secret (kept until you confirm)
- All Google references in `_site.privacy.tsx` / `_site.terms.tsx` (replace with neutral "data sourced from publicly listed business info")
- `google_maps_url` field usage on the provider page → replace "Directions" button with a generic Maps link built from the address (Apple/Google universal `https://maps.google.com/?q=<address>` is fine, no API needed)

**Database migration**

- Drop columns we can't populate from the sheet: `lat`, `lng`, `phone`, `rating`, `review_count`, `price_level`, `hours_json`, `photos_json`, `hero_photo_url`, `google_maps_url`, `business_status` (or keep with defaults).
- Make `place_id` nullable / repurpose as legacy; new primary key for lookups stays `slug`.
- Add columns: `email text`, `specialists text`, `notes text`, `brand_id uuid null`, `is_verified bool default true`.
- Re-run with proper GRANTs (RLS already correct).

**Seed** — insert all 101 rows via `supabase--insert` (one batch). Slugs: `slugify("{name} {city}")`. `city_slug` from the existing `TEXAS_CITIES` map.

**Code updates**

- `providers.functions.ts` — drop Google fields from select; expose `email`, `specialists`, `website`, `address`, `notes`.
- `provider-card.tsx` — remove rating stars / review count UI; show name, city, specialists tag, website CTA.
- `_site.provider.$slug.tsx` — new layout: name, address, "Contact" (email + website), Specialists section, Notes, "Get Directions" (plain map URL). Remove hours/reviews/hero photo sections (no data).
- `_site.tx.$city.tsx` — remove "minRating" sort option; keep service filter (services will be empty until tagged — see Phase 2).
- `_site.index.tsx` — update featured/hero card to use a real seeded provider.

**Reviews & favorites tables** stay; reviews simply empty until users submit them.

---

## Phase 2 — Franchise / multi-branch model + priority discovery features

### Brands & branches schema

```
brands (id, slug, name, description, hero_url, website, is_verified, created_at)
providers.brand_id  → brands.id   (a "provider" row IS a branch)
```

- Auto-detect brand groupings during seed by exact `name` match across cities (e.g. if "Skin Spa NY" appears in 3 cities, create one brand row, link 3 branches).
- **Parent brand page** route: `_site.brand.$slug.tsx` — shows brand summary + "All Locations" list with each city + branch detail link.
- **Individual branch pages** stay at `/provider/$slug` (city is part of slug → unique).
- Sitemap + JSON-LD updated to emit `Organization` for brands and `LocalBusiness` for each branch (with `parentOrganization`).

### Treatments / services

- Keep existing `services` enum in `cities.ts` (Botox, Filler, Lip, Sculptra, etc.).
- **Treatment pages**: new route `_site.treatment.$slug.tsx` listing all branches that offer the treatment, with city filters.
- Until staff tag services manually, derive services from `Specialists` + `Notes` text (same `inferServices()` regex we had).

### Search & filters (location + concern)

- Upgrade `_site.search.tsx` to filter by city, treatment, brand-only-vs-independent, verified.
- Add "Search by concern" mapping (Wrinkles → botox+filler; Jawline → filler+kybella; Lips → lip-filler; etc.) — pure client mapping into the same query.

### Favorites & compare

- Favorites table already exists; wire the heart icon on provider cards (auth-gated).
- **Compare**: client-side state, up to 3 branches, side-by-side modal — name, city, specialties, contact.

### "Best Of" + Awards (lightweight)

- Static `_site.best.$city.tsx` listing top branches per city by `is_verified` + alpha until reviews exist.
- Add a `badges text[]` column on `providers` so we can later tag "Top Botox Clinic 2026" manually.

### Trust polish

- Reviews UI: user-submitted form behind auth (writes to existing `reviews` table tied to `provider_place_id` — rename column to `provider_slug` in the same migration).
- FAQ section on each branch page (static for now: parking, consultations, booking).
- Patient Safety Info: new `_site.safety.tsx` page linked from footer.

---

## Phase 3 — Defer (call out, build now)

These are valuable but heavy; I'll list them so we can build them:

- Injector bio pages (need staff data we don't have)
- Before/after galleries (need image uploads + moderation)
- Matchmaking quiz / personality-based discovery / swipe UX
- Multi-branch enterprise dashboard (claim flow exists; full mgmt UI is its own sprint)
- Branch-specific pricing (no source data; needs claim → owner edits)
- Social proof IG/TikTok embeds (per-branch handles needed)
- Recovery & downtime educational content (CMS-ish; needs writing)
- Skin-type / awards-by-city badges beyond the simple `badges[]` column

---

## Technical notes

- One Supabase migration for schema (drop Google columns, add brand model, rename review FK).
- One `supabase--insert` call to seed 101 branches + auto-derived brands.
- All Google-related files deleted; `.env` cleanup left to you (GOOGLE_MAPS_API_KEY secret can stay unused or be removed).
- All new routes follow `_site.*` layout convention and add proper `head()` metadata + JSON-LD (brand → Organization, branch → LocalBusiness, treatment → CollectionPage).
- No changes to auth, RLS roles, or AI gateway.

**Switch to build mode and I'll execute Phase 1 + Phase 2.**