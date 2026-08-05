# Fixes: dashboard error, rebrand to Discover Medspa, onboarding prompts

## 1. "Open my dashboard" error (root cause confirmed)

The provider dashboard loads a listing with `select("*")`. On the database, the `providers` table has no table-wide read permission for signed-in users — reads are allowed column by column, and three columns (`email_forward_to`, `certificate_urls`, `document_urls`) are intentionally restricted to trusted server access only. So `select("*")` is rejected outright and the page errors before it can render — for admins and providers alike.

Fix:
- Replace `select("*")` in `getMyListing` with an explicit list of the readable columns.
- Load the three restricted columns separately inside the same server function, using the trusted server client, only after confirming the caller is the listing owner or an admin. That keeps certificates/files/forwarding email working in the dashboard without loosening public access.
- Same treatment anywhere else the owner/admin path reads restricted columns (media, docs, save handlers).

## 2. Rename to "Discover Medspa"

Replace every user-visible "Texas Aesthetics" with "Discover Medspa" across page titles, meta/OG tags, header/footer, JSON-LD organisation name, `public/llms.txt`, Terms and Privacy. Texas-specific copy about coverage stays as is (it is still a Texas directory); only the brand name changes.

## 3. Claim link on sign in / sign up

Under the auth form on `/login`, add: "Are you a professional? Claim your profile →" linking to `/claim`.

## 4. /for-business buttons

- "Claim existing listing" / "Sign in to claim" → `/claim`
- "Submit your business" → `/login` in sign-up mode (`/login?mode=signup&next=/submit`), so new accounts are created first, then land on the submit form.

## 5. Approval process (verify + complete)

Current state: admin has Claims and Submissions tabs with approve/reject actions; both write status back to the row. Work to do:
- Walk the full path end to end and fix gaps: claim submitted → appears in admin Claims → approve sets `claimed_by` on the provider and marks the claim approved → owner sees the listing in their dashboard.
- Submission approved → creates/publishes the provider listing and links it to the submitter (`resulting_place_id`).
- Add a visible status page for the submitter/claimant: pending / approved / rejected shown on `/dashboard` instead of an empty state.
- Add an approval-state note in the admin tabs so it's clear what each action does.

## 6. Google sign-up → profile setup banner

After sign-up (including Google SSO), if the account has no claimed listing and no pending claim/submission, show a persistent banner on `/dashboard` and site-wide header: "Finish setting up your provider profile" with two actions — Claim your listing / Submit your business. The banner disappears automatically once a claim, submission, or claimed listing exists.

## 7. Visitor quiz prompt (no email capture)

A single, polite prompt inviting visitors to the match quiz.
- Trigger: after ~20 seconds or on second page view of a session, never instantly on first paint.
- Frequency: at most once per session; when dismissed, suppressed for 60 days; when the user starts the quiz, signs up, or claims, suppressed permanently.
- Returning visitors who dismissed once and come back after the window see a different, lighter message (e.g. a slim bottom bar "Still deciding? Get matched in 60 seconds" instead of the modal), rotating between two variants.
- Never shown on `/match`, `/login`, `/claim`, `/submit`, `/admin`, or dashboard pages.
- No email field anywhere in the prompt.

## Technical notes

- State for the prompt lives in `localStorage` (dismiss timestamp, variant index, converted flag) — no tracking pixel or email storage.
- Restricted-column reads go through the trusted server client inside `owner.functions.ts`, guarded by the existing owner/admin check; no RLS or grant changes, so the resolved security findings stay resolved.
