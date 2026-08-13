# Email leads straight to studios

Short answer: you don't need Resend. Lovable has built-in email sending — you only need a sender domain you own (e.g. `notify.intearior.com`). Once that's verified, every consultation request can be emailed to the studio instantly.

## What gets built

1. **Sender domain setup** — one-time step; you point a subdomain at Lovable and it handles delivery, retries, bounces and unsubscribes.
2. **Lead notification email** — a branded template matching the site (logo, brand colour) containing the full brief exactly as the dashboard shows it:
   - Client name, email, phone
   - Location, project type, budget, style, timeline, rooms
   - The written message
   - A button to open the studio dashboard leads tab
3. **Automatic sending** — when someone submits the form on a studio page or picks studios in Get Matched, the lead is saved as it is today *and* emailed to that studio. Reply-to is set to the client so the studio can just hit Reply.
4. **Where it sends** — uses the studio's notification email: the `email_forward_to` field if set, otherwise the listing's `email`. Studios with no email on file are skipped silently (lead still lands in the dashboard).
5. **Studio control** — the studio dashboard gets a "Lead notification email" field so claimed studios can set where alerts go.
6. **Optional confirmation to the client** — a short "your request was sent to X" email. Say the word if you want it.

## Notes

- Delivery outcomes (sent, bounced, complaints) are visible in Cloud → Emails.
- Nothing changes for leads already in the database; this only affects new submissions.

## Technical notes

- Scaffold the app-email template system, add `lead-notification.tsx` (and optionally `lead-confirmation.tsx`) to `src/lib/email-templates/`, registered in `registry.ts`.
- `sendContactMessage` in `src/lib/contact.functions.ts`: after the insert, look up the provider row (`email_forward_to`, `email`, `name`, `slug`) via the admin client and call `sendTemplateEmail` with an idempotency key from the inserted message id. Wrap in try/catch so an email failure never fails the lead submission.
- Match flow sends once per selected studio via the same server function, so no separate wiring is needed there.
- Add `email_forward_to` to the editable fields in `src/lib/owner.functions.ts` `updateMyListing` and to `src/components/listing-manager.tsx`.
