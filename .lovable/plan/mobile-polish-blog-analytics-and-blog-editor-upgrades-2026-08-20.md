# Mobile polish, blog analytics, and blog editor upgrades

## 1. Finish the San Francisco city work

Run a typecheck and production build pass over the recent `cities.ts` change, then mark the "Add San Francisco to the directory cities" SEO finding as fixed so it leaves the failing list.

## 2. Mobile layout fixes

The screenshot shows the Compare page breaking on a phone: the first column ("City", "Branch", "Designers"…) is pinned in place but see-through, so the studio content scrolls underneath it and the two overlap. The floating "Compare (2)" bar also sits on top of the last row.

- Give the pinned label column a solid background and a fixed width so nothing can show through it, and add a divider line on its right edge.
- On phones, drop the pinned column entirely and stack each studio as its own card (label above value) so there is no horizontal scroll at all; keep the side-by-side table from tablet width up.
- Add bottom padding to the page so the floating compare bar never covers content.

Beyond Compare, do a mobile pass over the pages most likely to have the same class of problem — studio profile, search, admin dashboard tables, match results, blog index and article — checking for horizontal overflow, text that clips instead of wrapping, header/toolbar rows that collide, and content hidden behind floating bars. Fix using the standard responsive pattern (allow text to shrink and truncate, keep icons fixed, stack on mobile and expand on larger screens).

## 3. Blog analytics for admins

Add a "Blog" tab to the admin Analytics dashboard, using the page-view data already being collected (no new tracking or database changes):

- Totals for the selected date range: blog visits, unique visitors, and how many blog readers went on to view a studio.
- Top posts table: post title, views, unique visitors — linking to the live article.
- A small day-by-day trend line matching the style of the other tabs.

## 4. Separate drafts from published posts

In the admin Blog tab, add "All / Published / Drafts" filters with counts, sort drafts first within their group, and show a clearer status pill on each row.

## 5. Blog editor: images and horizontal rule

- New image button in the toolbar: pick a file, upload to the blog images bucket, and insert it into the article at the cursor (with an alt-text prompt for accessibility and SEO). Also accept a pasted image URL.
- New button that inserts a horizontal separator line, styled to match the article typography on the public post page.

## Technical notes

- Compare: `src/routes/_site.compare.tsx` — replace `bg-inherit` on the sticky cell with a solid token background, add `md:` breakpoint switch between card list and table.
- Blog analytics: new `getBlogAnalytics` server fn in `src/lib/analytics.functions.ts` filtering `analytics_events` on `event_type = 'page_view'` and `path LIKE '/blog/%'`, joining slugs to `blog_posts` titles; new panel in `src/components/analytics-dashboard.tsx`.
- Draft filter: client-side state in `src/components/blog-admin.tsx` over the existing `listAllBlogPosts` result.
- Editor: `src/components/rich-text-editor.tsx` gains `Image` and `Minus` toolbar buttons; upload reuses the existing `blog-images` bucket + signed-URL flow from `blog-admin.tsx` (lifted into a prop callback so the editor stays presentational). Add `[&_hr]` and `[&_img]` styling in both the editor and `src/components/rich-text.tsx` renderer, and allow `<hr>`/`<img>` in the sanitizer allow-list.
- Verify with `bunx tsgo --noEmit` and `bun run build`.
