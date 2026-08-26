# Premium-first ordering for Get Matched results

Matched studios are currently ranked purely by how well they fit the brief. Change the ranking so paid (featured) studios come first, then verified studios, then everyone else — while still only ever showing studios that actually fit the brief.

## How the new ordering works

Studios are still scored against the lead's answers exactly as today. Before picking the top 3, they are grouped into three tiers:

1. **Featured (paid)** studios that meet the brief
2. **Verified** studios that meet the brief
3. **All other** studios that meet the brief

Fill the 3 result slots from tier 1 first; if fewer than 3 featured studios fit, top up from tier 2, then tier 3. Within each tier, studios stay ordered by match score, so the best fit in that tier is shown first.

"Meets the brief" means the studio scored above a minimum relevance bar (it matched at least one requested service, style, or project type). A featured studio that matches nothing about the brief is not promoted — it simply falls out, so leads never get an irrelevant paid listing.

If nothing clears the relevance bar (very narrow briefs), the current behaviour stays: show the best-scoring studios available, still tier-ordered.

The match percentage shown on each card keeps reflecting fit only, so a promoted featured studio does not display an inflated score.

## Technical notes

- `src/lib/match.functions.ts`: add `featured` to the `providers` select. After scoring, compute `qualifies = matchedServices.length > 0 || matchedStyles.length > 0 || !!matchedProjectType`. Sort with a comparator: tier rank (`featured ? 0 : is_verified ? 1 : 2`) first, then `score` descending; partition by `qualifies` so qualifying studios always precede non-qualifying ones. Then `slice(0, 3)`.
- Existing preference filters (`verified-only`, `remote-ok`) still apply before tiering.
- `matchPercent` calculation is unchanged (relative to the top score among the returned set).
- No schema, UI, or copy changes — `providers.featured` already exists and is admin-controlled.
