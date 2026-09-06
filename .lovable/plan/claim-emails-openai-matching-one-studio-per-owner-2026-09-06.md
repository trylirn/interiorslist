# Claim emails, OpenAI matching, one studio per owner

Three changes: automatic claim status emails, Get Matched powered by OpenAI (with the current engine as backup), and a hard limit of one studio per owner.

## 1. Automatic claim emails

Anyone who claims a studio gets an email at each stage, sent from your Intearior sender address:

- **Received** — right after they submit, confirming it's under review (1–2 business days) with a link to their claim page.
- **More info needed** — when your team asks for proof, including the note your team wrote and a link to reply/upload.
- **Approved** — congratulations, with a link to sign in and manage the listing.
- **Not approved** — the reason your team gave, plus how to respond.

Details: each stage is a branded React Email template registered in `src/lib/email-templates/registry.ts`. The "received" send goes at the end of `submitPublicClaim` (skipped for duplicate claims); the other three are triggered in `reviewClaim` in `src/lib/admin.functions.ts`, keyed off the action. Sends use the existing `sendTemplateEmail` helper with an idempotency key of claim id + stage, wrapped so an email failure never blocks the claim decision. Suppressed recipients are treated as a normal skip.

Note: emails only leave the system once the DNS records for notify.intearior.com finish verifying.

## 2. Get Matched on OpenAI, Lovable AI as backup

The Get Matched interview will call OpenAI directly using your API key, with the current engine kept as an automatic fallback so matching never goes down.

- Primary: OpenAI `gpt-4o-mini`, same JSON question/criteria contract as today.
- Fallback: if the key is missing, or OpenAI returns a rate limit, quota, or server error, the request retries once on the existing Lovable AI engine.
- If both fail, the user sees the same friendly "try again in a moment" message as today.

Details: in `src/lib/match-ai.functions.ts`, `callAI` becomes `callOpenAI` (`https://api.openai.com/v1/chat/completions`, `response_format: json_object`) plus the existing `callLovable`, behind a `callWithFallback`. The key is read inside the handler from a new `OPENAI_API_KEY` secret — I'll open the secret prompt for you to paste it in.

## 3. One studio per owner

Studio owners can only ever hold a single listing.

- The claim form refuses a second claim: if the signed-in account (or the contact email) already owns a studio, or already has an approved claim, it shows "This account already manages a studio" instead of submitting.
- Approving a claim in the admin console is blocked with a clear message when that person already owns a studio, so a second one can't be attached by mistake.
- Submitting a new business is likewise blocked for accounts that already manage a listing.
- The dashboard drops all multi-listing wiring and simply loads the owner's single studio.

Details: a shared `assertNoExistingStudio(ownerId, email)` helper in `src/lib/owner.functions.ts` checks `providers.claimed_by` and approved claims; it is called from `submitPublicClaim`, `reviewClaim` (approve branch) and `submitBusiness`. `listMyListings` is replaced by a `getMyListing`-style single fetch used by `src/routes/_site.dashboard.tsx`. Current data already has at most one studio per owner, so no cleanup migration is needed.

## Verification

Typecheck and a production build, plus a live check that the claim flow and Get Matched still work end to end.
