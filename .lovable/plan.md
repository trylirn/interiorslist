# Dashboard sidebars, mobile polish, and a real Leads inbox

## 1. Sign out from the dashboards

Today the only sign-out button sits in the top-right of the main studio dashboard, and it disappears once you open a listing's manage page or the admin console. Sign out becomes a permanent item at the bottom of the new sidebar on every dashboard screen (studio, listing editor, admin), plus an "Sign out" entry in the mobile header menu when signed in.

Signing out cancels in-flight requests, clears cached dashboard data, ends the session, and returns to the home page.

## 2. Sidebar navigation

Both dashboards move from a row of tabs to a proper sidebar layout.

Studio sidebar: Overview, My Listings, Leads, Reviews, Claims, Settings (close account), then Sign out.
Admin sidebar: Analytics, Overview, Claims, Submissions, Listings, Team, Blog, My dashboard, Articles, then Sign out.

- Collapsible to an icon-only rail on desktop, with the trigger always visible.
- On phones it becomes a slide-over drawer opened from a button in the dashboard header.
- The active section is highlighted; the selected section is kept in the URL so links and refreshes land in the right place.

## 3. Mobile optimisation

- Dashboard headers stack instead of colliding; long emails truncate.
- Admin tables (listings, claims, submissions, team) become stacked cards on phones, with the table returning at tablet width and up — no horizontal overflow.
- Full-width action buttons and selects on small screens; pagination controls wrap.
- Leads, claims and review cards reflow to a single column with the status control below the name rather than squeezed beside it.

## 4. Better Leads tab

Reworked as a lead inbox:

- **Filters:** status (New / Contacted / Closed / All), which listing the lead came to, source (studio page vs Get Matched), and a date range (7 / 30 / 90 days / all).
- **Search** across name, email, phone and message text.
- **Counters** at the top: total, new, contacted, closed, and leads in the last 7 days.
- **Cards** show the structured brief in a clean labelled grid — location, project type, rooms/focus, budget, style, timeline — with the client message below, plus one-tap Email and Call links.
- **Categorisation:** the status control stays, and each lead gets a small badge row (source, project type, budget band) so a studio can scan the list quickly.
- **Export CSV** of the currently filtered leads.
- Sorted newest first, "Load more" beyond the first 50.

Also fixing correctness: leads are scoped to the studios the signed-in account actually owns (currently the query relies on row-level rules alone and passes no owner filter), so a studio only ever sees its own enquiries, and admins see all.

## Technical notes

- New `src/components/dashboard-shell.tsx` wrapping the shadcn `Sidebar` primitives (`SidebarProvider`, `Sidebar`, `SidebarMenu`, `SidebarTrigger`) with a `collapsible="icon"` rail and a footer sign-out item; used by `src/routes/_site.dashboard.tsx`, `src/routes/_site.dashboard.listing.$placeId.tsx` and `src/routes/_site.admin.tsx`. Section state via a validated `?tab=` search param.
- Sign-out helper: `queryClient.cancelQueries()` → `queryClient.clear()` → `supabase.auth.signOut()` → navigate to `/` with `replace: true`.
- `listMyLeads` in `src/lib/owner.functions.ts`: resolve the caller's owned `place_id`s and add `.in("provider_place_id", …)` (skipped for admins), return `provider_place_id` name mapping, and keep the existing structured columns. Filtering/search/export stay client-side over the returned rows; source is derived from whether the lead carries the match-flow fields.
- Admin table responsiveness handled with the existing pattern: `hidden md:table` plus a `md:hidden` card list.
- Verify with `bunx tsgo --noEmit` and a production build.
