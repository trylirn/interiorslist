# Finish the Intearior pass: copy, imagery, super admin

## 1. Branding and copy cleanup

A search shows the rebrand is nearly complete, but a few places still say "Interiors List":

- `public/llms.txt` — title, description, and the About line.
- Terms — the all-caps liability clause still reads "INTERIORS LIST".

Sweep the whole site once more for the old name and any leftover medspa wording, and fix the static pages so they read as an interior design directory end to end: About, Terms, Privacy, How It Works, For Business, Submit, plus `llms.txt`. Each page keeps its own unique title/description tags.

Dashboard and admin copy is already interior-focused (studio name, designers on staff, project fields), so this is a verification pass plus small wording tweaks where language is still generic — no functional changes.

## 2. Imagery on more pages

The editorial photography set (hero, 12 style shots, studio-at-work, consultation) currently only appears on the homepage and style pages. Extend it to:

- **City pages** (`/designers/{state}/{city}` and `/best/{state}/{city}`) — a banner image at the top, chosen deterministically per city so each city looks distinct but stable.
- **Service pages** (`/service/{slug}`) — the per-service image already mapped in the image helper, used as a header band.
- **Guide** — a consultation/studio image as the lead visual, plus section imagery.
- **About** and **For Business** — the studio and consultation shots.

All images get descriptive alt text and lazy loading below the fold.

## 3. Make Nokunato@gmail.com a super admin

That address has no account on the site yet, and there is no pending invite recorded. The signup flow already grants both admin and super_admin roles to that exact address the moment it registers, and it also applies any pending invite.

To make it work either way, record a pending super-admin invite for the address now. When the account is created (email/password or Google), the roles apply automatically and the Team tab in Admin becomes available. Nothing else needs to be done on their side beyond signing up with that email.

## Technical notes

- Copy edits only in `public/llms.txt`, `src/routes/_site.{about,terms,privacy,how-it-works,for-business,submit}.tsx`.
- Imagery via the existing `src/lib/style-images.ts` helpers (`cityImage`, `serviceImage`, `STUDIO_IMAGE`, `CONSULT_IMAGE`) — no new asset generation needed.
- Super admin: single data insert into `admin_invites` (email lowercased, role `super_admin`); the existing `handle_new_user` trigger consumes it on signup. No schema change.
