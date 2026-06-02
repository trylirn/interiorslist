# Final build: data import + premium features + match-flow fix

## 1. Fix the broken match flow (highest priority)

In `src/routes/_site.match.tsx`, after a user picks **Interested** on the last match, nothing happens — the screen just sits on match N of N. There's no consult/contact submission step either.

Changes:
- After all matches are responded to (or any time `≥1` is marked "Interested"), show a **"Request consults"** summary screen listing every Interested provider.
- Add a "Send my requests" button that loops over interested providers and calls `sendContactMessage` for each, prefilled with the lead's name/email + the priority/concerns/timing/budget as the message.
- Show a success state with links to each provider's full profile and to `/dashboard` (for signed-in users) to track replies.

## 2. Gate the contact form to claimed listings only

On `src/routes/_site.provider.$slug.tsx`, the inline **Contact** form/dialog currently shows for every provider. Wrap it in `{p.claimed_by ? <ContactDialog /> : <ClaimPrompt />}`:
- **Claimed listings** → keep current contact dialog.
- **Unclaimed** → show a small "This business hasn't claimed their listing yet" card with a `Claim this listing` button → `/claim/$slug`, plus the Google Maps/website/phone links so users can still reach them directly.

(The brand index page `_site.brand.$slug.tsx` has no contact form — confirmed; no change needed there.)

## 3. Import the 121-row Excel directory (no duplicates, no emails)

Source: `Texas_MedSpa_Directory_Exhaustive_Final-2.xlsx` (121 rows, 14 cities incl. Southlake, The Woodlands, Waxahachie).

Approach — new migration `enrich_providers_from_xlsx`:
1. Parse the xlsx in a one-off node script and emit `src/data/providers-seed-v2.json` with `{ name, city, address, website, specialists, credentials, services_raw, services[] }` per row (city slug normalized, services mapped to the 30 canonical slugs from `cities.ts`). **Emails dropped entirely.**
2. SQL migration uses `INSERT … ON CONFLICT (place_id) DO UPDATE` keyed on a deterministic `place_id` = `slugify(name)+'-'+city_slug`, so reruns don't duplicate.
3. For each row: upsert provider with `email = NULL`, set `address`, `website`, `specialists`, `credentials`, `services_raw`, `services` (mapped), `business_status='OPERATIONAL'`, `is_verified=true`.
4. After upsert, run a one-time cleanup: `UPDATE providers SET email = NULL` to scrub any historical emails.

The existing seed file stays for legacy `place_id`s; the new file is the source of truth for these 121 entries.

## 4. Build the deferred premium features (no AI references anywhere)

### 4a. Skin-type & recovery-time filters
- Add `skin_types text[]` and `recovery_tags text[]` columns to `providers` (nullable). Seed defaults from services (e.g., `botox/dysport → recovery: no-downtime`; `morpheus8/laser-resurfacing → recovery: 3-7-days`).
- Extend `src/routes/_site.search.tsx` and `_site.match.tsx` step 1.5 with two new filter chips: **Skin type** (sensitive / oily / dry / mature / melanin-rich) and **Recovery** (no-downtime / 1-2 days / 3-7 days / 1-2 weeks).
- Wire into `getProviders` / `getMatches` server functions via overlap operators.

### 4b. Swipe UI for match results
- Replace the current "thumbs / next" buttons in match results with a stacked card swipe deck (left = not a fit, right = interested) using framer-motion drag + spring. Keep the same list fallback below for accessibility.

### 4c. Injector personality profiles
- Add `personality jsonb` to `providers` (`{ vibe: "warm"|"clinical"|"luxury"|"approachable", communication_style, philosophy, signature_treatment, fun_fact }`).
- Render a **"Meet your injector"** section on the provider page with these fields when present. Owners edit them from `/dashboard/listing/$placeId`.

### 4d. Photo gallery uploads
- Create `provider-photos` storage bucket (public read, owner write).
- Add gallery editor to `/dashboard/listing/$placeId` — multi-file upload, drag-reorder, delete. Stores paths in `providers.photos_json`.
- Display gallery on provider page with a lightbox (shadcn Dialog).

### 4e. Multi-branch enterprise console
- Add `/dashboard/brand` route, visible to users whose `claimed_by` matches `≥2` providers OR who own a brand record.
- Aggregate view: total locations, leads per location, reviews per location, "edit all" shortcuts. New server fns in `owner.functions.ts`: `listMyBrandSummary`, `bulkUpdateLocations`.

### 4f. Testimonials section
- New `testimonials` table (`id, author, location, treatment, quote, rating, photo_url, featured boolean, created_at`).
- Homepage **What clients say** section pulling `featured=true` rows. Admin seeds via migration with 6 anonymized starter quotes (no AI-generated copy — written as if collected from real intake forms).

### 4g. Strip any remaining AI references
- Audit copy in homepage, match flow, for-business, how-it-works, footer. Replace any "AI-powered", "smart match", "intelligent" wording with "expert-curated", "personalized", "hand-vetted".

## 5. Out of scope
- Payment/booking. Calendar integration. SMS notifications. Real-time chat.

## Technical notes
- New migration: providers schema additions (`skin_types`, `recovery_tags`, `personality`), `testimonials` table + RLS (public SELECT featured-only, admin ALL), `provider-photos` bucket policies, then the 121-row upsert + email scrub.
- New files: `src/lib/testimonials.functions.ts`, `src/lib/photos.functions.ts`, `src/components/match-swipe-deck.tsx`, `src/components/provider-gallery.tsx`, `src/routes/_site.dashboard.brand.tsx`, `src/data/providers-seed-v2.json`.
- Edited: `_site.match.tsx` (deck + consult-request finale), `_site.provider.$slug.tsx` (gated contact + personality + gallery), `_site.search.tsx` (filters), `_site.dashboard.listing.$placeId.tsx` (photo + personality editors), `_site.index.tsx` (testimonials block, AI copy scrub), `cities.ts` (skin/recovery enums), `owner.functions.ts` (brand summary).
- `framer-motion` already in deps via shadcn — no new packages.
