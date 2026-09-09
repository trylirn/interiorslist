# Free tools + an indexed content hub around them

Yes — understood. The tools are the feature; the SEO value comes from a
structured, hand-picked network of indexable pages built around them. The tools
themselves never generate indexable URLs: every tool result stays in the
visitor's browser, and the tool pages carry a `noindex` on any result state.
What gets indexed is a fixed set of pages we choose, informed by how people
actually use the tools.

## The three tools

**1. Room Planner (`/tools/room-planner`)** — 2D only.
Draw a room to scale by entering width and length (feet or metres), then drag
walls to adjust. Drop in doors and windows along walls, and place furniture from
a library of correctly-scaled pieces (sofas, beds, tables, islands, wardrobes,
rugs). Rotate, resize, snap-to-wall, grid, undo/redo, and a live square-footage
readout. Export as an image. Works with touch on phones and tablets.

**2. Budget Estimator (`/tools/budget-estimator`)** — room type, square footage,
scope of work (refresh / furnishing only / remodel / gut renovation), style, and
location. Returns a low–typical–high range with a breakdown (design fee,
furniture, materials, labour) and a plain explanation of what drives the number.
Ranges are derived from the "typical project budget" figures your listed studios
already publish, aggregated by project type and region, with a clearly-worded
note that these are directory-derived estimates, not quotes. Where too few
studios report a figure for a combination, we widen to the national average and
say so.

**3. Colour Palette Generator (`/tools/color-palette`)** — for studio owners.
An interactive colour wheel with harmony modes (complementary, analogous, triad,
split-complementary, monochrome), lock-and-shuffle, per-swatch shade ladders,
contrast/accessibility check, paint-name matching to common ranges, image
upload to pull a palette from a room photo, and export as image or hex list.

All three save to the browser only — no sign-in, no account. Each tool ends with
a contextual call to action: "Get matched with 3 studios" (homeowner tools) and
"Claim your studio profile" (palette tool).

## The indexed page network

A hub at `/cost-estimator` (the money-intent hub) with the estimator embedded at
the top and real content beneath. Layers:

**Intent pages** — a fixed, curated set, e.g.
`/cost-estimator/interior-designer-cost`,
`/cost-estimator/kitchen-design-cost`,
`/cost-estimator/how-much-does-an-interior-designer-charge`,
`/cost-estimator/interior-designer-hourly-rate-vs-flat-fee`,
`/cost-estimator/e-design-cost`.

**State pages** — `/cost-estimator/texas`, `/cost-estimator/california`, etc.,
combining state-level cost context with the studios you already list there.

**City pages** — only for cities that already have enough listed studios to make
the page substantive; these link to the existing `/designers/{state}/{city}`
pages rather than duplicating them.

**Studio-level pages** — `/provider/{slug}/pricing`, showing that studio's
published typical project budget, fee structure, service area and services, with
the estimator inline. Only generated for studios that publish enough detail;
thin ones are skipped, not stubbed.

**Comparison / list pages** — e.g. "Interior designers under $10k",
"Studios offering flat-fee packages", "Cheapest e-design services",
built from real listing data so each page has something no one else has.

A parallel, much smaller hub at `/tools` links all three tools plus the
`/color-palette` supporting pages (colour theory basics, palettes by style,
palettes by room) which target designer-side search.

## Tool usage informs what we build next

Every tool submission logs an anonymous, non-identifying record: room type,
scope, state, style, budget band. The admin dashboard gets a "Tool demand" view
that ranks the combinations people actually use and flags ones with no page yet
— e.g. "412 estimates: kitchen remodel, Texas, transitional → no page exists".
You then decide which of those become permanent pages. No page is ever
auto-generated.

## Build order

1. Tools infrastructure, `/tools` hub, and the three tools.
2. Cost data aggregation from listing data, plus the estimator's numbers.
3. `/cost-estimator` hub, intent pages, and state pages.
4. Studio pricing pages and comparison/list pages.
5. Anonymous usage logging plus the admin "Tool demand" view.

## Technical notes

- New routes under `src/routes/_site.tools.*` and `src/routes/_site.cost-estimator.*`,
  following the existing `_site` layout and per-route `head()` metadata pattern
  (unique title, description, og tags, canonical).
- Room planner: SVG-based 2D canvas, no third-party editor dependency; state in
  a Zustand store mirroring `src/stores/compare-store.ts`, persisted to
  `localStorage`.
- Palette tool: `culori` for colour maths and harmony generation; palette-from-
  image via canvas pixel sampling client-side.
- Cost ranges: a server function aggregating `providers.typical_project_budget`,
  `price_tier`, `service_area` and `state`, cached and exposed through the
  route loader with `ensureQueryData` / `useSuspenseQuery`. Falls back to
  national aggregates when a segment has fewer than a threshold of studios.
- Usage logging: a new `tool_usage` table (tool, room type, scope, state, style,
  budget band, timestamp) written via the existing `/api/public/*` pattern with
  the same bot/preview filtering as `api.public.track.ts`; no visitor identifiers
  and no free-text stored. Admin-only read.
- Tool result states render `<meta name="robots" content="noindex">`; hub and
  content pages are indexable and added to `sitemap-pages.xml` (plus a new
  `sitemap-tools.xml` for the cost-estimator network).
- Cross-linking: tools hub in the footer, estimator linked from `/search`,
  `/match`, city and service pages; each cost page links to matching studios.

## Content honesty

Every cost figure is labelled as a directory-derived estimate with the sample
size behind it, not a quote. Nothing is invented — where the listing data is too
thin to support a page, that page is not built.
