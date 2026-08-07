# Finish the Interiors List rebrand + import 1,151 real design firms

Three parts: finish the outstanding rebrand work, sweep out every remaining medspa reference, and replace the 20 demo studios with the real businesses from the uploaded sheet.

## 1. Import the real businesses

The sheet has 1,151 firms with name, website, location text, an "About" blurb, primary category and secondary categories.

- Parse each Location string into street address (when present), city, state and ZIP. Both formats appear ("Westminster CA 92683", "Asheville, North Carolina 28803"); handle full state names and two-letter codes, strip noise like "PostalAddress" and "Contact". Records that still can't be resolved to a city/state are skipped rather than guessed.
- Map the sheet's categories onto the site taxonomy already in place: Primary/Secondary Category → `services` (residential, commercial, hospitality, kitchen & bath, staging, e-design/virtual, renovation management, lighting, custom millwork, retail, workplace, healthcare, colour consultation) and `price_tier` (luxury/high-end → premium). "E-Design / Virtual" sets `remote_services`.
- Fields written per firm: name, unique slug, website, address, city, city_slug, state, postal code, `about_description` from the About blurb, services, price tier, remote services, `published`, `business_status`.
- No ratings, reviews or photos are invented — those stay empty until real ones arrive. Cards and profiles must look right without a rating.
- Delete the 20 seeded demo studios and their testimonials in the same migration.

City pages become data-driven: instead of the hardcoded 12-metro list, cities are derived from the imported firms (top metros surfaced on the home page and in the city dropdown, all cities reachable via `/designers/$state/$city`). Sitemap and `llms.txt` regenerate from the real city set.

## 2. Outstanding rebrand work

- **Lead form on every designer profile** — "Request a consultation" card (first name, last name, email, phone, message) posting into the existing enquiries table.
- **Lead form at the end of Get Matched** — send one enquiry to the matched studios.
- **Dashboards**: owner/provider listing manager, admin tables, claim review, submissions and update requests, super-admin role screens — all copy, labels, filters and dropdowns moved to studios/designers, services, styles, project types, budget tier.
- **Static pages rewritten**: about, terms (directory-listing terms, review policy, not a party to any design contract, medical disclaimers removed), privacy (enquiry-form data, analytics, listing sources), how-it-works, for-business, submit, contact, `llms.txt`.

## 3. Medspa sweep

Every file still carrying medspa language gets fixed, including the ones you spotted:

- Sign in / sign up (`login`), welcome/onboarding
- Claim profile (index + per-studio)
- Find a Designer search page — the "Treatment" dropdown becomes **Service**, with a second **Style** filter; placeholder text becomes "Studio, designer, city, or service…"
- Review wizard and review pages (rating criteria reworded: communication, design results, project management, value)
- Compare page and compare drawer, nearby/related studios, quiz prompt, provider cards
- Service and style detail pages, favourites, root metadata and structured data
- Old medspa seed JSON files and the one-off seed import route removed

## Technical notes

- One migration: delete demo rows, then insert the parsed firms as literal INSERTs. Import script runs locally to generate the SQL; nothing is seeded at page load.
- `services` and `styles` taxonomies stay as defined in `src/lib/cities.ts`; the sheet's categories map onto them, and unmatched categories are added to the service list.
- `CITIES` becomes a derived list (server fn + cached query) rather than a hardcoded constant, since coverage is now nationwide across hundreds of cities.
- Fix the current SSR Suspense error surfacing on `/search` as part of the pass.
- Finish with a typecheck and a Playwright sweep over home, search, a city page, a studio profile, the full match flow, claim, review, and the owner/admin dashboards.
