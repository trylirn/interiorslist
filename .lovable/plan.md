## 1. Redesign in Sam's List style

Sam's List uses: cream/off-white background, deep forest-green primary, serif display headlines (large + tight), small clean sans body, rounded pill chips for category selection, a single big hero with "I'm looking for a…" pill row + featured pro card floating right, soft cards with subtle shadow, green CTA buttons, gold star ratings.

Apply across the site:

- Update `src/styles.css` tokens: bg `oklch(0.97 0.015 90)` (cream), primary deep forest green `oklch(0.32 0.06 150)`, accent gold `oklch(0.78 0.13 80)` for stars, ink near-black foreground. Replace terracotta usage.
- Swap display font to a serif similar to Sam's List (Fraunces is already loaded — keep, tighten tracking).
- Home (`_site.index.tsx`): two-column hero — left: "Find Your Aesthetic Injector" headline + sub + "I'm looking for…" pill row (Botox, Fillers, Lip Filler, Sculptra) that links to `/search?service=…`; right: floating featured provider card mirroring Sam's List's pro card (photo, name, city, service pill, stars+review count, "Serves all TX" line, green "View profile" button).
- Section below: "Trusted by patients across Texas" + city chips grid.
- Featured listings, then testimonials-style strip ("What people are saying" — pulled from top reviews).
- Header: simple wordmark "TEXAS INJECTORS", nav links (Find an Injector, Submit Listing, About), search icon, Sign In, green "Write a Review" pill.
- Provider cards: rounded-2xl, white, soft shadow, green service pills, gold stars, subtle border. Update `provider-card.tsx`.
- Buttons: primary = solid deep green with white text, pill radius.

## 2. Seed providers (currently 0)

The seed endpoint exists at `POST /api/public/seed` but has never been called. Plan:

- Invoke the seed endpoint server-side using the service role key for all 10 TX metros sequentially. This populates `providers` + `reviews` from Google Maps via the existing connector pipeline.
- Surface progress in chat; expect ~30–60 listings per city after dedup/filter.
- Re-verify with `select count(*) from providers` before claiming done.

If a city returns empty results, retry with broader search terms (already configured: "aesthetic injector", "botox clinic", "medspa botox filler", "lip filler").

## 3. Remove "data from Google Maps" mentions from public pages

Audit and remove any "Google", "Google Maps", "Google reviews", "powered by Google" copy from:

- Home, city pages, search, provider detail, submit, about, contact, header, footer.
- Replace with neutral language ("verified reviews", "real patient ratings", "public business data").

Add the attribution to legal pages only:

- Create `src/routes/_site.privacy.tsx` — full privacy policy including a "Data sources" section noting business listings, hours, photos, and reviews are sourced from Google Maps Platform and refreshed periodically; user data handling, cookies, contact.
- Create `src/routes/_site.terms.tsx` — terms of service including a "Third-party data" clause naming Google Maps Platform as the source, accuracy disclaimer, medical disclaimer, takedown/claim process.
- Footer: link to Privacy and Terms (remove any Google mention elsewhere in footer).

4. Change the Name from Texas Injectors to Texas Aesthetics. This is for SEO purposes. Also make the website SEO compliant

## Technical notes

- No schema changes required.
- Seed runs server-side via the existing `/api/public/seed` route — uses `SUPABASE_SERVICE_ROLE_KEY` as Bearer.
- Token changes in `src/styles.css` propagate everywhere via semantic Tailwind classes; components stay token-based.
- New legal routes follow the existing `_site.*` flat-route convention so they inherit the site chrome.