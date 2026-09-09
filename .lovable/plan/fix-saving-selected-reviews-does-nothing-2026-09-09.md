# Fix: saving selected reviews does nothing

## What's happening

Picking testimonials and pressing "Save selected" never stores them. The reviews table is currently empty — no imported review, from a website or from Google, has ever been saved.

The cause is in how saving is written to the database. The save uses an "insert or update if already imported" operation that relies on a uniqueness rule covering studio + source + original review ID. The uniqueness rule that exists in the database is a *conditional* one (it only applies when an original review ID is present), and the database refuses to match a conditional rule to this kind of write. Every save attempt fails with a database error, which the screen reports as a generic "Could not save reviews" message. The same failure affects the Google review import, which uses identical save code.

## The fix

1. Replace the conditional uniqueness rule on the reviews table with an unconditional one on studio + source + original review ID. Reviews without an original ID (people writing a review on the site) stay unaffected, since blank values are still treated as distinct.
2. Re-run the save flow after the change so both the website import and the Google import succeed.
3. Improve the failure message so a real database problem surfaces its reason instead of a generic sentence, and so a failed save keeps the selected testimonials on screen rather than clearing them.

## Technical detail

- `reviews_external_unique` is `CREATE UNIQUE INDEX ... (provider_place_id, source, external_id) WHERE external_id IS NOT NULL`. PostgREST's `on_conflict=provider_place_id,source,external_id` cannot infer a partial index, so Postgres raises 42P10 and `fail(error)` throws.
- Migration: drop `reviews_external_unique`, recreate it without the `WHERE` predicate. No grant/RLS change needed.
- `src/lib/website-reviews.functions.ts` (`saveWebsiteReviews`) and `src/lib/reviews-import.functions.ts` keep their existing `upsert(..., { onConflict: "provider_place_id,source,external_id" })` calls, which then resolve correctly.
- `src/components/listing-manager.tsx` `WebsiteImport.save()`: surface `error.message` in the toast and only clear `candidates`/`picked`/`ratings` on success.
- Verify with a typecheck, a production build, and a live import against a testimonials page, confirming rows land in `reviews` and the studio's rating/review count refresh.
