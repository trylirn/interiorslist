## 1. Local SEO — rank for location-based inquiries

Goal: maximize visibility for queries like "botox in Waxahachie", "medspa near me Dallas", "best filler injector Frisco TX", etc.

### Per-provider page (`/provider/$slug`)
- Rewrite `head()` with local-intent title/description:
  - Title: `${name} — Botox, Filler & Medspa in ${city}, TX`
  - Description: mentions city, top 3 services, rating, "book a consultation in {city}, Texas".
  - Keywords meta with `{service} {city}`, `{service} near me`, `medspa {city} TX`, etc.
  - `og:locale = en_US`, `og:type = business.business`, `place:location:latitude/longitude` when geocoded.
- Add `LocalBusiness` / `MedicalBusiness` JSON-LD with:
  - `@type: ["MedicalBusiness","HealthAndBeautyBusiness"]`, name, image, url, telephone, `address` (PostalAddress with `addressLocality`, `addressRegion: "TX"`, `postalCode` if any, `streetAddress`), `geo` (lat/lng), `areaServed` (city + neighboring cities), `hasOfferCatalog` for services, `aggregateRating` when reviews exist, `sameAs` for social links.
  - `BreadcrumbList`: Home › Texas › {City} › {Name}.
- Add visible location copy block: "Serving {city} and nearby {neighbors}" + H2 "Visit our {city}, TX location" with address, and an FAQ section ("How much does Botox cost in {city}?", "Best filler injector in {city}?") — rendered as `FAQPage` JSON-LD.

### City pages (`/tx/$city`)
- Title/description already trimmed; add richer local intent:
  - H1 already good; add intro paragraph mentioning neighborhoods/landmarks (from a `cities.ts` extension) and top services.
  - `BreadcrumbList` + `CollectionPage` already present — extend with `about: { @type: City, name, containedInPlace: Texas }` and `geo` for city centroid.
  - Add FAQ block ("How much is Botox in {city}?", "Are medspas in {city} licensed?") + `FAQPage` JSON-LD.
  - Internal links to top providers, related cities, and treatment pages `/treatment/{slug}` filtered by city.

### Treatment × City combinations
- Extend `/treatment/$slug` (existing route) to accept `?city=` and swap in city-specific head + H1 ("Botox in Frisco, TX"), and link these combos from city pages ("Botox in Frisco", "Filler in Frisco"…) to create indexable internal-link surface.

### Sitemap
- Add every `/provider/$slug`, `/tx/$city`, `/treatment/$slug`, `/best/$city`, `/brand/$slug` entry, and treatment×city permutations for cities with providers offering that service. Set `changefreq=weekly`, `priority=0.8` for cities and top providers.

### Site-wide
- Root `__root.tsx`: add `Organization` `sameAs` + `areaServed: Texas` (keep leaf `og:image` rule).
- Add hidden but crawlable "Cities we serve" footer link list to every page via `site-chrome.tsx`.

### Data helpers
- Add `neighborsBySlug` and light copy strings to `src/lib/cities.ts` (no DB changes).

## 2. Public claim flow (no sign-in required)

`src/routes/_site.claim.$slug.tsx`:
- Remove the auth gate (`authed === false` branch and `supabase.auth.getSession` guard).
- Render the form unconditionally.
- On submit, call a new **public** claim server function (no `requireSupabaseAuth`) that inserts into `claims` with `user_id = null`; keep existing input validation and rate-limit friendly length caps.
- After submit, show an inline success card:
  > "Thanks! Someone from our team will reach out to you within a few minutes. If you decide you want to be listed, the cost is **$99 per year**."
- Also add the $99/year note above the submit button so users see it before submitting.

### Backend
- Migration: allow `claims.user_id` to be NULL; add an anon INSERT policy on `claims` restricted to the columns we accept (place_id, contact_email, contact_phone, business_role, proof_notes). No anon SELECT.
- New `submitPublicClaim` server fn in `src/lib/owner.functions.ts` (unauthenticated, validated with zod, uses server publishable client, not `supabaseAdmin`).

## Files

- Edit: `src/routes/_site.provider.$slug.tsx`, `src/routes/_site.tx.$city.tsx`, `src/routes/_site.treatment.$slug.tsx`, `src/routes/__root.tsx`, `src/routes/sitemap[.]xml.ts`, `src/components/site-chrome.tsx`, `src/lib/cities.ts`, `src/routes/_site.claim.$slug.tsx`, `src/lib/owner.functions.ts`.
- New: migration for nullable `claims.user_id` + anon insert policy.

## Out of scope
- New standalone landing pages per neighborhood (can add later).
- Actual payment collection for the $99/yr (notice only).
