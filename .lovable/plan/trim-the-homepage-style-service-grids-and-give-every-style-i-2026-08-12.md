# Trim the homepage style/service grids, and give every style its own photo

## 1. Homepage shows a curated selection, not everything

Right now the homepage prints all 30 styles and all 40 services as cards, which makes those two sections enormous.

- **By Style**: show 6 styles only — Modern, Mid-Century, Traditional, Farmhouse, Coastal, Minimalist — keeping the existing magazine grid (first card wide). The "Browse every studio" link stays, plus a clear "See all 30 styles" link.
- **By Service**: show 12 services only (the most-searched ones: full-home, kitchen, bathroom, living & dining, bedroom, home office, outdoor & patio, commercial & office, home staging, e-design, space planning, renovation management). The existing "See all 40 services" link stays and points to search.

Nothing is removed from the taxonomy — every style and service still has its own page and is reachable from search and the footer.

## 2. Accurate photography for every design style

18 of the 30 styles currently reuse another style's photo (art deco shows the luxury shot, japandi shows minimalist, tropical shows coastal, and so on), so several style pages look identical.

A dedicated editorial interior photo is generated for each of these 18 styles, each unmistakably reading as that style:

contemporary, bohemian, art deco, rustic / mountain lodge, mediterranean, French country, Japandi, Shaker, Hollywood Regency, Southwestern, English country, organic modern, Victorian / historic, tropical, grandmillennial, biophilic, warm minimalism, urban loft.

Each image is reviewed against its label before wiring in — if a render doesn't clearly read as the style, it gets regenerated. The 12 existing style photos stay as they are.

These photos flow through automatically to the style landing pages, the homepage grid, card fallbacks and service banners.

## Technical notes

- `src/routes/_site.index.tsx`: slice STYLES and SERVICES for the two homepage sections; add a "see all styles" link.
- New images generated at ~1024x768, uploaded via `lovable-assets`, pointers added under `src/assets/`.
- `src/lib/style-images.ts`: replace the 18 aliased entries in `STYLE_IMAGES` with the new imports; `styleImage()` fallback unchanged.
- No database or route changes.
