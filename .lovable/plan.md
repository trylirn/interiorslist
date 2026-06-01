## Plan — finish remaining Phase-3 items

End state: everything in the previous turn's plan is built. No new database changes are needed — the schema already has `credentials`, `services_raw`, `claims`, `contact_messages`, and proper RLS.

### 1. Data catalog (`src/lib/cities.ts`)
- Add cities: `southlake`, `the-woodlands`, `waxahachie` to `TEXAS_CITIES`.
- Replace `SERVICES` with the 30-slug canonical list: botox, dysport, xeomin, jeuveau, fillers, lip-filler, cheek-filler, jawline-filler, sculptra, kybella, prp, microneedling, morpheus8, chemical-peels, hydrafacial, dermaplaning, laser-hair-removal, ipl-photofacial, laser-resurfacing, halo-laser, bbl, coolsculpting, emsculpt, body-contouring, skin-tightening, microblading, permanent-makeup, lash-extensions, iv-therapy, weight-loss, hormone-therapy, prp-hair, vampire-facial, ultherapy.
- Add a small `CONCERNS` array (slug + label + intro) used by the footer + `/concern/$slug`: wrinkles, lip-volume, jawline, acne-scars, pigmentation, hair-loss, glow, body-contouring.

### 2. Matching (`src/lib/match.functions.ts`)
- Expand `CONCERN_TREATMENTS` and `PRIORITY_TREATMENTS` to reference the new slugs (e.g. `lip-volume → [lip-filler, fillers]`, `body-contouring → [coolsculpting, emsculpt, kybella, body-contouring]`, `glow → [hydrafacial, microneedling, chemical-peels, iv-therapy]`).
- No DB / signature changes — just bigger lookup tables.

### 3. Homepage rewrite (`src/routes/_site.index.tsx`)
Samslist-inspired, longer sectioned page (no AI references, no testimonials):
1. Hero (existing layout) + search bar with city + treatment selects.
2. "How it works" — 3 numbered steps (Tell us what you want / See verified matches / Reach out directly).
3. By city — grid of all 13 city cards with counts.
4. By treatment — grid of 12 popular treatments.
5. By concern — 8 concern cards (link to `/concern/$slug`).
6. Featured verified providers — 6 cards.
7. By brand — horizontal scroll of multi-location brands.
8. Safety & credentials primer — link to `/safety` + `/credentials`.
9. For business owners — CTA bar → `/for-business`.
10. FAQ accordion — 8 common questions.

### 4. Footer rebuild (`src/components/site-chrome.tsx` — `SiteFooter` only)
7-column samslist layout:
1. Wordmark + tagline + short paragraph.
2. Browse by City (all 13).
3. Browse by Treatment (top 12).
4. Browse by Brand (top brands from `brands` table, capped at 8).
5. Common Concerns (8 from `CONCERNS`).
6. Company (About, Submit a medspa, For business, Contact).
7. Legal (Privacy, Terms, Safety, Credentials).

Brands list is fetched server-side via a tiny new server fn `listFooterBrands` (or reuse `listBrands` with a small cap). Footer fetches once and caches.

### 5. New routes
- `src/routes/_site.for-business.tsx` — owner pitch page: benefits, what you get, FAQ, CTA → `/login` and `/submit`.
- `src/routes/_site.concern.$slug.tsx` — title + intro from `CONCERNS`, recommended treatments (links), top providers (reuse `listByTreatment` per mapped slug).
- `src/routes/_site.how-it-works.tsx` — explainer (matching + verification process).
- `src/routes/_site.credentials.tsx` — MD / DO / NP / PA / RN / Esthetician explainer; linked from `/safety`.
- `src/routes/_site.welcome.tsx` — post-signup picker: "Find a medspa" → `/match`, "I own a medspa" → `/for-business`.
- `src/routes/_site.claim.$slug.tsx` — claim form (business role, contact phone, proof notes) gated to logged-in users; inserts a row into `claims` via a new `submitClaim` server fn (`requireSupabaseAuth`).
- `src/routes/_site.dashboard.listing.$placeId.tsx` — edit form for an owned listing. New server fn `updateMyListing` with `requireSupabaseAuth` using the user-scoped supabase client so the existing RLS policy gates it (only fields: specialists, notes, website, phone, hero_photo_url, services, branch_label).

`/login` redirect: on successful signup (no existing claimed providers), send to `/welcome`; otherwise to `/dashboard`. Small change in `_site.login.tsx`.

### 6. Dashboard upgrade (`src/routes/_site.dashboard.tsx`)
Tabs (Radix `Tabs`):
- **My Listings** — server fn `listMyListings` returns providers where `claimed_by = auth.uid()`. Each card → "Edit listing".
- **Leads** — server fn `listMyLeads` returns `contact_messages` for owned providers; status toggle (new / contacted / closed) via `updateLeadStatus` (RLS already allows owner update on contact_messages).
- **Reviews** — server fn `listMyReviews` returns reviews for owned providers (read-only).
- **Favorites** — link to `/favorites`.
- Always show sign-out.

All three new server fns live in a new `src/lib/owner.functions.ts`, using `requireSupabaseAuth` + the user-scoped supabase client so RLS does the gating.

### 7. Sitemap (`src/routes/sitemap[.]xml.ts`)
Add to static entries: `/match`, `/best/$city` (one per city), `/concern/$slug` (one per concern), `/for-business`, `/how-it-works`, `/credentials`. Provider/brand/treatment generation already covered.

### 8. Cleanup
- Delete the stale `.lovable/plan.md` reference to the removed reseed endpoint (already deleted in last turn).
- Fix runtime error: regenerate route tree by removing the lingering `api.public.admin-reseed` import (auto-handled on next build since the file is gone — verify after editing routes).

### Out of scope (still deferred, not built)
Skin-type & recovery-time filters, swipe UI, injector personality profiles, photo gallery uploads, multi-branch enterprise console, testimonials. No AI references anywhere.

Approve and I'll execute end-to-end.