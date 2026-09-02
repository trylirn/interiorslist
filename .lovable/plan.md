# Plan: Settings in studio dashboards + remove article scraping

## 1. Settings lives in studio dashboards only (not admin)

- **`src/components/listing-manager.tsx`** (the per-studio dashboard used by owners at `/dashboard/listing/$placeId` and by super admins at `/admin/provider/$placeId`):
  - Add a `Settings` item to `LISTING_NAV` (Settings icon from lucide).
  - Render `<AccountSettings email={email} canClose={!isSuperAdmin} />` for the new tab, fetching the signed-in email via `supabase.auth.getSession()` and roles via the existing `getMyRoles` query (same pattern used elsewhere).
- **`src/routes/_site.admin.tsx`** — remove Settings from the admin dashboard:
  - Delete the `{ key: "settings", ... }` entry from `ADMIN_NAV`, the `{active === "settings" && <AccountSettings … />}` block, the `AccountSettings` import, and the `Settings` icon import.
- **`src/routes/_site.dashboard.tsx`** — unchanged (the studio home dashboard keeps its Settings tab, both branches already wired).

## 2. Delete "Scrape studio articles" entirely

- Delete `src/lib/articles.functions.ts` and `src/routes/_site.admin.articles.tsx` (route tree regenerates automatically).
- **`src/routes/_site.admin.tsx`**: remove the `extraNav` "Scrape studio articles →" link to `/admin/articles` (and the now-unused `Link` import if nothing else uses it).
- **`src/routes/_site.provider.$slug.tsx`**: remove the scraped-articles rendering block (~lines 481–490).
- **`src/lib/providers.functions.ts`**: drop `articles` from the provider select column list (line 17). Verify no other code reads `provider.articles`.
- Leave the `articles` DB column in place (unused, harmless). Leave blog-analytics "articles" wording in `analytics-dashboard.tsx` — that's unrelated blog stats.

## 3. Verify

- `bunx tsgo --noEmit` and `bun run build` — both must pass.
- Sanity-check preview: studio dashboard shows Settings; admin sidebar no longer shows Settings or the scrape link.
