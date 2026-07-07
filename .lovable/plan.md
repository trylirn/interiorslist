# Analytics Dashboard Plan

## 1. Event tracking foundation

**New tables** (single migration, RLS: admin-only SELECT, public INSERT with size caps):

- `analytics_sessions` — `id (uuid)`, `visitor_id (uuid)`, `started_at`, `last_seen_at`, `entry_path`, `referrer`, `user_agent`, `is_mobile`, `city_slug` (first city viewed, nullable).
- `analytics_events` — `id`, `session_id`, `visitor_id`, `event_type` (enum: `page_view`, `search`, `impression`, `listing_click`, `lead_action`), `lead_type` (enum: `phone`, `website`, `directions`, null), `provider_place_id` (nullable, FK), `city_slug` (nullable), `query` (nullable, capped 120), `path`, `created_at`, `metadata jsonb`.
- Indexes: `(created_at desc)`, `(event_type, created_at)`, `(provider_place_id, event_type)`, `(city_slug, event_type)`, `(session_id, created_at)`, `(visitor_id, created_at)`.

**Client tracker** (`src/lib/analytics.ts`):
- `visitor_id` persisted in localStorage (uuid).
- `session_id` in sessionStorage, rotates after 30 min inactivity (checked on send).
- Batched fire-and-forget POSTs via a server route `src/routes/api/public/track.ts` (rate-limited by IP + size validation; inserts through service role after validation).
- Helpers: `trackPageView()`, `trackSearch(query, city?)`, `trackImpression(placeIds[])` (deduped per session), `trackListingClick(placeId)`, `trackLeadAction(placeId, type)`.

**Instrumentation points**:
- `__root.tsx` — page_view on route change + session heartbeat.
- `_site.search.tsx` — `trackSearch` on submit; `trackImpression` for visible cards.
- `_site.tx.$city.tsx`, `_site.best.$city.tsx`, `_site.treatment.$slug.tsx`, `_site.concern.$slug.tsx`, `_site.index.tsx` featured, `related-providers`, `nearby-providers` — `trackImpression`.
- `provider-card.tsx` — `trackListingClick` on card click.
- `_site.provider.$slug.tsx` — `trackLeadAction` on phone/website/directions clicks (wrap existing anchors).

## 2. Server functions (`src/lib/analytics.functions.ts`, admin-gated)

All accept `{ range: 'today'|'yesterday'|'7d'|'30d'|'this_month'|'last_month'|'custom', from?, to? }`.

- `getOverview` — totals: searches, impressions, listing_clicks, lead_actions (total + unique_visitors), click_rate (clicks/impressions), mobile share; top 10 cities by (searches+clicks); top 10 providers by clicks; discovery breakdown (search vs browse vs direct — from session entry_path & referrer); lead_actions breakdown (phone/website/directions); daily timeseries.
- `getLiveFeed` — last 50 events joined with provider name + city, newest first.
- `getCityAnalytics` — per city: impressions, searches, clicks, lead_actions, unique visitors; used by both list + drill-down.
- `getCityDetail(citySlug)` — city timeseries, top providers in city, top searched terms, lead_actions breakdown.
- `getProviderAnalytics` — top providers by lead_actions, top by impressions, activity table (impressions, clicks, CTR, lead_actions per provider).
- `getProviderDetail(placeId)` — provider timeseries + lead_actions breakdown + recent visitors.
- `getUserJourneys({ entry: 'all'|'search'|'browse', page })` — paged list of sessions with step count, journey duration, winner (last provider clicked / lead_action), entry method, city, timestamp.
- `getJourneyDetail(sessionId)` — ordered event timeline for one session (Session in Columbus, OH view).

## 3. Dashboard UI (`src/routes/_site.admin.tsx` — add 4 tabs alongside existing tabs)

Shared header: time-range chip group (Today, Yesterday, 7 Days, 30 Days, This Month, Last Month, Custom w/ date-range popover) + Refresh button. Poll every 10s on Overview live feed only.

- **Overview tab**
  - 6 stat cards: Searches, Impressions, Listing Clicks, Lead Actions (with unique-people subline), Click Rate %, Mobile %.
  - Row: Top Cities by demand (bar), Top Providers by clicks (bar).
  - Row: Discovery breakdown (donut: search / browse / direct), Lead actions breakdown (donut: phone / website / directions).
  - Live Action Feed (polling 10s) — list rows: "[time ago] visitor in {city} — searched X / clicked Y / called Z".

- **Cities tab**
  - Cards: Top cities by impressions, by searches, by lead actions.
  - City activity table — rows: city name, impressions, searches, clicks, CTR, lead_actions; click row → `/admin?tab=cities&city=<slug>` drill-in panel with timeseries + top providers + top queries.

- **Providers tab**
  - Cards: Top providers by lead actions, by impressions.
  - Providers activity table — name, city, impressions, clicks, CTR, lead_actions; click row → drill-in panel.

- **Journeys tab** (User Journey Explorer)
  - Header: entry method chips (All / Search / Browse).
  - 4×N grid of journey cards (matches screenshot 1): entry-badge, city, winner, action-type chip (directions/website/phone), timestamp, duration.
  - Click card → session timeline view (matches screenshot 2): ordered steps with icons (browsed/saw N listings/clicked provider/lead action) and timestamps. Back button returns to grid. Pagination (Prev/Next).

Charts via `recharts` (already in deps). No new libs beyond that.

## 4. Also fix (quiet)

The current preview shows a `Symbol(TSS_SERVER_FUNCTION_FACTORY)` SSR error — will confirm root cause by reading runtime errors during build, then patch (likely a route calling a server fn incorrectly during SSR). Not tied to this feature.

## Out of scope

- No changes to public site design.
- No email/notifications on events.
- No PII stored; visitor_id is a random uuid.
- No IP geolocation — city inferred from the pages the visitor viewed.
