# Analytics Dashboard Redesign

Refresh the admin Analytics visuals to match the reference: clean horizontal bar rankings, a journey-style live activity feed with colored chips + arrows, and searchable Cities / Providers tables. No backend changes.

## 1. New shared bar-list component

Replace Recharts vertical BarCharts and the plain `RankList` with one `HBarList` component used across Overview, Cities, and Providers:

- Row layout: bold label on top-left, secondary metrics on top-right (e.g. `19 searches · 13 clicks` or `107 clicks · 3.3% CTR`), thin colored horizontal bar underneath scaled to `value / max`.
- Rounded ends, subtle grey track background, 8-10 rows visible.
- Color prop per section (brand orange for cities, blue for providers-by-clicks, green for leads, etc.) so each card is visually distinct.
- Optional right-side "click to drill in" affordance.

Applies to:
- Overview → "Top cities by demand", "Top providers by clicks", "Top providers by leads" (new card).
- Cities tab → the 3 "Top by …" cards.
- Providers tab → the 3 "Top by …" cards.

## 2. Live Activity Feed as journeys

Rework the Overview live feed rows into single-line journeys:

`{time ago}   [ENTRY CHIP]  →  {"query" if search}  →  {City, ST}  →  {Provider}  →  [ACTION CHIP]`

- Entry chip: `SEARCH` (amber), `BROWSE` (blue), `DIRECT` (green) — derived from event type (`search` = SEARCH, `impression`/`listing_click` = BROWSE, `page_view` without query = DIRECT).
- Action chip on the right: `DIRECTIONS` / `WEBSITE` / `PHONE` (pin/link/phone icon, colored) when the event is a `lead_action`; `CLICK` for `listing_click`; `VIEW` for impression.
- Arrows `→` between segments, muted color.
- Alternating row background for scannability, hover highlight, provider name links to the provider page.
- Empty segments gracefully hidden (e.g. no query → skip that segment).
- Keeps the 10s polling and the pulsing "live" dot.

Since the current `getLiveFeed` returns individual events (not full journeys), each row still represents one event but is rendered in this journey shape using the fields it already has (`event_type`, `query`, `city_slug`, `provider`, `lead_type`). This matches the reference without touching server functions.

## 3. Search bars on Cities and Providers activity tables

- Cities tab: add a search input above the "City activity" table filtering by city name (case-insensitive substring). Show result count and a "Clear" affordance when active.
- Providers tab: same treatment on the "Provider activity" table — filter by provider name or city name.
- Debounce not needed (client-side filter over the already-loaded array). Empty-state row updates to "No cities match '<query>'".

## 4. Small polish
- Range picker chips: keep as-is (already matches the reference style).
- StatCards: tighten typography to align with the calmer look (already close; only minor spacing tweak).
- Remove the redundant vertical Recharts BarChart imports once `HBarList` replaces them.

## Technical notes

- All changes are in `src/components/analytics-dashboard.tsx` — one file.
- No API / server-function / schema changes; uses existing `getOverview`, `getLiveFeed`, `getCityAnalytics`, `getProviderAnalytics` payloads.
- New `HBarList<T>` generic component + `JourneyRow` component added inside the same file (kept together with their only consumer).
- Search state is local `useState` in each panel; filtering runs on already-fetched `data.cities` / `data.providers` arrays.
- Recharts `BarChart` usages inside Overview replaced by `HBarList`; LineChart and DonutChart stay.
- Chip colors use existing Tailwind tokens (`bg-amber-100 text-amber-700`, `bg-sky-100 text-sky-700`, `bg-emerald-100 text-emerald-700`, `bg-rose-100 text-rose-700`) so no new design tokens needed.
