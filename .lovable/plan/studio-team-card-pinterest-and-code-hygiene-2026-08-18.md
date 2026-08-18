# Studio team card, Pinterest, and code hygiene

## 1. Pinterest social link

Add a Pinterest field to the studio dashboard socials row (next to Instagram, Facebook, TikTok, YouTube, LinkedIn, X), save it into `social_links.pinterest`, and render the chip on the public studio page like the other socials.

## 2. "Meet the team" card on studio pages

The `providers` table already has an unused `team` JSON column — use it, no migration needed.

Dashboard: replace the single free-text "Designers on staff" box with a repeatable team editor. Each member row has:

- Name (required)
- Role / position (required)
- Short intro (optional, ~600 chars)
- Add member / remove member buttons, drag-free ordering by position in the list

The old free-text value is shown once as a prefilled hint so existing studios can migrate it manually; the legacy `specialists` text keeps rendering only when no structured team exists.

Studio page: a new "Meet the team" card directly below the main profile card — a two-column grid of soft-tinted member cards showing name (display font), role, and intro in muted text, matching the reference layout. No photos. The card is hidden entirely when a studio has no team members.

## 3. `.env` in git

Recommendation: keep it. This file is generated and maintained by the backend integration and holds only the publishable/anon key, project ID and URL — values that ship to the browser anyway and are not secrets. The build reads them at compile time, so deleting the file breaks preview and production builds. Real secrets (service role key, API tokens) are never in it; they live in the encrypted secret store. No change unless you'd still prefer it removed.

## 4. Rate limiting on `sendContactMessage`

Worth addressing, with a caveat: the platform has no built-in rate-limit primitive, so this would be an ad-hoc, database-backed limit. Proposed approach if you approve: a small `rate_limits` table keyed by hashed IP + endpoint with a rolling window, checked at the top of `sendContactMessage` (and reused by the review and claim endpoints), rejecting more than ~5 submissions per IP per hour with a friendly message. Say the word and it goes in this pass; otherwise it stays out. - Approved.

## 5. Raw database errors leaking to users

`throw new Error(error.message)` appears ~46 times across 15 server-function files, so Postgres text lands in toasts.

Fix: add `src/lib/errors.ts` with a `fail(error, userMessage)` helper that logs the real Postgres error server-side and throws a clean, generic message ("Couldn't save your changes. Please try again."). Replace every raw throw across those files with a context-appropriate friendly message. Client toasts then show the friendly text; nothing about the schema is exposed.

## 6. Merge duplicate admin checks

`src/lib/caller-role.ts` has `callerIsAdmin` / `callerIsSuperAdmin` (boolean, RPC-based); `src/lib/admin.functions.ts` has its own inline query that throws on failure. Consolidate: keep `caller-role.ts` as the single source, add a throwing `requireAdmin(supabase, userId)` wrapper there, and have `admin.functions.ts` call it instead of querying `user_roles` directly.

## Technical notes

- Files touched: `src/components/listing-manager.tsx`, `src/routes/_site.provider.$slug.tsx`, `src/lib/owner.functions.ts` (schema: `social_links` already generic; add `team` array validation, keep `specialists`), `src/lib/providers.functions.ts` (add `team` to public column list), `src/lib/caller-role.ts`, `src/lib/admin.functions.ts`, plus the error-message sweep across `src/lib/*.functions.ts`.
- No database migration required for items 1, 2, 5, 6.