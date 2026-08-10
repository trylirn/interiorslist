# Location index tightening, review placement, card logos, remove favorites

## 1. Browse-by-location block (Find a Designer)

- Drop the repeated "Interior" prefix — links show just the name ("Designers in Alabama", "Designers in New York City").
- Smaller text (xs), tighter row and column gaps, more columns on wide screens so the whole index reads as one compact block.
- Headings and section labels scale down to match.

## 2. Studio pages

- Move the Reviews section so it sits directly below the About section, ahead of practice details, map, services, notes and FAQ.

## 3. Studio cards

- Show the studio's uploaded logo on each card (small rounded logo next to the studio name); cards without a logo keep the current text-only header.

## 4. Remove favorites everywhere

- Remove the heart button from studio cards.
- Remove the Favorites page and every link to it in the header, footer and dashboard.
- Remove the favorites entry in the dashboard/account area.

Note: the saved-favorites data in the database stays untouched (no data loss); only the feature's UI and its client code are removed.

## Technical notes

- `src/components/browse-by-location.tsx`: strip prefix, `text-xs`, `gap-x-6 gap-y-1.5`, `xl:grid-cols-6`, smaller headings.
- `src/routes/_site.provider.$slug.tsx`: relocate the existing Reviews `<section>` to immediately after the About block.
- `src/components/provider-card.tsx`: add optional `logo_url` to props and render it; remove `FavoriteButton`. `logo_url` is already returned by the provider list select in `src/lib/providers.functions.ts`.
- Delete `src/components/favorite-button.tsx` and `src/routes/_site.favorites.tsx`; remove `listFavorites`/`toggleFavorite` from `src/lib/user-actions.functions.ts` and favorites links in `src/components/site-chrome.tsx` and `src/routes/_site.dashboard.tsx`. Leave the privacy-policy mention adjusted only if it names favorites as a feature.