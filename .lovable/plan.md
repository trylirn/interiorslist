# Account closure, unique service pages, blog editor fixes, and the outstanding items

## 1. Close account

Add a "Close account" section at the bottom of the dashboard settings:

- Red-outlined danger area explaining what happens: the profile, saved details, and any leads/claims tied to the account are removed, and studio listings the user claimed are released back to unclaimed (the public listing itself stays in the directory).
- Confirmation dialog requiring the user to type DELETE before the button enables.
- On confirm: the account and its profile/role rows are deleted server-side, the session is cleared, and the user lands on the homepage with a confirmation message.
- Super admin accounts cannot delete themselves (guard server-side) to avoid locking the project out.

## 2. Every /service/... page reads the same

Only 7 of the 41 services have their own content; the other 34 fall back to one generic template with the service name swapped in, which is near-duplicate content across dozens of indexable pages.

Fix by writing genuinely distinct content for every service: what it covers, what you get, what to watch for, how the process runs, realistic cost ranges, who it suits, and 3 service-specific FAQs. Each page's intro, headings, and FAQ text will differ enough to stand on its own, and the FAQ schema on each page will carry those unique questions.

## 3. Internal / additional notes

The same `notes` field is labelled "Internal notes" in the studio dashboard but published on the public profile as "Additional notes". Remove it entirely: drop the dashboard field and the public section, and stop saving to it. Existing text stays in the database untouched but is no longer shown or editable.

## 4. "Serves clients" dropdown

Add "National & International" as a fourth option alongside Local area, Regional, and Nationwide, and make sure it displays correctly wherever service area is shown.

## 5. Blog images: captions and links

Current image insertion has no caption support at all, and inserting a link while an image is selected wraps unpredictably. Changes to the editor:

- Insert images as a proper figure with an optional caption line beneath, editable inline.
- Prompt flow: upload or URL → alt text → optional caption.
- Clicking an inserted image opens a small toolbar to edit alt text, edit/remove the caption, add or remove a link on the image, and delete it.
- Link button: when text is selected, link the text; when nothing is selected, insert the URL as a labelled link rather than doing nothing.
- Allow `figure`, `figcaption` in the article sanitizer with matching styling on the public post page so captions render the same as in the editor.

## 6. Outstanding items from last session

- Run typecheck and production build over the blog-analytics and blog-admin edits and fix whatever mismatched (helper names, imports).
- Compare page mobile fix: solid background and fixed width on the pinned label column with a divider, stack each studio as its own card on phones instead of a horizontally scrolling table, and add bottom padding so the floating compare bar never covers the last row.
- Mark the San Francisco SEO finding fixed once the build passes.

## Technical notes

- Account closure: `deleteMyAccount` server fn with `requireSupabaseAuth`, loading `supabaseAdmin` inside the handler; null out `providers.claimed_by`, delete `profiles`/`user_roles`/`favorites`-style rows, then `auth.admin.deleteUser`. UI in `src/routes/_site.dashboard.tsx`.
- Service content: expand `OVERRIDES` in `src/lib/service-content.ts` to cover all 41 slugs in `SERVICES`; keep `defaultContent` only as a type-safe fallback.
- Notes removal: `src/components/listing-manager.tsx` (field + payload), `src/routes/_site.provider.$slug.tsx` (Additional notes block), `src/lib/owner.functions.ts` select/validator.
- Service area: add `national_international` to the select and to the union type in `owner.functions.ts`/`listing-manager.tsx` (column is free text, no migration needed).
- Editor: `src/components/rich-text-editor.tsx` figure/figcaption insertion + selected-image toolbar; `src/components/rich-text.tsx` sanitizer allow-list and prose styles.
- Compare: `src/routes/_site.compare.tsx` — solid token background instead of `bg-inherit`, `md:` breakpoint switch between card list and table.
- Verify with `bunx tsgo --noEmit` and `bun run build`.
