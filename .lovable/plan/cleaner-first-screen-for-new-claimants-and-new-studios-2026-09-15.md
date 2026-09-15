# Cleaner first screen for new claimants and new studios

Right now anyone who signs in without an approved listing sees the same "You don't manage any listings yet" card, even when they already have a claim or a business submission waiting. And people who submit a brand new business get no email at all until an admin acts.

## What changes

### 1. Dashboard shows one clear state

When someone signs in, the dashboard picks exactly one of these:

- **Approved / owns a listing** — the normal studio dashboard, unchanged.
- **Claim waiting (pending or more info needed)** — only the claim status card and the "Your claims" list. The "You don't manage any listings yet" card is removed from this state.
- **Business submission waiting, no claim** — a single friendly card: their business is being reviewed and verified, with what happens next and roughly how long it takes. No listings card, no claims section.
- **Nothing submitted yet** — the existing "You don't manage any listings yet" card with Find your listing / Submit a business.

Once a claim or submission is approved, the account owns the listing, so the dashboard automatically becomes the normal studio dashboard.

### 2. "Finish your studio details" notice

Newly approved studios see a small dismissible notice at the top of their studio dashboard prompting them to complete their details (description, services, styles, photos, contact email for leads). It disappears once the key fields are filled.

### 3. Emails

- **New business submitted** — the submitter now gets a confirmation email (today only the Intearior team is alerted).
- **Business submission approved** — a new email telling them their studio is live, with a link to their dashboard and a nudge to complete their details.
- **Claim approved** — existing email updated to ask them to finish their studio details, with the dashboard link.

All of these go to the address on the account they registered with, falling back to the address typed into the claim/submission form when the account has none.

## Technical notes

- `src/routes/_site.dashboard.tsx`: branch on `listMyListings` → `listMyClaims` → pending submissions before rendering the empty-listings card. Pending submissions come from `getMyOnboardingStatus` (already returns `pendingSubmissions`).
- New `SubmissionPendingCard` in the dashboard route; existing `OnboardingBanner` retired since the claim/submission states now carry the messaging.
- `src/components/listing-manager.tsx`: add the completeness notice, derived from the loaded listing (about_description, services, styles, gallery, email_forward_to) and dismissible via localStorage.
- New templates in `src/lib/email-templates/`: `submission-received` (to submitter) and `submission-approved`; registered in `registry.ts`.
- `src/lib/submissions.functions.ts`: send the submitter confirmation alongside the existing ops alert.
- `src/lib/admin.functions.ts` `reviewSubmission`: on approve, send the approval email; recipient resolved from the submitter's profile email, falling back to `contact_email`.
- `claim-approved` copy in `src/lib/email-templates/claim-status.tsx` gains the "complete your details" line; claim emails already resolve recipients — extend to prefer the account email when `user_id` is set.
