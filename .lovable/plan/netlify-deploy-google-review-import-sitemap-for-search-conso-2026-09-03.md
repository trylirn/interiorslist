# Netlify deploy, Google review import, sitemap for Search Console, and lead email forwarding

## 1. Netlify deployment (guide + config)

Your app is not a static site — it has a server side (search, matching, dashboards, sitemap, tracking endpoint), so Netlify must run it as a server deployment, not a plain folder of files.

What I'll add to the project:

- A `netlify.toml` with the build command, publish directory and Node version.
- A Netlify-targeted server build preset alongside the current one, so the existing Lovable deploy keeps working and Netlify gets its own output.
- A short `DEPLOY-NETLIFY.md` in the repo with the exact click-by-click steps.

The step-by-step you'll follow (also written into the repo):

1. Export the project to GitHub from Lovable (top-right → GitHub → Connect / Export).
2. In Netlify: Add new site → Import an existing project → GitHub → pick the repo.
3. Build command `npm run build`, publish directory as set in `netlify.toml`, Node 20.
4. Add environment variables in Netlify → Site configuration → Environment variables. You need: the backend URL and publishable key (both the browser `VITE_...` and server copies), the Google Maps browser key, the Maps server key, the service-role key, the seed import token, and the AI key. I'll list the exact names in the guide. Lovable-injected values (like the AI gateway key) do not exist on Netlify, so anything that depends on them must get its own key.
5. Deploy, then point your domain at Netlify (Domain management → Add domain → follow their DNS records).
6. After going live, update the sitemap base URL and Search Console property to the new domain.

Honest caveats I'll spell out in the guide:
- Lovable's AI features (Get Matched AI, address normalisation) run on a Lovable-provided key. On Netlify you'll need your own provider key or those features degrade to the non-AI fallback.
- The database, auth and storage stay where they are — Netlify only hosts the app.
- Publishing from Lovable and deploying to Netlify are two separate live sites; keep one as the real one to avoid duplicate-content SEO issues.

## 2. Import reviews from Google

Each studio gets an "Import reviews" action in its dashboard (Reviews area):

- Pulls the studio's Google reviews using its Google Place ID via your existing Google Maps connection.
- Google's API returns up to 5 reviews per business — that's a hard limit on their side, not ours. Overall star rating and total review count are also refreshed.
- Imported reviews are stored with author name, photo, rating, text and date, tagged with source "Google" so they're visually distinguished from reviews left on Intearior.
- Re-running the import updates existing entries instead of duplicating them.
- Admins can run the same import from a studio's dashboard.
- Public profile shows a small "via Google" label on imported reviews.

I'll add a `source` (and `external_id`) column to reviews so imports stay de-duplicated and separable.

## 3. Sitemap and Google Search Console

The sitemap already exists at `/sitemap.xml` and is listed in `robots.txt`. What I'll do:

- Verify it renders correctly and drop the query-string URLs (`/service/x?city=y`) — Search Console treats those as duplicates of the plain service pages.
- Split it into a sitemap index with child sitemaps (pages, cities/states, studios, blog) so it stays under limits as the directory grows and you can see indexing per group.
- Keep `lastmod` only where there's a real update timestamp.

Then your steps in Search Console (I'll write these out at the end):
1. Add a Domain property for your domain and verify with the DNS TXT record.
2. Sitemaps → submit `sitemap.xml`.
3. Use URL Inspection on the homepage and one studio page to request indexing.

## 4. "Forward new leads to this email" — make it work

The field is already saved per listing; nothing sends yet. To make it send:

- **Prerequisite:** a sender domain you own must be connected (you confirmed you have one). I'll open the email setup for you — it delegates a subdomain like `notify.yourdomain.com` so mail comes from your brand.
- Every new lead (studio page enquiry and Get Matched) triggers an email to the studio's forwarding address — and, if that field is blank, falls back to the studio's account email so nobody misses a lead.
- The email contains the client's name, email, phone, location, project type, rooms, budget, style, timeline and message, with a "Reply" link straight to the client and a link to the lead in the dashboard.
- Leads still land in the dashboard exactly as now; email is an addition, never a replacement. If the email fails, the lead is still saved.
- I'll add a "Send test email" button next to the field so a studio can confirm their address works.

## Technical notes

- Netlify: `netlify.toml` plus a Netlify server target in the Vite config; the current Cloudflare target is left intact so Lovable publishing is unaffected.
- Review import: new server function `importGoogleReviews` (owner/admin authorised, rate limited), calling Google Places Details through the connector gateway server-side; upsert on `(provider_place_id, source, external_id)`.
- Migration: add `source`, `external_id` to `reviews` with a unique index, plus grants; existing rows default to source `site`.
- Emails: managed Lovable email sending — a registered `new-lead` template and a send from the existing lead-creation server code, using an idempotency key so retries don't double-send.
- Sitemap: `sitemap[.]xml.ts` becomes an index; child routes `sitemap-pages`, `sitemap-locations`, `sitemap-studios`, `sitemap-blog`.
