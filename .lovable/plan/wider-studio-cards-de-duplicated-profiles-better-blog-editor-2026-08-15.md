# Wider studio cards, de-duplicated profiles, better blog editor, and pricing cleanup

## 1. Studio page layout

- Widen the profile page container so the main card uses the full comfortable width (from `max-w-6xl` to `max-w-7xl` with tighter side padding), and rebalance the two-column grid so the info card gets more room and the enquiry rail stays a fixed-width sticky column — matching the Sam's List proportions where content runs close to the left edge.
- Loosen the meta grid so labels like "Serves" and "Typical job cost" no longer wrap onto two lines.

## 2. Remove duplication on studio pages

"About this practice" currently repeats what the top card already shows. It will keep only what is unique:

- Removed from it: Founded, Years in business, Team size, Serves stat tiles (already in the top card).
- Kept: service-area note, Pricing & packages, "Who we serve", "Not a good fit if…". If nothing unique remains, the whole section disappears.

## 3. Blog spacing

- Tighten paragraph, heading, and list spacing in both the published article renderer and the editor surface so consecutive paragraphs sit closer together, and collapse empty `<p>`/`<br>` runs produced by the editor when saving.

## 4. Blog editor improvements

- Add a table button: inserts a 3x3 table with a header row, plus controls to add a row / add a column / delete the table while the cursor is inside one. Tables are allowed through the sanitizer (`table`, `thead`, `tbody`, `tr`, `th`, `td`) and styled cleanly on published posts.
- Make the toolbar sticky at the top of the editor while scrolling a long article, so formatting buttons are always reachable.

## 5. Outstanding fixes

- Drop the `hero_photo_url` share-image line from the studio page's structured data.
- Remove the cover-photo upload block from the dashboard Media tab and stop sending `hero_photo_url` on save.
- Dashboard pricing: delete the "Pricing tier" dropdown; "Typical job cost" becomes a range dropdown plus a "Custom…" option with a free-text field. The matching tier is derived server-side from the chosen band.
- Match result cards and the compare view show the typical job cost instead of the price tier.
- Remove the legacy "phone" lead type from analytics labels, charts, and stat lines.
- Clear stored studio phone numbers in the database (client phone numbers on leads are untouched).

## Technical notes

- `src/routes/_site.provider.$slug.tsx`: container width, grid ratio, JSON-LD image line, trimmed `PracticeDetails` stats.
- `src/components/listing-manager.tsx`: remove cover-photo block + payload key, replace pricing selects.
- `src/lib/owner.functions.ts`: drop `hero_photo_url` and `price_tier` from the update schema; derive `price_tier` from `typical_project_budget` via `BUDGET_BANDS` inside the handler (custom text leaves the tier null).
- `src/components/rich-text-editor.tsx`: sticky toolbar (`sticky top-0 z-10`), table insert/row/column commands via `document.execCommand("insertHTML")` and DOM helpers.
- `src/components/rich-text.tsx`: allow table tags in `sanitizeHtml`, add table styling, tighten `[&_p]:mt-5` → smaller margins.
- `src/components/match-result-card.tsx`, `src/routes/_site.compare.tsx`: swap tier chip for job cost.
- `src/components/analytics-dashboard.tsx`: remove phone lead entries.
- One data update (not a schema change) to null out `providers.phone`.
