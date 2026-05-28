# Sam's List-inspired redesign + Phase 2/3 features

Rebuild the directory in the visual language of samslist.com (cream background, serif display type, dark forest-green primary, generous whitespace, restrained borders) and ship the remaining trust/discovery features in one pass.

## 1. Design system overhaul (samslist-inspired)

Update `src/styles.css` tokens:

- Accent muted sage, soft borders, subtle shadows only
- Buttons: solid dark-green pill with cream text; ghost = text-only
- Cards: white surface, hairline border, generous padding, no heavy shadows

Update `src/components/site-chrome.tsx`:

- Header: wordmark left, centered nav (Find a Pro ▾, Get Matched, About, For Professionals), right-side search icon + Sign In + dark "Write a Review" pill button
- "Find a Pro" dropdown listing: All providers, By city, By treatment, By brand
- Footer: 7-column samslist layout (Brand blurb + socials | Browse by Type | Browse by Location | Browse by Category | Company | Legal | Common Situations), legal fine-print row, copyright

## 2. Get Matched quiz flow (new)

New route `src/routes/_site.match.tsx` — 6-step wizard with progress bar:

1. Biggest priority (Botox, Filler, Laser, Skin, Body, Hair)
2. Concern (wrinkles, volume, scars, pigmentation, jawline, body contour)
3. Skin type / tone
4. Budget range
5. Timing (just exploring / 1–2 weeks / within a month / 2–3 months) + State (TX cities + "outside TX")
6. Contact details → reveal blurred match cards with % match

Scoring: weight by city match, treatment overlap (specialists/notes/services), brand-verified bonus, recency. New server fn `getMatches` in `src/lib/match.functions.ts`. Persist submissions to a new `match_submissions` table (RLS: insert anyone, select own).

Final results page `src/routes/_site.match.results.$id.tsx`: "Your top matches" with one card visible at a time + "Match X of N" pager, "Not a fit" / "Interested" actions (writes to `match_responses` table). "Interested" reveals contact info and notifies the provider via the contact-message table.

## 3. Provider detail page redesign

Rebuild `src/routes/_site.provider.$slug.tsx` to match Spark 3 layout:

- White hero card: square logo placeholder, FRACTIONAL/treatment tag pill, serif name, tagline, 5-column meta strip (Based In, In Business, Founded, Serves Clients, Team Size), Dedicated Staff row
- Sticky right rail: "Contact {name}" multi-step form (name → email → phone → message) with progress bar, posts to new `contact_messages` table
- Reviews section with star summary + "Write a Review" CTA opening auth-gated form (writes to existing `reviews` table)
- "Our Approach" prose section
- "Services Offered" 2-column check-list grid
- "Tech Stack" logo grid (we'll skip tools we don't have — use specialist tags as proxies)
- "Pricing & Packages" cards (new `provider_packages` table, optional)
- "Industries Served" + "Client Specialties" with progress bars (derive from specialists text; render only if data exists)
- "Regulatory disclosure" cream callout
- "Explore More" links (city / treatment / all)
- Related blog posts row (static placeholders for now)

## 4. Phase 2 features (favorites, compare, reviews, Best Of)

- **Favorites heart** on `ProviderCard` — top-right icon button, optimistic toggle, calls existing `toggleFavorite` server fn; unauthenticated → redirect to /login with redirect param
- **Compare drawer**: zustand store of up to 3 provider slugs, floating bottom bar "Compare (n)" → opens Sheet with side-by-side specialists/services/brand/city table; "Add to compare" button on cards
- **Review form**: dialog on provider page, auth-gated, 1–5 stars + text, writes via new `submitReview` server fn, optimistic insert, displayed under Reviews
- **Best of $city pages**: `src/routes/_site.best.$city.tsx` — top 10 by review count/rating in that city, "Best Medspas in {City} 2026" SEO copy
- **Concern → treatment mapping** in `src/lib/cities.ts` (Wrinkles→botox+xeomin, Jawline→filler+kybella, Acne scars→microneedling+laser, etc.) — surfaced on match quiz and home page

## 5. Phase 3 features (auth UX)

- **Claim flow**: `/provider/$slug` "Claim this listing" → `_authenticated/claim.$slug.tsx` form (verifying email + role at clinic, contact phone) → inserts into `claim_requests` table for admin review
- **Provider dashboard** `_authenticated/dashboard.tsx`: tabs for Claimed Listings, Inbox (contact messages routed to claimed providers), Reviews received, Profile editor (update specialists/notes/website/email/services/packages)
- **New user onboarding**: after first login, route to `/welcome` (one-time) — patient (default) vs provider toggle, then redirect appropriately (favorites for patients, claim CTA for providers)

## 6. Database additions

New migration:

- `match_submissions` (user_id nullable, answers jsonb, contact jsonb, created_at)
- `match_responses` (submission_id, provider_id, response: interested|not_a_fit)
- `contact_messages` (provider_id, name, email, phone, message, created_at) — visible to claimed owner
- `claim_requests` (user_id, provider_id, role, contact, status default 'pending')
- `provider_packages` (provider_id, title, price_range, description) — optional, leave empty
- Add `tagline`, `founded_year`, `team_size`, `years_in_business`, `dedicated_staff_bool`, `industries` text[], `client_specialties` jsonb to `providers`
- All with RLS + GRANTs per the standard pattern

## 7. SEO + sitemap updates

- Add /match, /best/$city, /brands, /treatment/$slug already in sitemap; add /safety
- City pages: rename to "Best Medspas in {City}, TX" H1 + meta

## 8. Profiles and Personalities

- Injector personality profiles, swipe UI, gallery uploads, multi-branch enterprise console, skin-type filters beyond basic mapping, recovery-time content - To be done now..

## Technical notes

- All server fns under `src/lib/*.functions.ts` using `requireSupabaseAuth` where the user must be known; public reads via `supabaseAdmin` scoped by slug
- Compare store: `src/stores/compare-store.ts` zustand, persisted to localStorage
- Provider dashboard uses `_authenticated/` layout already in place
- Forms validated with zod (length caps, email format, phone optional)
- No new external APIs, no new secrets