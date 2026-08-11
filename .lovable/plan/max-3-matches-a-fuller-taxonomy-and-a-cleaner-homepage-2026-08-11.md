# Max 3 matches, a fuller taxonomy, and a cleaner homepage

## 1. Matching returns at most 3 studios

The match results screen currently returns up to 5 studios. It will return the top 3 (fewer only if the filters genuinely leave fewer). Everything else about the flow stays the same: results stay blurred until name, email and phone are entered, then the user picks which of the studios receive the brief.

## 2. Expand services, design styles and project types

The current lists are 18 services, 12 styles, 6 project types. They get extended with the common categories that are missing today:

Services to add: primary suite design, kids and nursery design, kitchen and bath remodel consulting, closet and storage design, media and home theatre, basement finishing, ADU and small-space design, art curation and framing, textile and soft furnishing design, cabinetry and joinery specification, flooring and tile selection, wallpaper and wall treatments, sustainable and eco design, aging-in-place and accessible design, feng shui and wellness design, model home and multi-family design, restaurant and bar design, healthcare and wellness interiors, vacation and short-term rental styling, procurement and project purchasing, 3D rendering and visualisation, move-in and unpacking services.

Design styles to add: contemporary, bohemian, art deco, rustic and mountain lodge, mediterranean, French country, Japandi, Shaker, Hollywood Regency, Southwestern, English country, organic modern, Victorian and historic restoration, tropical, grandmillennial, biophilic, warm minimalism, urban loft.

Project types to add: kitchen-only remodel, bathroom-only remodel, addition or extension, outdoor and landscape-adjacent, staging for sale, office relocation or fit-out, historic restoration, second home or vacation property, multi-unit or developer package, e-design only (remote).

These lists feed the studio dashboard checkboxes, the search filters, the match questions and the studio profile chips, so all of those surfaces pick the new options up automatically. Existing studio data is untouched — the new options are simply available for selection.

Style landing pages (`/style/<slug>`) exist for every style. New styles reuse the existing image mapping with a sensible fallback so no page is broken or blank; a short intro line is written for each new style.

## 3. Remove "I am looking for help with…" from the homepage

That whole search-and-suggestions block goes away from the homepage. The Get Matched entry points elsewhere on the page (hero and nav) stay, so nothing about the matching journey is lost.

## Technical notes

- `src/lib/match.functions.ts`: `.slice(0, 5)` becomes `.slice(0, 3)`; check `src/lib/match-ai.functions.ts` for a matching cap and any "3–5" copy in `src/routes/_site.match.tsx`.
- `src/lib/cities.ts`: extend `SERVICES`, `STYLES` (slug/label/intro), `PROJECT_TYPES` (slug/label/desc). Slugs are additive only, never renamed.
- `src/lib/match.functions.ts`: add entries to `STYLE_SERVICES` and `ROOM_SERVICES` maps for the new styles so scoring accounts for them.
- `src/lib/style-images.ts`: map new style slugs to the closest existing image; `styleImage()` already falls back to modern.
- `src/routes/_site.index.tsx`: drop the `<LookingForHero />` usage and delete `src/components/looking-for-hero.tsx`.
- No database or schema changes.
