# Sam's List-inspired claim & review flows, admin fixes

## 1. Claim a profile — no sign-in required

Today `/claim/$slug` blocks anyone not signed in and `submitClaim` requires an authenticated session.

New flow, modelled on the Sam's List screens:

- **Step 0 (new page `/claim`)** — "Claim Your Profile": paste your listing URL, or search by name. Results list matching med spas; picking one goes to `/claim/{slug}`.
- **Step 1 (`/claim/$slug`)** — a single clean card: "← Choose a different profile", then First name, Last name, Email, Phone, Position in company, Reason for claiming. Submit with no account needed.
- Confirmation keeps the existing message: someone reaches out shortly, listing costs $50/month.
- Signed-in users see the same form, pre-filled with their email, and the claim is linked to their account.

Security: the claim is written by a server function using a trusted server client — no anonymous write access is opened on the database. Input is validated and length-capped, and a simple per-email/per-listing throttle prevents spam.

## 2. Write a review — multi-step wizard

Replace the single dialog on the provider page with a dedicated `/review` page (and `/review/$slug` when arriving from a listing), styled like the Sam's List wizard with a numbered 1-2-3-4 progress bar:

1. **Find the provider** — search by name/city, or tick "This med spa isn't listed yet".
2. **Your experience** — client type (dropdown), currently a client (Yes / No / Never), start & end year, what led you to choose them, and the free-text experience with a 40-character minimum and live counter.
3. **Ratings & conflicts** — star ratings for Communication, Treatment results, Cleanliness & safety, Value, Overall; plus two required dropdowns: any personal/professional relationship, and any payment or benefit received for the review.
4. **About you** — name and email (email stays private), then submit.

Sign-in stays required at submit time for reviews (an unauthenticated visitor completing the wizard is sent to sign in and returned to the finished draft). The "Write a Review" button on provider pages and in the header opens this wizard instead of the old dialog.

## 3. Admin: "Open my dashboard" not working

Cause confirmed: `/admin` has child routes (`/admin/provider/$placeId`, `/admin/articles`), which makes it a parent route, but its component never renders `<Outlet />`. Clicking the button changes the URL while the admin page keeps rendering, so nothing appears to happen.

Fix: render the child outlet when a child route is active, otherwise render the admin tabs. The sandbox listing row (`demo-admin-listing`) already exists, so the dashboard will load once routing works.

## 4. Remove Maps from Admin

Delete the "Maps" tab and its geocoding panel from the admin page. The geocoding server functions stay in place (provider pages still auto-geocode on demand).

## Technical notes

- Extra review fields (client type, relationship/benefit disclosures, sub-ratings, engagement years) need new columns on `reviews`, added via one migration with grants and RLS preserved; existing reviews stay valid.
- `claims` gains name/position fields and allows an unauthenticated submission path recorded with a NULL user; writes go only through the server function, not a public insert policy.
- Files touched: `src/routes/_site.claim.$slug.tsx`, new `src/routes/_site.claim.index.tsx`, new `src/routes/_site.review.tsx` (+ `$slug` variant), `src/routes/_site.provider.$slug.tsx`, `src/routes/_site.admin.tsx`, `src/lib/owner.functions.ts`, `src/lib/contact.functions.ts`, `src/components/site-chrome.tsx`.