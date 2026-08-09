# Claim review conversation + full lead details

## Answering your question first

**Leads: partly already.** Consultation requests (both from a studio page and from Get Matched) already save the person's first name, last name, email, phone and a written brief, and the studio sees all of it in Dashboard → Leads. The brief lines (location, project type, budget, style, timeline, rooms, notes) are already collected — but they're squashed into one plain block of text, so it reads as a paragraph rather than the clean labelled layout you described. Nothing is hidden or paywalled today.

**Claims: partly.** Claims are created as "pending" and an admin can Approve or Reject. What's missing is any way to say *why* — no rejection reason, no "send me proof of ownership" request, and no way for the claimant to reply or upload anything.

## 1. Leads shown as a structured brief

- Store the brief's answers as named fields alongside the free-text message, so location, project type, budget, style, timeline, rooms and scope are separate values.
- Studio dashboard lead card and the admin leads view render:

```text
Sarah Miller · sarah@email.com · (305) 555-0148
Location:  Miami, FL
Project:   Full home interior design
Budget:    $50,000–$100,000
Style:     Modern
Timeline:  Within 60 days

Client message:
"We're renovating our 4-bedroom home and are looking for..."
```

- Everything visible, nothing gated — while the site is free the full contact details show for every lead.
- Older leads with no structured fields keep showing their existing text block.

## 2. Claim review with back-and-forth

- New claim states: **pending**, **needs_info**, **approved**, **rejected**.
- Admin actions on each claim: Approve, Reject with a reason, or Request more info with a written note (e.g. "please send a business licence or a photo of signage").
- Every note is kept as a threaded list of messages on the claim, showing who wrote it and when.
- Claimant side: a claim status page (linked from the dashboard, and reachable from the claim confirmation) where they can read the admin's note, reply, and attach a proof file. Replying moves the claim back to pending for review.
- Claims filed without an account use a private link token sent to the contact email address so they can still reply.
- Admin sees the reply and any attachments inline, then approves or rejects.

## Technical notes

- Migration: add `claim_messages` table (claim id, author id or "admin"/"claimant", body, attachment path, created_at) with grants and RLS; extend `claims` with `status` value `needs_info`, `decision_reason`, `access_token`, `last_message_at`. Proof files go to the existing private `business-docs` bucket, read through signed URLs.
- Migration: add structured columns to `contact_messages` (`location`, `project_type`, `budget`, `style`, `timeline`, `rooms`) — nullable so existing rows are unaffected.
- `sendContactMessage` in `src/lib/contact.functions.ts` accepts the structured fields; `consultation-form.tsx` and `_site.match.tsx` pass them instead of only concatenating text (the human-readable brief is still stored as the message).
- `reviewClaim` in `src/lib/admin.functions.ts` gains `needs_info` and a reason/note; new server fns for listing and posting claim messages (admin-guarded, plus a token-scoped path for account-less claimants).
- UI: `src/routes/_site.admin.tsx` claims tab (status filter + note composer), `src/routes/_site.dashboard.tsx` leads tab (structured card) and claims section, new `src/routes/_site.claim.status.$id.tsx`.
