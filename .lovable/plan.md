# Plan

## 1. Admin dashboard (`/admin`)

- Add `admin` value to `app_role` enum (if not present) and seed role for `nokunato@gmail.com` via migration (lookup user id from `auth.users` by email, insert into `user_roles`). Also grant role automatically on signup via update to `handle_new_user` trigger when email matches.
- New server fns in `src/lib/admin.functions.ts` (all guarded by `requireSupabaseAuth` + `has_role(userId, 'admin')` check):
  - `listPendingClaims`, `approveClaim(id)`, `rejectClaim(id, reason)` — on approve, set `providers.claimed_by = claim.user_id`, `is_verified=true`, mark claim `status='approved'`.
  - `listPendingSubmissions`, `approveSubmission(id)` — creates `providers` row from submission, `rejectSubmission(id)`.
  - `listAllProviders`, `toggleProviderPublished(placeId)`, `featureProvider(placeId, bool)`.
  - `adminMetrics()` — totals: providers, claimed %, pending claims, pending submissions, contact_messages (7d/30d), reviews (7d/30d), signups (7d/30d), top cities, top services.
- New routes under `_authenticated/`:
  - `src/routes/_authenticated/admin.tsx` — gate w/ `beforeLoad` calling `requireAdmin` server fn (redirect non-admins). Tabs: Overview (metrics + sparkline cards), Claims, Submissions, Listings, Reviews, Leads, Users.
- Add link to "Admin" in `SiteHeader` user menu when current user has admin role (check via lightweight `getMyRole` server fn cached in React Query).

## 2. Brand dashboard upgrades (`/dashboard`)

Extend the existing `_site.dashboard.tsx` (already has My Listings / Leads / Reviews tabs). Add:

- **Reviews tab**: response field per review. New `review_responses` table (`review_id pk fk`, `owner_id`, `body`, timestamps) + RLS so only owning provider's `claimed_by` can insert/update; public can read. New server fns `respondToReview`, `updateReviewResponse`. Render owner reply under each review on provider page.
- **Listing editor** (`_site.dashboard.listing.$placeId.tsx`): add structured fields — `hours` (jsonb), `social_links` (jsonb), `price_ranges` (jsonb of service→range), `before_after_url[]`, `team` (jsonb of staff bios). Migration adds these columns to `providers`.
- **FAQs tab per listing**: new `provider_faqs` table (`provider_place_id`, `question`, `answer`, `sort_order`); RLS: owner CRUD, public select. Edit UI under listing editor; render on provider page replacing/augmenting the static FAQ block.
- **Metrics tab**: server fn `getListingMetrics(placeId)` returning profile views (new `provider_views` table, increment in provider loader), leads count, reviews count, avg rating, last 30-day trend. Charts via recharts.
- **Update requests**: brand can submit edit suggestions for fields they can't self-edit (name, address) — `provider_update_requests` table goes to admin queue.

## 3. Fix "Write a Review" CTA

- In `src/components/site-chrome.tsx`, replace `/submit` link behind "Write a Review" with a small dialog that lets the user search a provider and routes to `/provider/$slug#reviews` (anchor scroll), OR rename CTA to "Find provider to review" linking `/search?intent=review`. Keep `/submit` reserved for business submissions.
- Add `#reviews` anchor + auto-scroll handler in provider page; if not signed in, show inline sign-in prompt (already supported).

## 4. Business-only account creation

- Rework `_site.login.tsx` signup tab into a multi-step "Create business account":
  1. Business info (name, city, address, website, phone)
  2. License & credentials (state license number, license type select, license document upload to `business-docs` private bucket, NPI optional)
  3. Account credentials (email, password, contact name, role at business)
- Submit creates auth user (email/password, no auto-confirm), inserts `submissions` row with license fields, uploads doc, sets `profiles.account_type='business'`.
- Migration:
  - Add `account_type text default 'business'` and license columns to `profiles`.
  - Extend `submissions` with `license_number`, `license_type`, `license_doc_path`, `npi`.
  - Create private storage bucket `business-docs` with owner-only read + admin read policies.
- There are no Consumer accounts: keep Google OAuth login working for review/favorites flows (do not require license). Add note that email/password signup is for businesses only; consumers do not need to sign in to use the platform to the full.
- Admin queue (item 1) reviews license docs before approving submission → creates provider listing.

## 5. Remove homepage testimonials

- Delete the "What clients say" section from `src/routes/_site.index.tsx`. Keep `testimonials.functions.ts` + table for future use.

## 6. Richer compare

- Extend `CompareItem` type and `CompareDrawer` to fetch full provider rows when opened (new server fn `getProvidersByIds(placeIds[])`). Render a comparison table with rows:
  - Hero photo, name + city, rating + review count, services (chips), credentials/specialists, price range, hours summary, skin types supported, recovery time tags, claimed status, distance (if user location), languages, website/phone, "Request consult" button per column.
- Add sticky first column (attribute label) on desktop; swipeable cards on mobile.
- Persist comparison via `localStorage` (already done) + shareable URL `/compare?ids=a,b,c`.

## Technical details

**New files**

- `src/lib/admin.functions.ts`, `src/lib/brand-extra.functions.ts`, `src/lib/compare.functions.ts`, `src/lib/role.functions.ts`
- `src/routes/_authenticated/admin.tsx` (+ sub-tab components)
- `src/routes/_site.compare.tsx`
- Components: `admin-claims-table`, `admin-submissions-table`, `admin-metrics`, `review-response-form`, `provider-faqs-editor`, `listing-metrics-chart`, `business-signup-wizard`, `compare-table`

**Migrations (one combined)**

- `app_role` add `'admin'` if missing; seed admin role for `nokunato@gmail.com`; update `handle_new_user` trigger to auto-grant admin to that email.
- New tables: `review_responses`, `provider_faqs`, `provider_views`, `provider_update_requests`.
- Alter `providers`: add `hours jsonb`, `social_links jsonb`, `price_ranges jsonb`, `before_after_urls text[]`, `team jsonb`, `published boolean default true`, `featured boolean default false`.
- Alter `profiles`: `account_type text default 'consumer'`, set business on business signup.
- Alter `submissions`: license fields.
- Storage bucket `business-docs` (private) + policies.
- All new tables: GRANTs + RLS per project rules (no anon writes; public select only where appropriate; admin override via `has_role`).

**Out of scope**

- Payments/booking, advanced license verification (manual admin review only), email notifications on claim approval (can add toast/in-app only for now).