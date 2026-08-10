# Browse-by-location block on Find a Designer

Add a directory-style location index at the bottom of the Find a Designer page (`/search`), matching the reference layout: a heading, a short subline, then two separate sections — **BY STATE** and **BY CITY** — each rendered as a multi-column list of plain text links.

## What the user sees

```text
Browse interior designers by location
Find interior designers in your state or city.

BY STATE
Interior designers in Alabama    Interior designers in Alaska    ...

BY CITY
Interior designers in New York City   Interior designers in Los Angeles  ...
```

- 5 columns on desktop, 2 on tablet, 1 on mobile.
- Quiet, understated link styling (muted text, hover to brand colour), small uppercase section labels — same visual rhythm as the reference.
- State links go to the existing state page; city links go to the existing city page.
- Cities shown: the top ~60 cities by number of studios, so the block stays useful without being endless.

## Technical notes

- New component `src/components/browse-by-location.tsx`, rendered at the bottom of `src/routes/_site.search.tsx` below the results/pagination.
- Data from the existing server functions in `src/lib/providers.functions.ts`: `listStates` (state + count) and a city list (reuse `listCities`, sorted by count, capped). Loaded via TanStack Query so the block hydrates without blocking the results grid.
- Links use existing routes `/designers/$state` and `/designers/$state/$city` with the current slug helpers — no new routes, no data or schema changes.
- Counts are omitted from the labels to keep the exact reference look.
