# Fix the Submit Studio button (and audit other actions)

## What's wrong

The "Submit studio" button on `/submit` calls a server action that requires a signed-in account. The page itself is public and never asks anyone to sign in, so for a logged-out visitor the request is rejected and the form just shows a failure toast — nothing is saved. This is the same reason the "Submit your business" links on the For Business page point at `/login` instead of the form.

## The fix

1. **Make studio submission work without an account**, the same way claiming a listing already does: a public, validated, rate-limited submission path that writes the entry into the review queue through the trusted server client. If the visitor happens to be signed in, their account is attached to the submission so it appears in their history.
2. **Link straight to the form.** The two "Submit your business" buttons on For Business go to `/submit` instead of `/login`.
3. **Better feedback.** Validation problems (bad website URL, missing email) show a clear inline message instead of a generic "Submission failed".

## Audit of other actions

Checked every button that talks to the backend. Results:

- Contact / consultation form on studio profiles and match results — public, works.
- Claim a listing — public, works.
- Favorites (heart) — correctly sends signed-out users to sign in.
- Write a review — correctly sends signed-out users to sign in, then returns them to the review.
- Dashboard, admin and super-admin actions — sit behind sign-in and are reached from authenticated pages only.

Only the studio submission was calling a sign-in-only action from a public page, so it is the single broken button. While in there I'll also quietly fix a homepage warning where the studio count briefly renders one number on load and another right after.

## Technical notes

- Add `submitPublicBusiness` to `src/lib/claim.functions.ts` (or a sibling `submissions.functions.ts`): Zod-validated, throttled per email per hour, insert via `supabaseAdmin` into `public.submissions`, attaching `submitted_by` when a session exists. No new anon RLS policy.
- Point `src/routes/_site.submit.tsx` at the new function; keep the existing success state.
- Update the two `/login` links in `src/routes/_site.for-business.tsx` to `/submit`.
- Homepage: make the directory-stats query render the same value on server and client (serve the loader snapshot rather than refetching immediately) to clear the hydration mismatch in `src/components/hero-match-card.tsx`.
