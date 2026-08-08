# Intearior: logo, full directory browsing, clean addresses, AI matching

## 1. Logo

Both uploads become CDN assets (standalone mark + mark with wordmark).

- Header: standalone mark + "Intearior" text lockup, left-aligned, ~32px mark height, links home.
- Footer: full logo-with-text version in the brand column, replacing the plain text wordmark.
- Favicon and apple-touch icon in `public/` generated from the standalone mark.
- Social preview image (og:image) uses the logo-with-text version on the home route.
- Auth/login and the 404 page get the stacked logo as their header mark.

## 2. Search page: show all studios, with pagination

Today search caps at 120 rows and renders everything at once, so the other ~1,000 studios are invisible.

- Server search returns a page of results plus a total count (page size 24).
- Search page gets `page` in the URL, numbered pagination (prev / next / page numbers), and a "1,125 studios" style result count.
- Filters and sorting reset to page 1; the URL stays shareable.

## 3. Address cleanup across all 1,125 studios

Current data is inconsistent: some rows contain "United States", office hours, or a street address glued into the city field, and city/state pairs that don't agree (e.g. a non-Texas city labelled TX).

- Run an AI-assisted normalisation pass over every stored address, producing a clean street line, city, state, and ZIP for each studio.
- Cross-check the city/state pair against the ZIP code; where they disagree, the ZIP wins and the record is corrected. Anything the AI can't resolve confidently is left with the original text rather than guessed.
- Also fix the polluted `city` values (strip street fragments, hours, "United States"), and recompute each studio's city slug so it matches the corrected city/state.
- Provider pages then render a properly formatted address block (street / city, state ZIP), with the map and "nearby studios" using the corrected values.
- Changes applied as a reviewed data update; the corrected/uncertain counts get reported back.

## 4. Cities and States browsing

Footer cities currently link to a hand-written list of 20 metros whose slugs don't match the imported data, so those pages come up empty.

- City pages resolve against the real database (any city that has at least one studio works), so no more empty pages.
- Footer "Cities" column lists the top cities by actual studio count, each linking to a populated page.
- New footer "States" column with all 50 states, plus new state pages (`/designers/<state>`) showing a state hero image, the studio count, cities in that state, and the studios themselves.
- Each state and city gets its own editorial hero image assigned deterministically, so pages look distinct.
- State and city pages are added to the sitemap.

## 5. Photography

- The "By Style" grid on the homepage keeps its current images.
- A separate set of editorial photographs is generated for city pages, state pages, service pages, and the guide, so no image on those pages repeats a homepage style image.

## 6. AI-powered Get Matched

Replace the hard-coded question sequence with a conversational AI flow.

- "I am looking for help with…" on the homepage submits straight into the AI matcher, carrying that first answer.
- The AI asks one question at a time, choosing each follow-up from what has already been said, never repeating a topic, and stopping (typically 4–7 questions) once it has enough to match.
- Answers can be tapped from suggested options or typed freely.
- When the AI is done it produces a structured brief (services, rooms, style, budget, timeline, location), which feeds the existing ranking to produce matched studios, with the consultation form pre-filled from the brief as it is today.
- If the AI is unavailable, the flow falls back to the current fixed questions so matching never breaks.

## Technical notes

- Search pagination: `searchProviders` gains `page`/`pageSize` and returns `{ providers, total }` via a ranged count query; route search schema gains `page`.
- City/state resolution moves from the static `src/lib/cities.ts` table to database-backed server functions (`getCitySummary`, `listStates`, `listCitiesInState`); `cities.ts` keeps only editorial copy for known metros as an optional overlay. New route `src/routes/_site.designers.$state.tsx`.
- Address normalisation runs as an offline batch through the Lovable AI gateway script, writing `address`, `city`, `state`, `postal_code`, `city_slug` back via SQL; ZIP-to-state validation is applied in code before writing.
- AI matching: new `src/lib/ai-match.functions.ts` server function calling Lovable AI (streaming) that returns the next question plus suggested options, and a final structured brief validated with a small schema, then handed to the existing `getMatches` scorer.
- Logo files uploaded with `lovable-assets`; favicon written as a real file in `public/`.
