## Diagnosis

- **`/admin/articles` empty**: two overlapping issues.
  1. Currently `0 / 161` providers have any articles scraped, so provider pages have nothing to render in the "Latest from…" section.
  2. The page depends on `getMyRoles().isAdmin`. If the signed-in account isn't the admin, the list stays empty with no explanation. DB has 1 admin + 1 user; if you signed in with the non-admin account you'll see "Forbidden".
- **Slow / missing maps**: only `6 / 161` providers have `latitude/longitude`. `ProviderMap` falls back to "Map location pending" for the other 155. `geocodeProviderIfNeeded` exists but is never called anywhere, so nothing populates coords. The map that does load is fine — it's the empty-coords case that looks broken.
- **ToS / Privacy**: current pages are short generic stubs — missing HIPAA carve-out, no-medical-relationship, arbitration, class-action waiver, CCPA/GDPR sections, retention, cookies, minors, DMCA, etc.
- **Match lead form + HIPAA risk**: `/match` currently collects name/email/phone + "concerns" ("acne scars", "hair loss") and forwards them to providers via `sendContactMessage`. That's exactly the surface you want to avoid — remove the intake + forwarding path entirely, show ranked providers with profile links only.

## Changes

### 1. Match flow — remove lead intake (HIPAA safety)
- Rewrite `src/routes/_site.match.tsx` to a short, non-PHI quiz (priority + city only; drop "concerns", budget, timing, first/last name, email, phone, "interested / not a fit", consult phase, and the `sendContactMessage` calls). After submit, render the ranked results as a plain grid of `ProviderCard`s linking to each `/provider/$slug`. No forwarding, no stored responses.
- Delete `src/lib/match.functions.ts`'s dependence on any PHI fields; keep it a simple city + treatment ranker returning public provider columns.
- Update `/for-business` and homepage copy that references "get matched → we send your info" to "browse matches".

### 2. Maps — backfill and self-heal
- Add `geocodeAllProvidersMissing` admin-only server fn (loops missing coords, throttled) in `src/lib/geocode.functions.ts`.
- Add a "Geocode missing coordinates (155)" button to `/admin` next to the existing admin panels.
- In `getProviderBySlug` (server-side), if the provider has an address but no coords, fire-and-forget geocode via the connector and return the fresh lat/lng. This warms new listings without an admin round-trip.
- No client-side change to `ProviderMap`; the existing loader is already idempotent and lazy.

### 3. `/admin/articles` — clearer state + scrape flow
- Show explicit banners: "Not signed in" / "Signed in as X — not an admin" / "0 providers have scraped articles yet — click Scrape all".
- Include per-row status (has_articles count, last scrape time) and hide the giant list until `providers.length > 0`.
- Add "Scrape only missing" button in addition to "Scrape all", so re-runs skip providers that already have ≥1 article.
- No change to the RLS model; `articles` is stored on `providers` and reads through the existing public SELECT policy.

### 4. Provider profile "Articles from this Med Spa" section
- Only render when `articles.length > 0` (already the case). Add a subtle "Sourced from {domain}" line under the header to make it clear these are outbound links to the med spa's own site.

### 5. Legal pages — comprehensive rewrite

Rewrite `src/routes/_site.terms.tsx` with these sections:
- Acceptance & eligibility (18+, Texas focus, capacity)
- Nature of service — informational directory only, **no doctor-patient relationship**, no medical advice, no referral, no endorsement
- **HIPAA notice** — we are not a Covered Entity or Business Associate; do not submit PHI through forms; if you do, you release it
- Account terms, acceptable use, prohibited scraping/republishing
- User content & reviews (license grant, moderation, defamation rules)
- Provider listings, claims, and accuracy disclaimers
- Third-party links, off-site bookings, off-platform communications disclaimer
- Intellectual property (site content © Texas Aesthetics; trademarks of others)
- DMCA takedown procedure + designated agent placeholder
- Disclaimers of warranties (AS IS, no fitness, no availability)
- Limitation of liability (cap at $100 or fees paid; exclusion of indirect/consequential)
- Indemnification by user
- Governing law — Texas; venue in [County], TX
- **Binding arbitration + class action waiver** (AAA rules, 30-day opt-out)
- Termination, changes to terms, severability, entire agreement, assignment
- Contact + notice address

Rewrite `src/routes/_site.privacy.tsx`:
- What we collect (account, submissions, cookies, analytics, IP/UA logs)
- What we do NOT collect / do not want (**no PHI, no diagnosis, no treatment records**)
- Sources for business listings (public info + owner submissions)
- Legal bases (contract, legitimate interest, consent)
- Sharing (subprocessors: hosting, database, auth, email, analytics — generic categories)
- Cookies & tracking (essential vs analytics; how to opt out)
- Data retention timelines
- Security measures (encryption in transit, access controls)
- Children (no under-13, no under-18 without parent)
- Your rights — **CCPA/CPRA** (right to know/delete/correct/opt-out of sale, non-discrimination), **GDPR** (access/rectify/erase/portability/object, DPO contact), **Texas TDPSA**
- Do Not Track / GPC signal
- Data breach notification commitment
- International transfers
- Changes to policy
- Contact + privacy request address

Both pages get a persistent "This is a template — have counsel review before relying on it" note at the top (small, italic, so it's honest and not scary).

### 6. Small copy sweeps
- Any homepage / for-business / how-it-works blurb that says "we contact providers for you" or "we send your goals to providers" changes to "browse verified providers and reach out directly".
- Header/footer nav unchanged.

## Technical notes

- Match rewrite drops fields from `Answers` and removes `sendContactMessage` import; the server fn stays in place for the direct contact form on provider pages (which is opt-in and per-provider).
- Batch geocoder throttles at ~5 requests/sec and stops on 3 consecutive gateway errors. Reads `LOVABLE_API_KEY` + `GOOGLE_MAPS_API_KEY` inside the handler.
- Auto-geocode inside `getProviderBySlug` is best-effort; if the connector errors, the map falls back to "Get directions" as today.
- No new tables, no new RLS, no schema migrations.
- Legal pages are static routes — no data fetching, no server functions.
