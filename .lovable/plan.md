# Remaining fixes: service pages, blog editor, About page, build pass

## 1. Delete column (and row) in blog tables

The toolbar can insert a table, add a row, add a column and delete the whole table, but there is no way to remove a single column or row. Add two buttons next to the existing table controls: "Delete column" and "Delete row", both acting on the cell the cursor is in. Deleting the last remaining column or row removes the table.

## 2. Unique content for all 41 /service/... pages

Only 7 services have their own copy today; the other 34 render one generic template with the name swapped in, which reads as duplicate content to search engines.

Write genuinely distinct content for every service: what it covers, what you get, what to watch for, how the process runs, realistic cost ranges, who it suits, and 3 service-specific FAQs each. Every page's intro, headings and FAQ schema will then be unique.

## 3. Blog editor images: captions, alt text and links

- Insert images as a figure with an optional caption line beneath.
- Prompt flow on insert: upload or URL, then alt text, then optional caption.
- Clicking an inserted image opens a small toolbar to edit alt text, edit or remove the caption, add or remove a link on the image, and delete it.
- Link button fix: with text selected, link the text; with nothing selected, insert the URL as a labelled link instead of doing nothing.
- Allow `figure` and `figcaption` through the article sanitizer, with matching styling on the public post page so captions render the same as in the editor.

## 4. New editorial About page

Rewrite `/about` as a full editorial page in the spirit of the medspa.com about page, written for Intearior and grounded only in what the site actually does:

- Hero: headline, positioning paragraph, studio image.
- "What Intearior is" — an independent nationwide directory of interior design studios, no paid placement.
- "How we build the directory" — how listings are gathered, verified as operating, kept current, and how studios claim and complete profiles.
- "What you can do here" — browse by city and state, filter by service, style and budget, get matched to up to 3 studios, compare studios, read and write client reviews, request consultations.
- "Services covered" and "Cities we cover" blocks linking into the hubs.
- "For design studios" — claim your listing, respond to reviews, manage leads.
- Independence / how we make money statement, plus the existing verify-credentials disclaimer.
- Closing CTAs: Find a designer, Get matched, Claim your studio.
- Fresh title/description/OG metadata and Organization + FAQ JSON-LD. Live directory counts reuse the existing stats function rather than hardcoded numbers.

## 5. Final pass

Run typecheck and a production build over everything from the last two sessions, fix whatever surfaces, then mark the San Francisco SEO finding as fixed.

## On payments: Paddle vs Stripe

Short answer for your situation (Nigeria-registered seller, US market, lead-gen model): Lovable's built-in payments can't be set up for this project — built-in Stripe isn't available for Nigeria, and the project isn't eligible for Paddle. So this would be a manual integration either way, and it is out of scope for this plan.

Guidance: Paddle is a merchant of record built for SaaS and digital products; directories and lead-gen marketplaces are usually a poor fit and often rejected, matching what you heard. Stripe is the normal choice for a lead-gen directory, but Stripe does not currently support Nigeria-registered businesses — sellers in that position typically incorporate a US or UK entity (Stripe Atlas or similar) and run Stripe under that entity. That is a business/legal step, not a code step. Once you have an entity and a Stripe account, I can wire subscriptions or per-lead billing into the studio dashboard.

## Technical notes

- Editor: `src/components/rich-text-editor.tsx` — `deleteColumn`/`deleteRow` helpers off `currentCell()`; figure/figcaption insertion and a selected-image toolbar. Sanitizer allow-list and prose styles in `src/components/rich-text.tsx`.
- Services: expand `OVERRIDES` in `src/lib/service-content.ts` to cover all slugs in `SERVICES` (`src/lib/cities.ts`); keep `defaultContent` only as a fallback.
- About: rewrite `src/routes/_site.about.tsx`, reusing `getDirectoryStats`, `SERVICES`/`CITIES`, and existing imagery in `src/lib/style-images.ts`.
- Verify with `bunx tsgo --noEmit` and `bun run build`, then `seo_chat--update_findings`.
