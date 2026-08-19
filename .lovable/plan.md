# Finish rate limiting, verify the build, and settle the .env question

## 1. Rate-limit the public submission endpoints

Wire the existing limiter (`src/lib/rate-limit.server.ts`, backed by the server-only `rate_limit_hits` table) into the endpoints anyone can hit without signing in:

- `sendContactMessage` — 5 per hour per device
- `submitPublicBusiness` (studio submissions) — 5 per hour
- `submitClaim` (claim a studio) — 5 per hour
- Signed-in review submission stays as is (already gated by auth)

Behaviour when the limit is hit: a friendly "Too many submissions from this device. Please try again later." message, not a technical error. If the limiter itself fails, submissions still go through — a legitimate enquiry is never blocked by our own plumbing.

## 2. Typecheck / build pass

Run a full typecheck and production build to confirm the recent sweep (the `fail()` error-handling change across ~16 files, the team/Pinterest dashboard work, the storage policy change) introduced no import or type regressions, and fix anything that surfaces.

## 3. The .env file — recommendation: keep it

Short answer: moving it to secrets is **not** safe, and the file is not a security problem.

The file contains only values that are already public by design:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` — the publishable keys the browser must carry to talk to the backend; they are visible in the shipped JavaScript either way and are protected by row-level security, not by secrecy.
- `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY` / `..._TRACKING_ID` — a browser Maps key, also public by nature.
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` — the server-side twins of the same public values.

Anything genuinely sensitive (service-role key, database URL, Lovable AI key, seed-import token, the Maps *server* key) is already in the encrypted secret store and is **not** in this file.

Why it can't simply move: `VITE_*` values are baked into the frontend bundle at build time by Vite. Backend secrets are only injected at request time, so a build with no `.env` would produce an app whose browser code has no backend URL or key — sign-in, search, dashboards and matching would all fail. The file is also regenerated automatically by the platform, so deleting it would not stick.

If it's the git tracking that bothers you, I can add `.env` to `.gitignore` while leaving the file on disk — but note this can break clean builds elsewhere, so my recommendation is to leave it exactly as is.

## Technical notes

- `enforceRateLimit(endpoint, { max, windowMinutes })` is imported inside each handler (server-only module; keeps it out of the client bundle) and called before any database write or validation-heavy work.
- Bucket key is `endpoint:sha256(caller IP)` truncated — no raw IP is stored.
- Old rows in `rate_limit_hits` are cleaned opportunistically (24h retention) by the existing helper.
