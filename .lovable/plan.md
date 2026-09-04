# Finish the remaining work: blog sitemap, Netlify, lead emails, admin access removal

## 1. Missing blog sitemap
`/sitemap.xml` already lists `/sitemap-blog.xml`, but that route doesn't exist yet, so the URL 404s. I'll add it: published blog posts only, with `lastmod` from each post's update date.

## 2. Netlify deployment
Add to the repo:
- `netlify.toml` — build command, publish directory, Node 20.
- A Netlify server build target alongside the current one, so the existing Lovable deploy keeps working.
- `DEPLOY-NETLIFY.md` — click-by-click steps: export to GitHub, import the repo in Netlify, set build settings, add environment variables (backend URL + publishable key, Maps browser/server keys, service-role key, seed import token, AI key), deploy, point your domain, then update the sitemap base URL and Search Console property.

Caveats written into the guide: Lovable-injected values (AI key) don't exist on Netlify, so Get Matched AI and address normalisation need your own provider key or they fall back to the non-AI path; database, auth and storage stay where they are; keep only one of the two live sites as canonical to avoid duplicate-content SEO issues.

## 3. Lead email forwarding
Prerequisite: a sender domain you own must be connected. I'll open the email setup for you first — it delegates a subdomain (e.g. `notify.yourdomain.com`) so mail comes from your brand.

Then:
- Every new lead (studio page enquiry and Get Matched) emails the studio's "Forward new leads to this email" address, falling back to the studio account email when blank.
- The email carries client name, email, phone, location, project type, rooms, budget, style, timeline and message, with a reply link to the client and a link to the lead in the dashboard.
- Leads still save to the dashboard exactly as now; if the email fails the lead is never lost.
- A "Send test email" button next to the field so a studio can confirm their address works.

## 4. Remove admin access to individual studio dashboards
Delete the feature entirely:
- Remove the route `/admin/provider/$placeId` and its file.
- Remove the "Open dashboard" and "Open my dashboard" links from the admin dashboard, and the studio-name link that opened it (name becomes plain text or links to the public profile).
- Remove the `admin` mode branch from the listing manager so it only serves the owner's own listing.
- Keep admin's site-wide read access in the admin dashboard (leads, listings, claims) unchanged.

## 5. Verification and Search Console
- Run typecheck and a production build.
- Check `/sitemap.xml` and all four child sitemaps return valid XML.
- Then your steps: add a Domain property in Search Console, verify with the DNS TXT record, submit `sitemap.xml`, and use URL Inspection on the homepage and one studio page to request indexing.

## Technical notes
- New route `src/routes/sitemap-blog[.]xml.ts` using the existing `urlSet` helper.
- Netlify: `netlify.toml` plus a Netlify server preset in `vite.config.ts`; the Cloudflare target stays intact.
- Emails: managed Lovable email sending, a `new-lead` template, sent from `sendContactMessage` and the match lead path with an idempotency key so retries don't double-send.
- Admin dashboard access: delete `src/routes/_site.admin.provider.$placeId.tsx`, drop the `admin` prop path in `src/components/listing-manager.tsx`, and remove the three `Link to="/admin/provider/$placeId"` usages in `src/routes/_site.admin.tsx`.
