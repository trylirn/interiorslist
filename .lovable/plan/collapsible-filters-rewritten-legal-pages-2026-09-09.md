# Collapsible filters + rewritten legal pages

## 1. Filters collapse behind a button on Find a Studio

Today the five dropdowns (State, City, Service, Style, Sort by) always sit under the search bar and take up a lot of room.

Change: directly below the search bar, show a single outlined "Filters" button with the sliders icon from the reference image. Tapping it expands the same five dropdowns in place; tapping again hides them.

Details:
- The button shows a count badge when filters are active (e.g. "Filters 2") so nothing feels hidden.
- If someone arrives with filters already applied in the link, the panel starts open.
- The "X studios match your filters" line and the "Reset filters" button stay visible at all times, outside the collapsed area.
- Same behaviour on phone and desktop; the dropdowns keep their current layout when open.

## 2. Privacy Policy rewritten in the Sam's List structure

Replace the current page with the same section order, adapted to an interior design directory:

Who we are; your rights over your data; what we collect (contact details, professional/profile data, payment data for studios buying premium placement, transaction records, lead and quiz data, marketing preferences, usage analytics); how we use it; retention schedule (reviews, leads, studio accounts, payment records for 7 years, marketing opt-in records, analytics up to 26 months, correspondence); third-party services with a Do Not Track note; aggregated data; how we protect data; children's privacy; Google API services note; links to other sites; California CCPA rights with the categories list; European GDPR section; changes; contact.

The third-party list names the services this site actually uses: our hosting and database platform, Stripe for payments, Google Maps and Google Places for studio location and review data, our transactional email provider, and OpenAI for the Get Matched question flow.

## 3. Terms of Service rewritten in the Sam's List structure

Same section order, adapted:

Overview (Intearior is a directory of independent interior design studios; we do not provide design services and are not party to any agreement between a homeowner and a studio); studio review process and user responsibility to do their own due diligence, including checking licences, insurance and references; studio responsibilities (accurate profile, updated within 7 days, valid licences); a section replacing the investment-adviser one with contractor/designer licensing and advertising obligations that vary by state; compensation disclosure explaining the free listing vs. premium placement in Get Matched results, that paid placement is disclosed to users, and that no studio can pay to alter or remove reviews; user content and licence grant; intellectual property; prohibited uses including scraping; account security; DMCA; disclaimers; limitation of liability; indemnification; no endorsements or guarantees; third-party services and links; termination and modifications; dispute resolution with arbitration and class-action waiver; general provisions (force majeure, no agency, electronic communications, US-only, entire agreement, severability, waiver, survival, assignment); contact.

Placeholders used because these weren't provided: company name "Intearior LLC", contact email "contact@intearior.com", Delaware governing law, arbitration in New York, NY. Tell me the real ones and I'll swap them in.

Both pages keep a "Last updated" date and the existing page styling.

## Technical notes

- `src/routes/_site.search.tsx`: wrap the filter grid in local `showFilters` state, defaulting to open when any of `state/city/service/style` is set; new trigger button uses `SlidersHorizontal` from lucide-react with an active-filter count.
- `src/routes/_site.privacy.tsx` and `src/routes/_site.terms.tsx`: full content rewrite using the existing `Section` helper and head metadata; no new components or data.
