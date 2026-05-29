## Plan — Data refresh, business side, samslist-inspired homepage

### 1. Re-seed providers from the Excel sheet (no emails, no duplicates)

Migration + admin reseed using the 110 rows in `Texas_MedSpa_Directory_Exhaustive_Final.xlsx`.

- **Deduplicate** by lower-cased `name + city` (also collapse near-dupes from previous seed). Strategy: build canonical `place_id = "local:{slugify(name)}-{city_slug}"`, `INSERT … ON CONFLICT (place_id) DO UPDATE` so re-runs are idempotent.
- **Drop emails from public profile**: stop selecting `email` in `providers.functions.ts` (`PROVIDER_COLS`), hide it on the provider page, and `UPDATE providers SET email = NULL`. Email stays as a private column for the claim flow only (admin/owner-only via RLS — already covered by `Owners update claimed listings`; add `email` filter from public reads at the query layer).
- **Add new fields** to `providers`: `credentials text` (e.g. "MD, RN, Licensed Esthetician"). Already have `specialists`, `address`, `website`, `services`.
- **Cover new cities** in `src/lib/cities.ts`: add `southlake`, `the-woodlands`, `waxahachie`. Existing 10 cities stay.
- **Brand re-detection**: rebuild `brands` from name prefixes that appear >1× across cities (e.g. "Oceana Luxe", "New You", "BEAUX", "American Laser Med Spa", plus any new multi-location names in the new sheet). Link `providers.brand_id` accordingly; set `branch_label` from city.

### 2. Service catalog refresh

The sheet contains 355 free-text service strings. Normalize to a **canonical taxonomy** (30 slugs) and store both:

- `providers.services` (existing `text[]`): canonical slugs only (used for filtering/search).
- New `providers.services_raw` (`text[]`): the exact strings from the sheet, shown verbatim on the provider page.

Canonical service slugs (expanded from current 9 → ~30):
botox, dysport, xeomin, jeuveau, fillers, lip-filler, cheek-filler, jawline-filler, sculptra, kybella, prp, microneedling, morpheus8, chemical-peels, hydrafacial, dermaplaning, laser-hair-removal, ipl-photofacial, laser-resurfacing, halo-laser, bbl, coolsculpting, emsculpt, body-contouring, skin-tightening, microblading, permanent-makeup, lash-extensions, iv-therapy, weight-loss, hormone-therapy, prp-hair, vampire-facial, ultherapy.

Update:

- `src/lib/cities.ts` `SERVICES` array.
- Mapping function `normalizeService(raw)` in `src/lib/services.ts` used by the reseed script (regex/keyword match).
- `CONCERN_TREATMENTS` and `PRIORITY_TREATMENTS` in `match.functions.ts` to reference the expanded catalog.
- `/treatment/$slug` page already exists — it picks up new slugs automatically.

### 3. Homepage redesigned (samslist-inspired, no AI references, no testimonials)

Rewrite `_site.index.tsx` to a longer, sectioned landing page with cream bg + deep green accents (already in tokens). Sections, in order:

1. **Hero** — H1 "The trusted directory of medspas in Texas", subhead, two CTAs: "Get matched" + "Browse all medspas", below: search bar (city + treatment).
2. **By city** — grid of 10 city cards w/ counts.
3. **By treatment** — grid of 12 most-popular treatments.
4. **By brand** — horizontal scroll of multi-location brands.
5. **How it works** — 3 steps: Tell us what you want → See verified matches → Book directly.
6. **Featured verified medspas** — 6 cards.
7. **Safety & credentials primer** — links into `/safety`.
8. **For business owners** — CTA bar linking to `/for-business`.
9. **FAQ** — accordion with 8 common questions.

### 4. Footer — samslist 7-column layout (matches uploaded screenshot)

Rebuild `SiteFooter` in `site-chrome.tsx` with:

- Column 1: Wordmark + tagline + short paragraph.
- Column 2: **Browse by City** — 10 cities.
- Column 3: **Browse by Treatment** — top 12 treatments → `/treatment/$slug`.
- Column 4: **Browse by Brand** — top brands → `/brand/$slug`.
- Column 5: **Common Concerns** — wrinkles, lip volume, acne scars, hair loss, glow → `/concern/$slug` (new route, see §7).
- Column 6: **Company** — About, Submit a medspa, For business, Contact.
- Column 7: **Legal** — Privacy, Terms, Safety guide.

### 5. Business / claim experience

- `**/for-business` route** (new) — pitch page for medspas: "Claim your free listing", benefits, what they get, FAQ, CTA to `/login`.
- **Claim flow polish**: existing `/provider/$slug` adds "Is this your business?" link → `/claim/$slug` (requires login).
  - `claim/$slug` form: business role, contact phone, proof notes → inserts into `claims` table (already exists), status `pending`. Toast: "We'll review within 2 business days."
- **Onboarding redirect**: after first sign-up (no claimed/owned providers), `_site.login.tsx` sends user to `/welcome` instead of `/dashboard`. `/welcome` asks "Are you here to (a) Find a medspa (b) I own a medspa". Routes to `/match` or `/for-business`.
- **Business dashboard upgrade** (`_site.dashboard.tsx`):
  - If user has claimed providers (`claimed_by = auth.uid()`): show "My listings" section with each location card → "Edit listing" (`/dashboard/listing/$placeId`).
  - Edit listing form (server fn `updateMyListing`, RLS-scoped): update `specialists`, `notes`, `website`, `phone`, `hero_photo_url`, `services` (multi-select), `branch_label`.
  - "Leads" tab: list of `contact_messages` for owned providers, with status (new/contacted/closed) toggle.
  - "Reviews" tab: read-only list of reviews for owned providers.
  - Always show "Favorites", "Account", "Sign out".

### 6. Account creation

- Keep email/password + Google (already on `/login`). After signup, ensure profile + role rows exist (trigger already in DB).
- Add `/signup` as alias of `/login?mode=signup`.

### 7. New content pages (footer linkable, SEO indexable, in sitemap)

- `/for-business` — owner pitch
- `/concern/$slug` — wrinkles, lip-volume, acne-scars, jawline, hair-loss, glow, pigmentation. Renders intro + recommended treatments + relevant providers.
- `/how-it-works` — explains the matching + verification process.
- `/credentials` — explainer of MD / DO / NP / PA / RN / Esthetician (links from `/safety`).
- Add all of the above + `/brands`, `/treatment/$slug`, `/concern/$slug`, `/best/$city`, `/match`, `/safety` to `sitemap[.]xml.ts`.

### Technical notes

- Migrations (single migration):
  - `ALTER TABLE providers ADD COLUMN credentials text, ADD COLUMN services_raw text[] DEFAULT '{}'`
  - `UPDATE providers SET email = NULL` then keep column private; restrict public reads in server fns (do not include `email` in `PROVIDER_COLS`).
- Reseed strategy: a one-time admin server route `/api/public/admin-reseed` guarded by a header secret (`RESEED_SECRET` — request via `add_secret`). Parses an embedded JSON of the 110 rows (extracted offline into `src/data/providers-seed.json`), upserts brands, upserts providers (ON CONFLICT). Idempotent; safe to run twice.
- Edit-listing + leads-status routes go behind `requireSupabaseAuth`.
- Compare drawer, favorites, review form, "Best of $city" pages — already shipped last turn, no changes needed.

### Not out of scope (not deferred, to be built as well)

Skin-type & recovery-time filters, swipe UI, injector personality profiles, photo gallery uploads, multi-branch enterprise admin console, testimonials, AI-anything (no AI references on the site).

Approve and I'll execute end-to-end in the next turn (migration first, then code).