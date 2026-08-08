# Homepage hero card: real numbers + rotating studio preview

## What's wrong today

The card next to the hero shows hardcoded figures: "12 Cities" and "18 Services" come from static lists in the code, and "100% Vetted" is a claim with nothing behind it. The live directory actually holds **1,125 studios across 656 cities and all 50 states**, so the card undersells the site badly.

## What to build

Keep the card in place (it's the main entry point to Get Matched) and make it earn its space.

**1. Real stats, pulled from the database**

Replace the three tiles with live counts:

- `1,125` Studios
- `656` Cities
- `50` States

These are read at page load from the same data the search page uses, so they stay correct as listings are added. Numbers get thousands separators. "100% Vetted" is removed.

**2. A live studio preview that rotates**

Below the Get matched button, add a compact rotating strip showing one real studio at a time — name, city/state, and its top two style or service tags — cycling every ~4 seconds with a soft cross-fade. It pulls from the featured/verified studios already loaded for the homepage, and each card links to that studio's profile.

Why this over a full swipeable carousel: the card is a conversion panel, not a browsing surface. A quiet auto-rotating proof strip shows the directory is real and populated without competing with the "Get matched" button or adding drag/swipe interaction people have to discover. Rotation pauses on hover and respects reduced-motion preferences (falls back to a static studio).

Resulting card:

```text
Not sure who's right for your project?
Answer a few questions about your space, style and budget…

        [  Get matched →  ]

  1,125        656          50
 STUDIOS     CITIES       STATES

 ──────────────────────────────
  Anita Perlut Interiors
  Ashburn, VA · Full Home Design
 ──────────────────────────────
```

## Technical notes

- Add a `getDirectoryStats` server function in `src/lib/providers.functions.ts` returning `{ studios, cities, states }`, counting over all published rows via the existing `fetchAllPublished` helper (avoids the 1000-row cap that caused the earlier state-count mismatch).
- Wire it into `src/routes/_site.index.tsx` through `queryOptions` + `ensureQueryData` in the loader, alongside the existing `featuredOpts` / `statsOpts`.
- Extract the hero panel into `src/components/hero-match-card.tsx` to keep the route file manageable; rotation via `setInterval` in a `useEffect`, cleared on unmount, paused on hover, and skipped when `prefers-reduced-motion` is set.
- Drop `CITIES.length` / `SERVICES.length` usage in the card only; other sections keep their current sources.
