# Finish the rebrand: Intearior

## 1. Rename to "Intearior"

Replace every "Interiors List" / "InteriorsList" / "interiorslist" occurrence across the site: header logo, footer, page titles and meta descriptions, About, Terms, Privacy, Guide, Contact, Welcome, Claim, Login, Submit, For Business, llms.txt, and all route `head()` blocks (34 files currently reference the old name).

## 2. Fresh business data (1,136 firms)

Wipe the existing 1,019 listings and re-import from the new sheet so each record carries the exact row values:

- Name, website, full address (from Location), city, state
- About the Business → the profile "About" text
- Primary Category → main service tag; Secondary Categories → additional service tags
- Slug and city slug generated from name + city/state, de-duplicated so no two firms collide
- Rows with unusable location data are reported rather than guessed at

Category → service mapping is table-driven (e.g. "Kitchen & Bath" → kitchen design + bathroom design, "Residential", "Commercial", "Renovation / Remodeling", "Staging", "E-design"), and the raw category text is kept on the listing so nothing from the sheet is lost.

## 3. Lead capture wiring

- Provider profile: consultation form in the sidebar (sticky on desktop) plus a full-width brief block lower on the page, prefilled with the studio name.
- Match results: after the shortlist, a single brief form prefilled with the quiz answers (rooms, style, budget, timeline) that can be sent to a chosen studio.

## 4. Rewritten Get Matched quiz (adaptive)

- Remove the "Preferences" step entirely.
- Make the flow branching: the next question depends on earlier answers, and nothing is asked twice.
  - Commercial project → asks space type (office, retail, hospitality, clinic) and skips home-room questions.
  - Furniture/styling only or virtual e-design → skips construction, contractor-management and permit questions.
  - Full-home or kitchen/bath → asks about scope of construction, existing plans, and whether they need the build managed.
  - Room selection is filtered to what the chosen project scope can contain.
- Steps become dynamic ("Step 3 of 6" adapts to the branch) rather than a fixed 8.
- Matching logic updated to score against the new answer shape (scope, style, budget tier, timeline, location, remote work).

## 5. Style imagery

Five styles currently reuse another style's photo (transitional, maximalist, scandinavian, eclectic all borrow, and the rotation repeats). Generate dedicated photography for transitional, maximalist, scandinavian, eclectic, and contemporary-luxury so every style in "Find a studio that matches your taste" has its own correct image, and re-check each existing image matches its style label.

## 6. Imagery beyond the homepage

Add editorial photography to:
- Style pages and service pages (banner header per page)
- City / "best in city" pages (header band)
- Guide, How it works, About, For business (section imagery)
- Match intro and results header
- Provider cards without their own photo already use a rotation; widen it with the new images so repeats are rarer

## 7. Remaining static pages

Finish interior-design copy and Intearior branding on About, Terms, Privacy, How it works, For business, Submit, and `public/llms.txt`, plus admin / super-admin / owner dashboard copy (labels, empty states, help text).

## Technical notes

- Import runs as a data change against `providers` (delete existing rows, bulk insert parsed rows) after a Python parse of the workbook; reviews/FAQs referencing old listings are cleared first to satisfy foreign keys.
- Quiz branching lives in a step-graph in `src/routes/_site.match.tsx` with scoring in `src/lib/match.functions.ts`.
- New images are generated then uploaded as CDN asset pointers and mapped in `src/lib/style-images.ts`.
- Verification: full typecheck plus a browser pass over home, a style page, a city page, a provider profile, and the quiz.
