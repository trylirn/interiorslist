# Fixes: matches, search header, featured, sidebar, sign-in, admin account

## 1. Get Matched — always up to 3 studios
Matching already caps results at 3, but studios that don't tick a service/style/project box can be filtered out, so people can end up with fewer. Change: always fill the list to 3 by falling back to the next-best studios (featured first, then verified, then the rest), while genuinely matching studios still come first.

## 2. "Get matched in 30 seconds" band on Find a Studio
Add a header block at the top of /search, styled like the reference: page title on the left, a dark "Get matched in 30 seconds →" button on the right linking to the quiz, a short intro paragraph, a live "X studios available" line, and a thin strip below showing studio count, client review count, and a trust line. Numbers come from the existing directory stats, not hardcoded.

## 3. Featured becomes plan-driven, not a free toggle
Add a plan field on each studio (free / premium) with an optional expiry date. Featured is then derived: a studio is featured while its plan is premium and not expired. The admin listings table loses the standalone Featured switch and instead shows the plan; setting a studio to premium marks it featured automatically, and moving back to free (or passing the expiry) removes it. This leaves a single switch to flip when card payments are added later.

## 4. Remove "Back to dashboard" from the studio sidebar
Delete that link from the listing management screen.

## 5. Sign-in link that doesn't sign you in
Cause: the emailed link points straight at /dashboard and relies on a security code stored in the browser that first asked for the link. Opening the email on a phone, in a different browser, or through a mail-app preview means that code is missing, so nothing signs in and you land on the dashboard signed out.

Fix: add a dedicated landing page for email links that completes sign-in from the link itself (works in any browser), shows "Signing you in…", then sends you to the dashboard, or shows a clear "This link has expired — request a new one" message with a resend button. Point the sign-in email at this page.

## 6. Admin: Account moves into the sidebar
Hide the top-bar "Account" link for admins (they get it in the sidebar instead; non-admin studio owners keep it). Add an Account item to the admin sidebar with a working page: their email and contact details, editable name/phone/role, and sign out. Closing the account stays unavailable for super admins, as today.

## 7. Reviews import
Google review import is fixed and working (it finds the studio on Google by name and address, then pulls up to 5 reviews plus the rating). Google caps this at 5 reviews — that's their limit, not ours.

New: import from the studio's own website. The studio pastes a page URL containing their testimonials; we read that page, pull out the quotes and author names, show them for the studio to confirm, and save the confirmed ones marked as self-reported from their website (clearly distinguished from Google reviews). Yelp/Houzz are not included — they don't allow this without paid licensing.

## Technical notes
- `src/lib/match.functions.ts`: fill-to-3 fallback after the qualifying sort.
- `src/routes/_site.search.tsx`: new header band using `getDirectoryStats`.
- Migration: `providers.plan text default 'free'`, `plan_expires_at timestamptz`; `featured` kept as the derived flag, set by the plan update path. Admin toggle for `featured` removed from `src/lib/admin.functions.ts` and `_site.admin.tsx`.
- `src/components/listing-manager.tsx`: drop the back link.
- New public route `src/routes/_site.auth.callback.tsx` handling both `token_hash` (verifyOtp) and `code` (exchange) params; `emailRedirectTo` in `_site.login.tsx` points to it.
- `src/routes/_site.admin.tsx`: add `account` nav key rendering `AccountSettings`; `site-chrome.tsx` hides the header Account link when the signed-in user is an admin.
- New server fn for website review import (fetch page, extract testimonials, return candidates; separate confirm-and-save step) with rate limiting, storing `source: 'website'`.
