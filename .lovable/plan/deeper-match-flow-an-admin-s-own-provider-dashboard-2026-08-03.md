# Deeper match flow + an admin's own provider dashboard

## 1. More questions in the match flow

`/match` currently asks 2 questions (treatment category, city). Expand to a 5-step flow so results are more accurate:

1. What are you looking for? (existing treatment categories)
2. What's your main concern? (multi-select: wrinkles, lip volume, jawline, acne scars, pigmentation, hair loss, glow, body contouring) — already supported by the scoring engine but never asked
3. Where in Texas? (existing city grid)
4. Budget comfort (under $300 / $300–800 / $800–2,000 / $2,000+ / not sure)
5. Preferences (multi-select: verified providers only, medical director on staff, evening/weekend hours, newer to treatments — friendly guidance)

Progress bar and Back button already adapt to step count. Results header summarises the answers ("Botox · wrinkles · Austin · $300–800"), with a "Refine your search" link back into the wizard.

Scoring gets the extra signals: concerns feed existing keyword/service matching, budget nudges providers whose price range fits, and preferences boost verified/badged listings. No personal or health data is stored — nothing is written to the database, matching the HIPAA-safe browse-only approach.

## 2. Admin gets their own provider dashboard (not a per-provider one)

Remove the per-provider admin view:

- Delete the "Open" action column from the Providers table in `/admin`
- Remove the `/admin/provider/$placeId` route

Replace it with a single **"My dashboard"** entry in the admin console that opens the full provider dashboard experience for a private demo listing owned by the admin account:

- A hidden, unpublished sample listing ("Texas Aesthetics — Demo Med Spa") not visible in search, city pages, sitemap, or match results
- Opens the exact provider UI: listing editor, About & business details, photos/videos/files/certificates, FAQs, leads, reviews, metrics
- Editing it changes nothing on the live directory, so it's safe to explore
- A small "Demo listing — not public" note in the header, plus a "Reset demo data" button

## Technical notes

- `src/routes/_site.match.tsx`: extend to 5 steps, keep local state only, pass `concerns`, `budget`, `preferences` to `getMatches`.
- `src/lib/match.functions.ts`: `matchInput` gains `preferences: string[]`; scoring adds budget fit (via `price_ranges`/`price_level`) and preference boosts on `is_verified` / `badges`.
- `src/routes/_site.admin.tsx`: drop the Open column; add a "My dashboard" tab/button linking to `/admin/demo`.
- New route `src/routes/_site.admin.demo.tsx` renders the existing `ListingManager` against the demo listing, `noindex`, admin-guarded.
- Migration/seed: one `providers` row with `published=false`, `place_id='demo-admin-listing'`, `claimed_by` set to the admin user; all public provider queries already filter `published`, and the sitemap/search/match queries get an explicit exclusion of this place_id.
- Delete `src/routes/_site.admin.provider.$placeId.tsx`; the admin-aware branches in `owner.functions.ts` / `brand-extra.functions.ts` stay (harmless and needed for the admin-owned demo row).

## 3. Admin analytics rebuilt on shadcn/ui + Recharts

The analytics dashboard mixes hand-rolled divs (custom `HBarList` bars, plain cards, custom range buttons) with Recharts. Standardise it:

- All panels use shadcn `Card`/`CardHeader`/`CardContent`, `Tabs`, `Table`, `Badge`, `Select`, `Input`, and `Skeleton` for loading states — no ad-hoc div cards.
- All charts use Recharts wrapped in the shadcn `ChartContainer`/`ChartTooltip`/`ChartLegend` pattern with a shared chart config, so colors come from design tokens rather than hardcoded hex.
- Replace `HBarList` with a Recharts horizontal `BarChart` (vertical layout) keeping the same info: label, value, and sub-metrics.
- Time series stays an `AreaChart`, discovery mix stays a donut `PieChart`, both moved onto `ChartContainer`.
- Range picker becomes a shadcn `Select`/`ToggleGroup`; city and provider tables become shadcn `Table` with the existing search inputs.
- Same data, same metrics — presentation layer only.

Technical note: adds `src/components/ui/chart.tsx` (shadcn chart primitives) if not present, and rewrites `src/components/analytics-dashboard.tsx` around it.
