# Hide websites and maps, tidy studio-page cards, paginate admin listings, finish phone cleanup

## 1. Hide studio websites from the public site

The website link stays fully editable and visible in the studio dashboard, but disappears everywhere a visitor can see it:

- Studio profile: the "Website" button, the "Visit website" button in the unclaimed sidebar, and any website entry in the social links row.
- Search/result/compare cards that surface a website link.
- The structured-data `sameAs` line that publishes the website URL to search engines.
- The website field is also dropped from the public studio data feed so it is not readable from the page source.

## 2. Remove the map

The Location map section is removed from the studio page (component deleted along with the Google Maps loader usage there). The plain-text address stays on the page.

## 3. Bottom-of-page cards (more studios / related reading)

Both rows currently stretch to 4 and 3 very wide cards. They become squarer, denser rows:

- "You may also be interested in": up to 8 studios in a 2/3/4-column grid with tighter cards.
- "Related reading": up to 6 posts in a 2/3-column grid with square-ish (1:1-ish) cover images.

## 4. What the Featured toggle does

Short answer: today it does nothing user-visible. It sets `providers.featured` in the database, but the homepage "featured studios" row is chosen by verified status, rating and review count — it never reads that column.

Proposal (included in this plan): make the toggle real, so studios you flip to Featured are pinned to the top of the homepage studio row, ahead of the rating-based ordering. A short helper line is added above the admin table explaining this.

## 5. Paginate the admin listings page

- 100 rows per page with Previous / Next controls and a "Showing 1–100 of 1,125" line.
- Paging happens server-side (the listing query takes page/pageSize instead of pulling every row), so the page stays fast.
- Changing the search box or the status filter resets to page 1.

## 6. Blog editor: sticky toolbar, scrolling body

The editor body becomes its own scroll area with a fixed max height (about 60% of the viewport), so the toolbar stays pinned at the top of the editor card while you scroll through a long article instead of scrolling with the whole page.

## 7. Outstanding fixes

- Remove the legacy "phone" lead type from the analytics dashboard: the Phone slice in the lead-mix chart, the PHONE activity badge, the "calls" figures in the stat cards, and the phone entries in the lead colour/emoji/verb helpers.
- Clear stored studio phone numbers in the database (`providers.phone` set to null). Client phone numbers on leads and enquiries are untouched.

## Technical notes

- `src/routes/_site.provider.$slug.tsx`: drop website buttons, `sameAs` website entry, `ProviderMap` usage; `UnclaimedSidebar` loses its website prop.
- `src/lib/providers.functions.ts`: remove `website` from the public column list (`PROVIDER_COLS`); order featured first in `getFeaturedProviders`.
- Delete `src/components/provider-map.tsx`; remove website chips from `provider-card.tsx`, `match-result-card.tsx`, `_site.compare.tsx` if present.
- `src/components/related-providers.tsx` / `related-posts.tsx`: limit bumps and squarer grids.
- `src/lib/admin.functions.ts`: `listAllProviders` gains `page`/`pageSize`, returns a single `.range()` page plus exact count.
- `src/routes/_site.admin.tsx`: pagination state/controls, Featured helper text.
- `src/components/rich-text-editor.tsx`: `max-h-[60vh] overflow-y-auto` on the editable body.
- `src/components/analytics-dashboard.tsx`: strip all `phone` lead-type branches.
- One data update (not a schema change) nulls `providers.phone`.
