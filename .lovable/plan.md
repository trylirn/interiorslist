# Blog, studio logos, and orphan-page cleanup

## 1. Orphan pages

Every route is reachable except two:

- `/welcome` — a "what brings you here?" splash with no link anywhere on the site. Link it from the header/footer "For studios" area? No: it duplicates `/for-business` and `/match`, so retire it with a 301 redirect to `/` (same treatment already used for the retired `/guide`).
- `/guide` — already a 301 to `/how-it-works`; leave as is.

Also extend the sitemap: it lists only the core pages, so add `/blog`, every published blog post, and the existing `/review` landing page.

## 2. Studio logo / profile picture

Studio listings today only have a hero photo and gallery — there is no logo field in the database or the dashboard.

- Add a `logo_url` column to studios.
- In the studio dashboard Media tab, add a "Studio logo" uploader above the hero photo: square preview, one image, uploaded to the existing studio photos bucket, with remove/replace.
- Show the logo on the public studio page (rounded badge next to the studio name in the header area), on the dashboard listing card, and in the studio's JSON-LD `logo` field. When no logo exists, everything renders exactly as it does now.

## 3. Blog

Modeled on the Sam's List blog: an index of article cards (cover image, category, title, excerpt, author + date) and a long-form article page with a big title, author byline, reading time, cover image, and clean typographic body.

**Public**

- `/blog` — filterable list by category, newest first, with a featured lead post.
- `/blog/$slug` — article page: cover, title, author, date, reading time, rich body, and a "Related posts" strip at the bottom. Article JSON-LD plus proper title/description/OG tags per post.
- Footer gets a "Blog" link under Company.

**On studio pages**

A "Related reading" section at the bottom of every studio profile showing up to 3 posts, matched on shared tags (style/service/city) with newest posts as fallback so the section is never empty when posts exist.

**Admin only**

New "Blog" tab in the admin area (visible to admins and super admins only) with a list of posts and a create/edit editor: title, auto slug, excerpt, cover image upload, category, tags, author name, body (markdown), and draft/published toggle with publish date. Delete with confirmation.

## Technical notes

- Migration creates `public.blog_posts` (slug unique, title, excerpt, cover_url, category, tags text[], author_name, author_id, body_md, published bool, published_at, timestamps) with GRANTs, RLS enabled, `updated_at` trigger. Policies: no anon access; write/read-all policies restricted to `public.has_role(auth.uid(),'admin')` / `'super_admin'`. Public reads go through server functions using the service-role client and only published rows with a safe column projection — the same model already documented in security memory for `providers`/`reviews`, so no new anon exposure.
- New `src/lib/blog.functions.ts`: public `listBlogPosts`, `getBlogPost`, `listRelatedPosts` (service-role client imported inside handlers via `await import`, published-only filters); admin `upsertBlogPost`, `deleteBlogPost` behind `requireSupabaseAuth` + role check.
- Migration adds `providers.logo_url text`; `updateMyListing` zod schema and `PROVIDER_DETAIL_COLS` extended.
- Markdown rendered with a sanitized renderer (no raw HTML injection) to avoid XSS.
- Cover/logo uploads reuse the existing `provider-photos` bucket paths; blog covers go to a new public `blog-images` bucket created via the storage tool with admin-only write policies.
- Files touched: `src/components/listing-manager.tsx`, `src/lib/owner.functions.ts`, `src/lib/providers.functions.ts`, `src/routes/_site.provider.$slug.tsx`, `src/components/site-chrome.tsx`, `src/routes/_site.admin.tsx`, `src/routes/sitemap[.]xml.ts`, `src/routes/_site.welcome.tsx`; new `src/routes/_site.blog.index.tsx`, `_site.blog.$slug.tsx`, `_site.admin.blog.tsx`, `src/lib/blog.functions.ts`.
