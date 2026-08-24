# Finish the agreed plan: blog editor, About page, build pass

## 1. Blog editor table controls

Add "Delete row" and "Delete column" buttons beside the existing table controls in the editor toolbar. Both act on the cell the cursor sits in; removing the last row or column removes the whole table.

## 2. Blog images: captions, alt text, links

- Insert images as a figure with an optional caption beneath instead of a bare image.
- Insert flow: upload or paste a URL, then alt text, then optional caption.
- Clicking an inserted image opens a small floating toolbar to edit alt text, edit or remove the caption, add or remove a link on the image, and delete the image.
- Link button fix: with text selected, link the selection; with nothing selected, insert the URL as a labelled link instead of doing nothing.
- Allow `figure` and `figcaption` through the article sanitizer, with matching caption styling on the public post page so it renders exactly as in the editor.

## 3. New editorial About page

Rewrite `/about` as a full editorial page for Intearior, grounded only in what the site actually does:

- Hero: headline, positioning paragraph, studio image.
- "What Intearior is" — an independent nationwide directory of interior design studios, no paid placement.
- "How we build the directory" — how listings are gathered, verified as operating, kept current, and how studios claim and complete profiles.
- "What you can do here" — browse by city and state, filter by service, style and budget, get matched to up to 3 studios, compare studios, read and write reviews, request consultations.
- "Services covered" and "Cities we cover" blocks linking into the hubs.
- "For design studios" — claim your listing, respond to reviews, manage leads.
- Independence statement plus the existing verify-credentials disclaimer.
- Closing CTAs: Find a designer, Get matched, Claim your studio.
- Live directory counts from the existing stats function (no hardcoded numbers), fresh title/description/OG metadata, and Organization + FAQ JSON-LD.

## 4. Final pass

Run typecheck and a production build over everything from the last sessions, fix whatever surfaces, then mark the San Francisco SEO finding as fixed.

## Technical notes

- `src/components/rich-text-editor.tsx`: `deleteRow`/`deleteColumn` off `currentCell()`; figure/figcaption insertion replacing `insertImage`; a selected-image toolbar; link handler branch for empty selection.
- `src/components/rich-text.tsx`: add `figure`/`figcaption` to `ALLOWED` and add `[&_figure]`/`[&_figcaption]` prose styles.
- `src/routes/_site.about.tsx`: rewrite using `getDirectoryStats` from `src/lib/providers.functions.ts`, `SERVICES`/`CITIES` from `src/lib/cities.ts`, imagery from `src/lib/style-images.ts`.
- Verify with `bunx tsgo --noEmit` and `bun run build`, then `seo_chat--update_findings`.
