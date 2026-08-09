# Remove Hiring Guide, rewrite legal pages, de-noise analytics

## 1. Remove the Hiring Guide page

- Delete the `/guide` page.
- Remove all links to it: header nav (desktop + mobile), footer "Trust" column, homepage "Read the hiring guide" button, and the sentence on provider profiles that links to it.
- Remove `/guide` from the sitemap and from `public/llms.txt`.
- Because the site is published, `/guide` will redirect permanently to `/how-it-works` instead of 404ing, so old links and any search-engine results keep working.

## 2. Terms of Service and Privacy Policy

Rewrite both pages in the same structure and tone a directory business like Sam's List uses, adapted to interior design:

Terms sections: what Intearior is (an independent directory, not a design firm and not a party to any client–studio agreement), eligibility and accounts, listing claims and studio-owner obligations (accurate info, licences/insurance, right to represent the business), review rules (first-hand experience only, no incentivised or competitor reviews, we may remove reviews), lead/consultation requests and how they are passed to studios, no professional advice and no endorsement, intellectual property and permitted use, prohibited conduct and scraping, third-party data sources, disclaimers, limitation of liability, indemnity, changes and termination, governing law, contact.

Privacy sections: who we are and what we collect (details you submit in consultation, match, claim, review and contact forms; account data; anonymous usage analytics), how we use it (matching you with studios, operating and improving the directory, fraud prevention), the key disclosure that consultation/match details are shared with the studios you select, business-listing data and its public sources, cookies and analytics with the note that we do not sell personal data, retention, security, your rights and how to request access or deletion, children, changes, contact.

Both pages carry a "Last updated" date and a plain-language note that they are not legal advice.

## 3. Analytics: one row per visitor, not one per event

Current behaviour, confirmed in the code: the Live Activity Feed reads the raw `analytics_events` table and renders one row per event. A single person browsing `/search` fires an impression event for every studio card on the page, so one visitor produces a dozen near-identical BROWSE rows, plus empty "DIRECT" rows for bare page views with no provider attached.

Changes (apply to admin and super-admin views alike):

- **Live feed becomes session-based.** Each row is one visitor session showing: time, entry method chip, city, number of pages/studios viewed, the studio they engaged with most recently, and the strongest action taken (lead > click > view). Sessions update in place on each 10s refresh rather than pushing new rows.
- **Collapse impressions.** Card impressions on a listing page no longer create a feed row each; they roll up into a "viewed N studios" count on that session's row. Only meaningful actions — search, listing click, phone/website/directions — appear as distinct steps.
- **Drop empty rows.** Sessions with no activity beyond a page view show as a single "landed on /path" row instead of a bare DIRECT chip with nothing after it.
- **Expandable detail.** Clicking a session row opens the existing journey detail view with the full ordered event list, so nothing is lost — the noise just moves out of the summary.
- The User Journeys tab already groups by session; it gets the same step-counting fix so "steps" reflects meaningful actions rather than raw impression count.

## Technical notes

- `getLiveFeed` in `src/lib/analytics.functions.ts` is rewritten to fetch recent events, group by `session_id`, and return one summarised row per session (most recent first, ~20 sessions), with an aggregated `views` count and `last_action`.
- `JourneyRow` in `src/components/analytics-dashboard.tsx` is reshaped to render the session summary, with a click handler that reuses `getJourneyDetail`.
- Step counts in `getUserJourneys` exclude `impression` events.
- Files: `src/routes/_site.guide.tsx` (deleted), `src/components/site-chrome.tsx`, `src/routes/_site.index.tsx`, `src/routes/_site.provider.$slug.tsx`, `src/routes/sitemap[.]xml.ts`, `public/llms.txt`, `src/routes/_site.terms.tsx`, `src/routes/_site.privacy.tsx`, `src/lib/analytics.functions.ts`, `src/components/analytics-dashboard.tsx`.
