## Plan

### 1. Excel data import (121 orgs across 14 cities)
- Parse `Texas_MedSpa_Directory_Exhaustive_Final-3.xlsx` and write a one-shot SQL upsert seed.
- Add new columns to `providers`: `about_description text`, ensure `social_links jsonb` is populated (Instagram, Facebook, TikTok, YouTube parsed from comma-separated URLs).
- Upsert by `(lower(name), lower(city))` (existing unique index): update `address`, `email`, `website`, `specialists`, `credentials`, `services_raw`/`services`, `about_description`, `social_links`. Insert missing rows (e.g. Waxahachie's "All Glow Med Spa") with generated `place_id`/`slug`.
- Recompute `services[]` from comma-split `services_raw` via the existing slugger map.

### 2. Rename "Our Approach" → "About"
- `src/routes/_site.provider.$slug.tsx` heading.
- Brand/admin dashboard label in `_site.dashboard.listing.$placeId.tsx` (the Profile/About editor tab) — switch field label and helper text to "About".
- Bind the editor textarea to the new `about_description` column (fall back to `notes` for orgs without one) in `owner.functions.ts` validator.

### 3. Brand uploads (videos, files, certificates, images) + per-org FAQs + metrics
- Already exists: `provider-photos` bucket (gallery), `provider_faqs` table, `getListingMetrics` server fn.
- Add a private `provider-files` bucket for documents/certs; add public `provider-videos` (or accept external URLs) — and persist:
  - `providers.video_urls text[]` (YouTube/Vimeo/MP4 URLs)
  - `providers.certificate_urls text[]` (links to signed objects in `provider-files`)
  - `providers.document_urls text[]`
- Extend `updateMyListing` validator + UI in `_site.dashboard.listing.$placeId.tsx` with new tabs: **Media** (images + videos), **Documents & Certificates** (upload to `provider-files`, owner+admin RLS), **FAQs** (already there — keep), **Metrics** (already there — keep, add 7d/30d/90d toggle and per-source breakdown).
- Public provider page renders Videos, Certificate badges (linked PDFs), and FAQ accordion.

### 4. "You may also be interested in" on provider page
- New server fn `getRelatedProviders({ placeId })`: same `city_slug`, overlapping `services[]`, exclude self; fallback to same-city top-rated. Limit 4.
- Render as a section right above the footer with `ProviderCard`.

### 5. Homepage "I am looking for a…"
- New hero subcomponent on `_site.index.tsx`: dropdown of top treatments (Botox, Filler, Laser, Body, Skin, Wellness) + optional city dropdown → CTA "See recommendations" → routes to `/match?priority=...&city=...` (prefills the existing match flow).

### 6. Search page rework ("Find a Pro")
- Default behavior: when no `q`/`city`/`service`, show **all published providers** (paginated, 24/page) instead of the empty state.
- Replace pill-row filters with shadcn `Select` dropdowns: City, Treatment, Sort (Rating, Name, Verified first). Keep search input as primary. URL state stays in search params.
- Add a results count and a "Reset filters" button.

### Technical details

**Migrations** (single migration):
```sql
ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS about_description text,
  ADD COLUMN IF NOT EXISTS video_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certificate_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS document_urls text[] NOT NULL DEFAULT '{}';
```
Create `provider-files` private bucket; RLS: owner + admin read/write, public none.

**Data import**: scripted SQL with `INSERT ... ON CONFLICT DO UPDATE` covering all 121 rows from the spreadsheet, applied via the insert tool (not migration).

**Files to touch**:
- New: `src/lib/related.functions.ts`, `src/components/looking-for-hero.tsx`, `src/components/related-providers.tsx`.
- Edit: `src/routes/_site.search.tsx`, `_site.index.tsx`, `_site.provider.$slug.tsx`, `_site.dashboard.listing.$placeId.tsx`, `src/lib/owner.functions.ts`, `src/lib/providers.functions.ts` (include `about_description`, social_links, gallery, videos, certs in returned cols), `src/lib/brand-extra.functions.ts` (metrics windowing).

### Out of scope
- Backfilling Google ratings/review counts for the new Waxahachie row.
- Email-forwarding wiring (separate flow already pending).
- Video transcoding — we'll store URLs only (YouTube/Vimeo embed or direct MP4).