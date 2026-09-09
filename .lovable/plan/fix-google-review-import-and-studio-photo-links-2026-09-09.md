# Fix Google review import and studio photo links

## 1. Google review import

Two confirmed causes:

- The import code looks for a Google key under a name that doesn't exist in this project, so it always stops with "Google reviews are not configured for this site yet." The connected Google key is stored under a different name. (The address-lookup helper has the same wrong name and silently does nothing too.)
- Studio IDs in the directory are our own internal IDs (for example `il_d3b97e2e32e8b2fc38f2`), not Google's place IDs. Even with the key fixed, Google would answer "no such place".

What I'll do:

- Point both the review import and the address lookup at the Google key that is actually connected.
- Before importing, look the studio up on Google by its name and address, and remember the Google ID on the studio record so later imports are instant and stable.
- If Google can't find a match, show a clear message ("We couldn't find this studio on Google — check the business name and address") rather than a generic error.
- Keep the existing behaviour: up to 5 reviews (Google's own limit), re-running updates instead of duplicating, star rating and total review count refreshed.

## 2. Clicking a photo shows a backend URL

Studio photos are stored in the backend and the page links straight to that storage address, so clicking one navigates away to a long non-Intearior URL.

What I'll do:

- Clicking a photo opens a full-screen viewer on the studio page itself, with next/previous arrows and a close button — no navigation away, no foreign address in the bar.
- Serve photos through an Intearior address (`intearior.com/photo/...`) instead of the raw storage link, so the address shown anywhere is always ours. Existing photos keep working; no re-upload needed.

## Technical notes

- `src/lib/reviews-import.functions.ts` and `src/lib/geocode.functions.ts`: read `GOOGLE_MAPS_API_KEY` (fallback to `GOOGLE_MAPS_SERVER_KEY`) for the `X-Connection-Api-Key` header on the connector gateway.
- Migration: add `providers.google_place_id text` + index. Import flow: if null, call Places `findplacefromtext` with `name, address`, persist the result, then call `place/details`.
- New server route `src/routes/photo.$.tsx` (or `/api/public/photo`) that streams a `provider-photos` object via the admin storage client with cache headers; a small `photoUrl()` helper rewrites stored signed URLs to that path at render time.
- New lightbox component used by the gallery grid in `src/routes/_site.provider.$slug.tsx`.
- Finish with typecheck and production build.
