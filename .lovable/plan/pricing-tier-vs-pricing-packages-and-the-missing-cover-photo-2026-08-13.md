# Pricing tier vs pricing & packages, and the missing cover photo

## The difference between the two pricing fields

The studio dashboard has two separate things, which is confusing today:

- **Pricing & packages** (Profile tab) — a free-form list the studio types in: package name, price, and a note. Example: "Room refresh — from $2,500 — includes concept board and shopping list". This already shows on the public studio page in its own "Pricing & packages" block.
- **Pricing tier** (Profile tab) — a single dropdown choice (budget-friendly / mid-range / premium / luxury) plus a "typical project budget". This is the one the matching quiz uses to decide whether a studio fits the client's budget.

You said the tier is the one to keep visible. Right now the studio page tries to display it in the "Budget" slot at the top, but that field is never actually loaded from the database, so it silently shows nothing.

### What changes

- Load `price_tier` and `typical_project_budget` with the rest of the studio profile so they can be shown.
- Show the tier as a proper labelled badge on the studio page (e.g. "Mid-range · typical project $25k–$50k"), in the header meta row alongside Based In / Serves.
- Relabel the dashboard fields so the distinction is obvious: "Pricing tier (used for matching)" and "Packages & typical prices (optional, shown on your profile)".

## Cover photos not showing

Cause: the cover photo is uploaded and saved correctly, but the public studio page never renders it anywhere — it is only used inside the page's hidden search-engine data. So it can never appear no matter what a studio uploads.

Fix: render the cover photo as a wide banner image at the top of the studio page, above the header card, with rounded corners matching the site style. If a studio has no cover photo, the page looks exactly as it does now. Also add the same short helper text in the dashboard explaining where the cover photo appears.  
  
Also remove the Phone number features. Studios should not be able to provide their phone numbers and it should not display

## Technical notes

- `src/lib/providers.functions.ts`: add `price_tier, typical_project_budget, remote_services` to `PROVIDER_DETAIL_COLS` (`price_tier` is currently read on the page but not selected; `remote_services` is read too — verify and include).
- `src/routes/_site.provider.$slug.tsx`: render `p.hero_photo_url` as a banner (`aspect-[3/1] object-cover`) above the hero card; replace the raw `price_tier` Meta value with a mapped label plus `typical_project_budget`.
- `src/components/listing-manager.tsx`: label/help-text copy only for the two pricing sections and the cover photo field.
- No schema or upload changes; gallery/cover signed URLs already work.