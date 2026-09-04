# Deploying Intearior to Netlify

This app is **not** a static site. It has a server side (search, matching,
dashboards, sitemaps, tracking endpoint), so Netlify must run it as a server
deployment. `netlify.toml` in the repo root already configures that.

## 1. Get the code onto GitHub

1. In Lovable, top-right → **GitHub** → **Connect / Export**.
2. Authorise, pick an account, create the repo.
3. Wait for the first push to finish.

## 2. Create the Netlify site

1. Netlify → **Add new site** → **Import an existing project** → **GitHub**.
2. Pick the repo you just exported.
3. Build settings (already in `netlify.toml`, confirm they match):
   - Build command: `npm run build`
   - Publish directory: `dist/client`
   - Node version: `20`
4. Don't deploy yet — add the environment variables first (next step).

## 3. Environment variables

Netlify → **Site configuration → Environment variables → Add a variable**.
Copy the values from the project's `.env` (browser values) and your backend
settings (server values).

Browser (must be prefixed `VITE_`, these are public by design):

| Name | What it is |
| --- | --- |
| `VITE_SUPABASE_URL` | Backend URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Backend publishable key |
| `VITE_SUPABASE_PROJECT_ID` | Backend project id |
| `VITE_GOOGLE_MAPS_API_KEY` | Browser Maps key (restrict it to your domain) |

Server (secret — never commit these):

| Name | What it is |
| --- | --- |
| `SUPABASE_URL` | Same backend URL |
| `SUPABASE_PUBLISHABLE_KEY` | Same publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin/database writes) |
| `GOOGLE_MAPS_SERVER_KEY` | Server Maps key (geocoding, review import) |
| `SEED_IMPORT_TOKEN` | Token guarding the bulk import endpoint |
| `LOVABLE_API_KEY` *or* your own provider key | AI features |

The service role key and the database password are **not** retrievable from
Lovable Cloud. If you don't already have the service role key stored somewhere,
you'll need to move the backend to your own Supabase project before hosting the
app elsewhere.

## 4. Deploy

**Deploys → Trigger deploy → Deploy site.** The first build takes a few
minutes. If it fails, open the deploy log — the failure is almost always a
missing environment variable.

## 5. Point your domain at Netlify

1. Netlify → **Domain management → Add a domain**.
2. Enter your domain and follow the DNS records Netlify shows you (either
   change the nameservers, or add the `A` / `CNAME` records at your registrar).
3. Wait for the HTTPS certificate to be issued (usually minutes).

## 6. After go-live

1. Update `BASE_URL` in `src/lib/sitemap-xml.ts` to your live domain and push.
2. In Google Search Console, add a **Domain property** for the new domain,
   verify with the DNS TXT record, and submit `sitemap.xml` again.
3. Decide which site is canonical (see caveats) and stop publishing the other.

## Honest caveats

- **AI features.** Get Matched AI ranking and address normalisation currently
  run on a Lovable-provided key that does not exist on Netlify. Without your
  own provider key those features fall back to the non-AI path (they still
  work, just less smart).
- **Backend stays put.** Database, auth, storage and secrets live in the
  backend project; Netlify only hosts the app. Nothing about your data moves.
- **Two live sites.** Publishing from Lovable and deploying to Netlify produce
  two separate public sites with the same content. Keep exactly one as the real
  one, or search engines will treat it as duplicate content.
- **Build target.** `NITRO_PRESET=netlify` in `netlify.toml` switches the
  server bundle to Netlify Functions. The Lovable/Cloudflare target is
  untouched, so publishing from Lovable keeps working.
