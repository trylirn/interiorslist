# Provider profiles, sign-up, and match fixes

## 1. FAQs on provider pages — owner-supplied only

In the provider page FAQ section, drop the two hardcoded questions ("How do I book an appointment…", "Is a consultation required?"). Render the section only when the facility has added FAQs from their dashboard; otherwise hide the whole card. The FAQ JSON-LD block is likewise emitted only when real FAQs exist, so structured data matches what's visible.

## 2. Sign in / sign up — business only

The login page currently has three tabs: Sign in, Create account (consumer), For businesses. Collapse to two: **Sign in** and **Create account**, where Create account is the existing business sign-up wizard. The consumer-only panel is removed and the intro copy is rewritten for business owners (register your med spa, manage your listing).

## 3. Match page — overlapping badge

On `/match`, the "% match" pill sits at the same top-right corner as the favorite and compare buttons on each card. Move the match pill to the top-left of the card and add left padding to the card title row so it never sits under the heading, keeping favorite/compare where they are everywhere else.

## 4. Richer business profile fields

Add a new **Business details** group in the provider dashboard (About & info tab) with:

- Year founded / years in business
- Service area (Nationwide / Regional / Local — with a free-text note)
- Team size
- Credentials and licenses
- Services offered (already exists — stays)
- Pricing and packages (repeatable name + price range + description rows)
- Types of clients served
- "Not a good fit if…" message
- Contact & connect: website, phone, Instagram, Facebook, TikTok, YouTube, LinkedIn, X (website/phone/socials already exist; socials extended)

These render on the public provider page in a new "About this practice" panel: a small stat strip (Founded · Years in business · Team size · Serves), then Credentials & licenses, Pricing & packages, Who we serve, and a muted "Not a good fit if…" note. Every block hides when empty, so unclaimed listings look unchanged.

## Technical notes

- Migration adds columns to `public.providers`: `founded_year int`, `years_in_business int`, `service_area text`, `service_area_note text`, `team_size text`, `client_types text`, `not_a_fit text`. Existing `credentials` (text), `price_ranges` (jsonb), and `social_links` (jsonb) are reused; pricing packages stored as `price_ranges: [{ name, price, note }]`.
- New columns are public-readable (no grant/RLS change needed beyond the existing providers policies); no private data added.
- `updateMyListing` in `src/lib/owner.functions.ts` gains matching zod fields (with `linkedin`/`x` allowed in `social_links`).
- `PROVIDER_DETAIL_COLS` in `src/lib/providers.functions.ts` extended with the new columns.
- Files touched: `src/lib/owner.functions.ts`, `src/lib/providers.functions.ts`, `src/routes/_site.dashboard.listing.$placeId.tsx`, `src/routes/_site.provider.$slug.tsx`, `src/routes/_site.login.tsx`, `src/routes/_site.match.tsx`.
