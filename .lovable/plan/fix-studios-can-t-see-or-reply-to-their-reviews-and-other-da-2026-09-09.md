# Fix: studios can't see or reply to their reviews (and other dashboard pages)

## What's actually wrong

The two saved website testimonials are in the database. The dashboard shows none of them.

The cause is not the Reviews screen. Checking the database directly: **no table in the project grants access to signed-in accounts at all** — every table reports "NONE" for the signed-in and public roles. Anything the dashboard reads as the signed-in studio owner (rather than through an internal admin connection) comes back empty or errors. Reviews is simply the most visible victim, because the Reviews screen reads as the owner.

On top of that, the reviews table has no rule that lets anyone read reviews — only admins. So even with access restored, an owner still could not see their own reviews.

Two consequences on the dashboard:

- Reviews tab: always empty, so there is nothing to reply to.
- Any other screen reading as the owner (listing lookup, claims, submissions, profile/account details, FAQs, blog editing for admins) is at risk of the same silent emptiness.

## The fix

1. Restore Data API access on the tables the app uses, matched to the access rules each table already has:
   - Signed-in accounts: read/write on studios, reviews, review replies, FAQs, enquiries, claims and claim messages, submissions, profiles, roles, change requests, closure feedback.
   - Anonymous visitors: read-only where the table already has a public-read rule (published studios, FAQs, review replies, brands, services, testimonials, published blog posts), plus the write-only paths that already exist (submitting an enquiry, recording a page view, analytics, tool usage).
   - Internal/service access on all of them.
   - No anonymous access on private tables (claims, submissions, profiles, roles, closure feedback, rate limiting).
2. Add the missing read rule on reviews: anyone may read reviews of a published studio; the owning studio may read all of its own.
3. Walk every studio dashboard screen signed in as a studio owner and confirm each loads and its actions work: About & info (save), Media (upload), Certificates & files, FAQs (add/edit/delete), Leads (list, status change, export), Reviews (list, reply, Google import, website import), Metrics, Settings.

## Technical notes

- Migration: `GRANT` statements per table for `authenticated`, `anon` (only where a permissive policy exists), and `service_role`; plus `CREATE POLICY` for `SELECT` on `public.reviews` — one clause for `authenticated`/`anon` scoped to published providers, one for the owning `claimed_by` account.
- `listMyReviews` in `src/lib/owner.functions.ts` reads through `context.supabase` (RLS as the user), which is why it returns `[]` today; no code change needed once grants and the read policy exist.
- Verification: sign in as a studio owner in a headless browser against the running preview, visit each dashboard section, capture console/network errors, and confirm the two saved website reviews appear with a working reply box. Then typecheck and a production build.
