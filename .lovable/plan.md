## 1. Reviews without login

- In `src/lib/contact.functions.ts`, drop `.middleware([requireSupabaseAuth])` from `submitReview`. Extend the input schema with `email` (validated, stored for moderation but not shown publicly) and switch to `supabaseAdmin.from("reviews").insert(...)`.
- Migration: add nullable `email` column to `reviews`, add an anonymous `INSERT` policy scoped to `user_id IS NULL` (mirrors the anon claim policy), keep the existing authenticated policy. Reviews remain publicly readable as today (no moderation queue per the answer given).
- In `_site.provider.$slug.tsx` `ReviewDialog`, remove the `supabase.auth.getSession()` gate, replace it with a name + email input pair, and hide the email from the rendered review list.

## 2. Nearby Medspas section (per provider page)

- New server function `getNearbyProviders({ placeId })` in `src/lib/providers.functions.ts`:
  - Load current provider's `latitude/longitude/city_slug`.
  - If coords exist, fetch published providers with non-null coords, compute haversine in JS, return top 6 excluding self (any city).
  - Otherwise fall back to same `city_slug`, then `CITY_NEIGHBORS` slugs.
- New component `src/components/nearby-providers.tsx` (mirrors `RelatedProviders`, heading "Nearby Medspas", subhead "Closest verified medspas to this location"). Renders above the existing "You may also be interested in" section on the provider page.

## 3. "Articles from this Med Spa" (Firecrawl bulk scrape)

- Migration: add `articles jsonb` column to `providers` (`[]` default), storing `{ title, url, snippet?, scraped_at }[]`.
- Add Firecrawl (managed connector) via `standard_connectors--connect` — requests `FIRECRAWL_API_KEY`.
- New admin-only server function `scrapeProviderArticles` in `src/lib/articles.functions.ts`:
  - `requireSupabaseAuth` + `has_role(_, 'admin')` guard.
  - Uses the Firecrawl SDK (`@mendable/firecrawl-js`) server-side: `firecrawl.map(website, { search: "blog|article|news|post|guide|tips", limit: 20 })` to find candidate URLs; picks up to 3 with `/blog/`, `/article`, `/news`, `/post`, or `/guide` in the path; if none found, falls back to top 3 non-home internal URLs (About / Services / Contact excluded).
  - Persists via `supabaseAdmin` into `providers.articles`.
- New admin route `src/routes/_site.admin.articles.tsx` with a "Scrape all providers" button and a "Scrape one" input. Batch runner iterates all 161 providers sequentially with per-provider try/catch, live progress toasts, and skips providers with no `website`.
- On the provider page, render an "Articles from this Med Spa" section only when `p.articles?.length > 0` — titled "Latest from {p.name}", each link opens the original URL in a new tab with "Read on {p.name} →" suffix and `rel="noopener noreferrer"`.
- Credit warning surfaced in the admin UI: ~161 map calls at Firecrawl standard pricing; user confirmed proceed.

## 4. Treatment content pages

- Per-treatment editorial content lives in a new `src/lib/treatment-content.ts` file. Each of the ~34 slugs in `SERVICES` gets: `{ what, benefits[], risks[], recovery, avgCost, candidate, faqs: { q, a }[] }`. Written in-repo, no CMS.
- Refactor `_site.treatment.$slug.tsx`:
  - Above the existing filter row + provider grid, render sections: **What is it**, **Benefits**, **Risks**, **Recovery**, **Average cost**, **Who is a good candidate**, **FAQs** (as `<details>` list + `FAQPage` JSON-LD in `head()`).
  - Provider grid heading becomes: "Find med spas offering {name} near you" (or "in {city}, TX" when `?city=` present). Show 6 by default with "See all X providers" link to filtered search.
  - Add `MedicalProcedure` JSON-LD (description, `howPerformed`, `preparation`, `followup`) merged with the existing `CollectionPage` JSON-LD.
- Internal-link block at the bottom: sibling treatments, top cities offering this treatment.

## 5. Remove brands from the UI

- Delete files: `src/routes/_site.brands.tsx`, `src/routes/_site.brand.$slug.tsx`.
- `src/components/site-chrome.tsx`: remove desktop nav "Brands" link, mobile nav "Brands" link, footer "Brands" column, `listBrands` query/import.
- `src/routes/_site.index.tsx`: remove "Multi-location medspas" section + `listBrands` import and `home-brands` query.
- `src/routes/_site.provider.$slug.tsx`: remove the "Multi-location" `Meta` chip (line 243) and the entire "Other locations" section (lines 375–389).
- `src/routes/_site.match.tsx`: remove "Multi-location brand" chip.
- `src/routes/_site.for-business.tsx`: remove the "Brand pages" benefit tile.
- `src/routes/sitemap[.]xml.ts`: drop all `/brand/*` and `/brands` URLs.
- `src/lib/providers.functions.ts`: remove `listBrands` export and any brand-siblings code path in `getProviderBySlug` (return `{ provider, reviews }` only); adjust the callsite type.
- DB and `brands` / `brand_id` columns are left in place (data-only, not user-visible). No migration to drop them.

## 6. Interlinking & sitemap

- Provider page already links treatments → treatment pages. Add reverse: treatment page's "Find med spas near you" grid links each provider.
- Treatment page: add a "Also offered in" row linking `/treatment/{slug}?city={slug}` for cities that have ≥1 provider offering it.
- City page (`_site.tx.$city.tsx`): add a "Popular treatments in {city}" strip linking to `/treatment/{slug}?city={citySlug}`.
- Nearby providers section on provider page contributes to interlink density.
- Regenerate `sitemap[.]xml.ts` after removing brand URLs; treatment×city URLs already there.

## Technical details

- New migrations (2 files):
  1. `reviews`: add `email text`, add anon `INSERT` policy `WITH CHECK (user_id IS NULL AND rating BETWEEN 1 AND 5 AND (text IS NULL OR length(text) <= 4000) AND length(coalesce(email,'')) <= 255)`, `GRANT INSERT (provider_place_id, author_name, rating, text, relative_time, published_at, email) ON public.reviews TO anon`.
  2. `providers`: `ADD COLUMN articles jsonb NOT NULL DEFAULT '[]'::jsonb`.
- Firecrawl SDK install: `bun add @mendable/firecrawl-js`. Called only from server functions; `FIRECRAWL_API_KEY` never exposed to the client.
- `getNearbyProviders` and `scrapeProviderArticles` returned via `useQuery` on the provider page so SSR isn't blocked by them.
- All new server functions validate input with zod. `scrapeProviderArticles` gated behind `has_role(auth.uid(),'admin')`.
- Types regenerate after each migration; no manual edits to `src/integrations/supabase/types.ts`.

## Out of scope

- Actual moderation queue / captcha for anonymous reviews (spam control) — user picked "no verification".
- Re-scraping articles on a cron; the admin can re-run the batch on demand.
- Removing the `brands` table and `brand_id` column from the DB.
- Payment collection for the $99/yr claim tier (already noted).