# Launch readiness review — and what to fix

I walked both journeys and checked the live data and email records behind them.

## Homeowner journey — mostly working

Working: home page, search with filters, city/state and style pages, studio profiles (reviews, hours, FAQs, gallery), compare, Get Matched quiz with adaptive questions and the 3-studio blurred result gate, budget estimator, colour palette tool, blog, FAQ, guides.

Gaps:
- After sending an enquiry (profile page or Get Matched), the homeowner gets **no confirmation email**. Nothing lands in their inbox, so the request feels like it went nowhere.
- No enquiry has ever been submitted on the live site (0 records). The path has never run end to end in production.

## Studio owner journey — one blocking gap

Working: claim a listing, confirmation email on claim, admin review with approved / needs-info / rejected emails, sign-in by link or 8-digit code, dashboard with About, Media, Certificates, FAQs, Leads inbox, Reviews (including Google and website review import), Metrics, Settings with account closure. One studio per owner is enforced.

Blocking gap — **lead emails will not reach almost any studio**:
- Of 1,119 studios, **none** have a contact email stored and only 4 have a forwarding address set. The code sends the lead email only when one of those two exists, so today a new enquiry is saved silently and nobody is told.
- Nobody is notified on your side either, so a lead for an unclaimed studio simply sits in the database.
- Only 1 studio out of 1,119 has been claimed, so nearly every lead currently belongs to a listing with no owner logged in.

Also missing: you get no notification when a new claim or a new studio submission arrives — you have to remember to check the admin area.

## Email system status

The sender domain notify.intearior.com is verified and sending successfully; recent sign-in and claim emails were delivered with no bounces or complaints. The plumbing is healthy — the problem is that lead emails are never triggered for studios with no address on file.

## Verdict

Close to launch, but not launchable as-is: the lead path is the product, and right now a lead can arrive and reach no one. The fixes below are small.

## What I will change

1. **Homeowner confirmation email** — a new "we sent your request" email listing the studio(s) contacted and what happens next, sent after every enquiry from a profile page and from Get Matched.
2. **Never lose a lead** — when a studio has no email on file, forward the lead to an Intearior operations address instead, and mark it in the admin leads view as "no studio contact". Add a visible "unclaimed — needs outreach" flag.
3. **Fill in studio contact emails** — add an admin field to set a studio's contact email, plus a bulk view of leads whose studio has no address, so you can chase them.
4. **Notify you on new claims and new studio submissions** — an email to the Intearior operations address so nothing waits unseen.
5. **Prompt owners to set forwarding** — a banner in the studio dashboard when no forwarding email is set, next to the existing test-email button.
6. **End-to-end check** — submit a real enquiry and a real claim on the live site and confirm every email lands.

## Technical notes

- New templates in `src/lib/email-templates/`: `enquiry-confirmation`, `claim-submitted-admin`, `submission-received-admin`; register them in `registry.ts`.
- `src/lib/contact.functions.ts`: after insert, always send the homeowner confirmation; resolve the studio recipient as `email_forward_to || email || OPS_EMAIL`, and record which was used.
- `src/lib/claim.functions.ts` and `src/lib/submissions.functions.ts`: add the ops notification, best-effort, never blocking the write.
- Admin: editable `email` on the provider record; leads list gains a "no studio contact" filter.
- Ops address stored as a single constant so it can be changed in one place.

## Needs your input

Which address should receive lead and admin notifications when a studio has none on file? (for example leads@intearior.com)
