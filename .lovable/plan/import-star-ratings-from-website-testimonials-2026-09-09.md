# Import star ratings from website testimonials

## How it works today

- Google import: brings in the reviewer's name, the text, and the star rating, and refreshes the studio's overall score and review count.
- Website import: brings in only the reviewer's name and the text. Star ratings on the studio's own site are ignored, so those reviews show with no score.

## What to add

Read a star rating for each testimonial pulled from a studio's website, using the common ways sites express it:

- Structured review markup on the page (the rating value publishers embed for search engines).
- Accessibility labels and title text such as "5 out of 5 stars", "Rated 4.5".
- Plain text patterns like "5/5" or "4.5 stars" inside the testimonial block.
- Counting filled star icons/images in the testimonial block when nothing else is present.

Ratings are clamped to 1–5, halves rounded to one decimal, and anything unreadable stays blank rather than guessed.

In the import preview, each testimonial shows its detected rating with a small selector so the studio owner can correct it or set one where none was found, then it saves with the review. After saving, the studio's overall score and review count recalculate from all its reviews the same way Google-imported ones do.

Reviews without a rating are still imported and simply show as a quote with no score.

## Technical notes

- `src/lib/website-reviews.functions.ts`: extend `extractCandidates` to return `rating?: number` per candidate (JSON-LD/microdata `ratingValue`, `aria-label`/`title` regex, `x/5` and "N stars" text, filled-star element count); widen `saveWebsiteReviews` input to accept `rating: number | null` and write it to `reviews.rating`; after the upsert loop, recompute and patch `providers.rating` / `review_count` from the studio's stored reviews.
- `src/components/listing-manager.tsx`: show and allow editing the detected rating per candidate in the import preview and pass it through on save.
- Verify against the previously tested page (`https://27diamonds.com/testimonials/`) plus one page with structured review markup, then typecheck and build.
