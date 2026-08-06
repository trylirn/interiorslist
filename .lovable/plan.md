# Interiors List — rebrand from medspa directory to interior designer directory

Turn the entire product into **Interiors List**, a nationwide directory of interior design studios. Same architecture (directory, match quiz, claim/review flows, dashboards, admin), completely new domain content.

## 1. Database

- Clear provider-side data: providers, reviews, brands, services, testimonials, provider_faqs, claims, submissions, favorites, provider_views, contact_messages, provider_update_requests, analytics events. (All are already empty, so this is mostly a safety wipe.)
- Repurpose existing columns instead of renaming: `services` now holds design service slugs, `specialists` holds lead designer names, `credentials` holds NCIDQ / ASID / state registration, `skin_types` → retired, `recovery_tags` → retired (left unused, hidden in UI).
- Add columns needed for design firms: `styles` (text[]), `project_types` (text[]), `price_tier` (text), `typical_project_budget` (text), `remote_services` (boolean).
- Cities go nationwide: providers keep `city_slug` + `state`, and city pages are keyed on state + city.
- Seed ~20 demo design studios across major metros (New York, Los Angeles, Chicago, Houston, Dallas, Austin, Miami, Atlanta, Seattle, Denver, Phoenix, Boston) with realistic services, styles, budgets, ratings, and a few reviews and testimonials.

## 2. Taxonomy (new content model)

- **Services**: full-home design, kitchen design, bathroom design, living/dining, bedroom, home office, outdoor/patio, commercial/office, retail/hospitality, staging, e-design/virtual, space planning, custom millwork, lighting design, window treatments, furniture sourcing, color consultation, renovation management.
- **Styles**: modern, mid-century, traditional, transitional, farmhouse, industrial, coastal, minimalist, maximalist, Scandinavian, eclectic, contemporary luxury.
- **Project types**: new build, full renovation, single room refresh, furnishing only, commercial fit-out, vacation/short-term rental.
- Replaces the botox/filler/concern taxonomy in `src/lib/cities.ts`, `src/lib/match.functions.ts`, and `src/lib/treatment-content.ts` (becomes `service-content.ts`: what it covers, what's included, typical cost, timeline, how to choose, FAQs).

## 3. Routing (nationwide)

- `/designers/$state/$city` replaces `/tx/$city`; `/best/$state/$city` replaces `/best/$city`. Old `/tx/*` paths redirect.
- `/treatment/$slug` → `/service/$slug`; `/concern/$slug` → `/style/$slug`. Old paths redirect.
- `/safety` and `/credentials` merge into a single `/guide` — "How to hire an interior designer" (scoping the project, contracts and deposits, fee models: flat fee vs hourly vs cost-plus, what NCIDQ/ASID/state registration mean, red flags, questions to ask). Old URLs redirect to `/guide`.
- Sitemap, `robots.txt`, and `public/llms.txt` regenerated for the new URL set.

## 4. Lead capture form

A short enquiry form (first name, last name, email, phone, message) — same fields as today, relabelled for design projects — appears:

- On every designer profile page (`/provider/$slug`) as a prominent "Request a consultation" card.
- At the end of the Get Matched flow, so a visitor can send one enquiry to the studios they matched with.

Submissions land in `contact_messages` and stay visible in the owner dashboard and admin inbox (labels updated to "Enquiries").

## 5. Get Matched quiz (expanded)

Grows from 5 steps to 8, all restyled for interior design:

1. Project type — new build, full renovation, single room, furnishing only, commercial, rental
2. Rooms / scope — kitchen, bath, living, primary bedroom, whole home, office, outdoor (multi-select)
3. Style preference — multi-select from the style list, plus "help me decide"
4. Budget range — under $10k, $10–25k, $25–75k, $75–150k, $150k+, not sure
5. Timeline — ready now, 1–3 months, 3–6 months, just researching
6. Property details — square footage band, own/rent, occupied during work
7. Working preferences — in-person only, open to virtual/e-design, full-service turnkey, designer manages contractors, needs furniture procurement
8. Location — state + city (or nationwide/virtual)

Scoring in `match.functions.ts` weights service overlap, style overlap, project-type fit, budget tier match, virtual availability, verification, rating, and review volume. Results show a match percentage, why-it-matched chips, and the enquiry form.

## 6. Site content

Rewrite every page's copy, headings, and SEO metadata for Interiors List: home, search ("Find a Designer"), city pages, service pages, style pages, compare, favorites, about, contact, how-it-works, for-business, submit, claim, review, welcome, login, 404. Header nav becomes Find a Designer / Cities / Services / Styles / Guide / For Designers. Footer links, tagline, and legal blurb updated.

**Terms** — remove medical disclaimers; add directory-listing terms, no-guarantee-of-work-quality language, review policy, and a note that Interiors List is not a party to any design contract.
**Privacy** — updated for enquiry-form data, analytics, and third-party listing sources.

## 7. Dashboards

- **Owner/provider dashboard**: listing manager fields become studio name, lead designer, credentials (NCIDQ/ASID/state), services offered, styles, project types, budget tier, service radius / virtual availability, portfolio gallery, project photos, team, FAQs. Enquiries inbox and review responses relabelled.
- **Admin**: providers table, claim review, submissions, and update requests relabelled to studios/designers; filters use the new service and style taxonomy.
- **Super admin**: role management unchanged apart from wording.

## 8. Branding

- Name everywhere: **Interiors List**. Titles, OG tags, structured data, emails, `llms.txt`.
- Visual direction: warm, editorial interiors palette (deep clay/terracotta accent, warm off-white surfaces, charcoal text) replacing the current medspa brand token, with a serif display face for headings. Applied through design tokens in `src/styles.css` so the whole UI shifts at once.

## Technical notes

- One migration: wipe rows, add the new provider columns, then seed demo studios with literal INSERTs in the same migration.
- Route renames touch `src/routeTree.gen.ts` indirectly (regenerated) — old paths get thin redirect routes so no link 404s.
- `treatment-content.ts` → `service-content.ts`, `CONCERN_TREATMENTS` → `STYLE_SERVICES`; all imports updated.
- After the changes: typecheck, then a Playwright pass over home, search, a city page, a designer page, the full match flow, and the dashboards to confirm no runtime errors.
