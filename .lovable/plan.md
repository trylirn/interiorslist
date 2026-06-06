# Fixes & follow-ups

## 1. Duplicate listings in admin

Not normal — the v2 seed import re-inserted ~20 providers under fresh `place_id`s (e.g. "Maui MedSpa Austin" exists twice). The earlier `ON CONFLICT (place_id)` dedupe didn't catch them because the duplicates have different place_ids.

**Fix (migration):** for each `(lower(name), lower(city))` group, keep the row with the most data (most non-null columns, oldest `created_at` as tiebreaker), reassign any `claims/reviews/contact_messages/favorites/provider_views/provider_faqs` to the survivor, then delete the dupes. Add a partial unique index `ux_providers_name_city` on `(lower(name), lower(city))` to prevent re-introduction.

## 2. Admin shouldn't see brand dashboard

`/dashboard` currently shows Listings/Leads/Reviews to every signed-in user. Change behavior:

- If `isAdmin` and **no** claimed listings → redirect to `/admin`.
- Hide the "My Listings / Leads / Reviews" tabs entirely when the user has zero owned providers; instead show a small "You don't manage any listings" panel (with Admin shortcut if admin, or Claim/Submit CTAs otherwise).
- In `SiteHeader`, route admins' avatar menu primary item to `/admin`.

## 3. Brand info / uploads / FAQs

Brand listing editor (`/dashboard/listing/$placeId`) already supports profile fields and FAQs. Gaps to close:

- Add **photo gallery upload** in the Info tab — multi-file upload to a new public `provider-photos` bucket (`{placeId}/...`), persist URLs to `providers.gallery_urls text[]`, render in the public provider page.
- Add **hero photo upload** (replaces the URL-only field) using the same bucket.
- Surface FAQs publicly in `/provider/$slug` under a "Frequently asked questions" accordion.
- Migration: add `providers.gallery_urls text[]` (if missing), create public storage bucket `provider-photos` with RLS allowing the listing owner (and admins) to upload/delete and anyone to read.

## 4. Account creation: brands required, consumers not required 

Today `/login` has only "Sign in" + "Create business account." Restructure tabs to three:

1. **Sign in** (email/password or Google) — unchanged.
2. **Create business account** — current wizard, but **license upload becomes optional** (file input + license number remain present, only `licenseType` is required to flag the account; `license_doc_path` may be null and the admin queue shows "no doc yet").

Anonymous users keep full browsing. Update copy on `/login` accordingly.

## 5. Phone on lead forms

- `/provider/$slug` contact form: phone is currently optional — make it **required** (label "Phone *", `required` attribute, min length 7).
- `/match` consult flow: collect phone in the answers step (already gathers first/last/email) and pass it through to `sendContactMessage` (currently hard-codes `phone: ""`).
- `sendContactMessage` validator already accepts phone — tighten to `z.string().min(7).max(40)` to enforce server-side.

## 6. Email forwarding of leads → brand inbox

**Yes, this is straightforward.** Recommended platform: **Lovable Emails** (built-in, no API key needed) — same infrastructure already used for app emails on this stack. It uses your own sender domain and queues + retries automatically.

How it plugs in:

- Set up a sender domain (one-time, via the email setup dialog).
- Add a server-side trigger in `sendContactMessage`: after inserting the row, look up `providers.email_forward_to` (a new column the brand owner sets in their dashboard; falls back to the original Google-Places `email` only when the listing is claimed and the owner opted in). Enqueue a "New lead" email to that address with the lead's name/phone/email/message and a link to `/dashboard`.
- Log to `email_send_log`; brand dashboard gets a small "Email forwarded ✓ / failed" status next to each lead.
- Alternative if you prefer a third party: **Resend** (connector available). Only worth it if you want their dashboard/analytics — otherwise Lovable Emails is simpler and free of API key management.

## Technical notes

- New columns: `providers.gallery_urls text[] default '{}'`, `providers.email_forward_to text`.
- New storage bucket: `provider-photos` (public read, owner/admin write).
- New unique index: `create unique index ux_providers_name_city on providers (lower(name), lower(city))`.
- Files to touch: `_site.dashboard.tsx`, `_site.dashboard.listing.$placeId.tsx`, `_site.provider.$slug.tsx`, `_site.match.tsx`, `_site.login.tsx`, `lib/contact.functions.ts`, `lib/owner.functions.ts`, `components/site-chrome.tsx`, plus one migration and (after the email domain step) a lead-notification template.

## Out of scope (ask before doing)

- Backfilling `email_forward_to` for unclaimed listings.
- SMS notifications for new leads.
- Email setup itself (requires user to complete the domain dialog) — I'll prompt for it when we implement #6.