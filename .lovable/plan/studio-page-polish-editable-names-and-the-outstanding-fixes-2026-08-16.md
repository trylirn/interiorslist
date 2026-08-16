# Studio page polish, editable names, and the outstanding fixes

## 1. Studio page visual pass

- Soften the meta row (Based in, In business, Founded, Serves, Team size) to the faint Sam's List treatment: small uppercase muted labels with lighter, smaller value text and muted icons, so the card reads calm rather than bold.
- Move the Reviews block to sit directly below "About this practice".
- Shrink the location map: reduce its height and place it in a compact bordered card rather than a full-width block.

## 2. Editable studio name in the dashboard

- Add a "Studio name" field to the dashboard Basics tab (required, trimmed, max length) and allow it through the owner update schema so studios and super admins can correct their name.

## 3. Pricing tier derived server-side

- In `owner.functions.ts`, map the selected typical job cost band to a price tier (budget / moderate / premium) inside the handler; a custom free-text cost leaves the tier unset. Matching keeps working without the removed dropdown.

## 4. Job cost on match and compare

- Match result cards show the typical job cost instead of the price-tier chip (falling back to nothing when unset).
- Compare view gains a "Typical job cost" row.

## 5. Blog spacing and editor

- Tighten paragraph, list and heading spacing in both the published renderer and the editor surface.
- On save, collapse runs of empty paragraphs and stray `<br>` blocks.
- Editor gains table support: insert a 3x3 table with a header row, add row, add column, delete table; the sanitizer allows table tags and the renderer styles them.
- The formatting toolbar becomes sticky so it stays reachable while scrolling a long article.

## 6. Analytics and data cleanup

- Remove the legacy "phone" lead type from analytics labels, charts, stat lines and icons.
- Clear stored studio phone numbers in the database (enquirer phone numbers on leads are untouched).

## Technical notes

- `src/routes/_site.provider.$slug.tsx`: Meta styling, section order, smaller `ProviderMap` wrapper.
- `src/components/listing-manager.tsx`: name field in Basics + payload.
- `src/lib/owner.functions.ts`: accept `name`, derive `price_tier` from `typical_project_budget` using `BUDGET_BANDS`.
- `src/components/match-result-card.tsx`, `src/routes/_site.compare.tsx`: job cost display (add the field to the compare query if missing).
- `src/components/rich-text.tsx` / `rich-text-editor.tsx`: spacing, sanitizer table tags, sticky toolbar, table commands, empty-paragraph collapse.
- `src/components/analytics-dashboard.tsx`: drop phone lead entries.
- One data update (not a schema change) nulling `providers.phone`.
