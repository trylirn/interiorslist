# Blog "find a studio" block, more related posts, and studio hours + address

## 1. "Find a studio near you" under every blog post

Add a two-part block at the end of each article, styled like the reference:

- A bordered card titled "Find Interior Designers Near You" with a one-line subtitle and a 3-column grid of the top cities (city, ST) linking to their city directory pages.
- Below it, a tinted banner with a search icon, "Find studios near you" heading, a short line, and a "Search studios" button linking to the directory search.

It reuses the existing city data already powering the location browser, so the links are always real pages. This replaces the current generic "Ready to find your designer?" box at the bottom of the article.

## 2. Six related posts instead of three

Related posts under an article go from 3 to 6, laid out in a responsive grid (2 columns on mobile, 3 on desktop) so six cards stay compact.

## 3. Business hours in the studio dashboard

New "Business hours" section in the dashboard's About & info tab: one row per weekday with a "Closed" toggle and open/close time inputs. Saved to the existing hours field and shown publicly on the studio profile as a compact hours list, with today's hours highlighted.

## 4. Editable address in the dashboard

Studios can edit their street address, city, state and postal code from the dashboard. City and state changes keep the city directory grouping in sync so the studio still appears under the right location page.

## Technical notes

- `src/components/blog-location-cta.tsx` (new): city grid card + search banner, fed by `listCities` from `providers.functions`; rendered at the bottom of `src/routes/_site.blog.$slug.tsx`.
- `src/lib/blog.functions.ts`: `getBlogPost` related slice 3 -> 6.
- `src/components/listing-manager.tsx`: hours editor (weekday rows persisted into `hours` jsonb as `{ mon: { open, close, closed } ... }`) and address fields.
- `src/lib/owner.functions.ts`: extend the update schema with `hours`, `address`, `city`, `state`, `postal_code`; derive `city_slug` from city+state server-side so directory pages stay correct.
- `src/routes/_site.provider.$slug.tsx`: render the hours block (address already displays).
- No schema migration needed — `hours`, `address`, `city`, `state`, `postal_code` columns already exist.
