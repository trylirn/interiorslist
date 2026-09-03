# Deploying interiorslist to Netlify

## One-time setup
1. Netlify → Add new site → Import an existing project → GitHub → `trylirn/interiorslist`.
2. Build command `npm run build`, publish directory `dist`, Node 22 — these live in `netlify.toml`, committed to the repo.
3. Add environment variables (Site → Environment variables → Import from a .env file):
   - Public values (copy straight from this repo's `/.env`): `SUPABASE_URL`, `VITE_SUPABASE_URL`,
     `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
     `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`, `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID`.
   - Private values (from Lovable → this project → Secrets — never commit these):
     `SUPABASE_SERVICE_ROLE_KEY`, `FIRECRAWL_API_KEY`, `GOOGLE_MAPS_API_KEY`, `LOVABLE_API_KEY`.
4. Deploy.

## Later, once the above is confirmed working
5. Point your domain at Netlify: Domain management → Add a domain → follow Netlify's DNS records.
6. After the domain switch, update the sitemap's base URL and add the new domain in Search Console.

## Notes
- This deploys alongside the existing Lovable deploy without conflict — both build presets are
  auto-detected (Netlify vs. Lovable's sandbox), nothing extra to configure.
- `.env` in this repo is committed on purpose — it only holds `VITE_`-prefixed/publishable values,
  which are already public in the browser bundle anyway. Never add a real secret to it.
