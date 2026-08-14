# Compact studio page, no cover photos, one job-cost field

## 1. Restructure the studio page like the reference

Today the page spreads the studio across a hero card, a separate "About" card, a "Practice details" card and more, so a visitor scrolls a lot before seeing anything useful. The reference puts almost everything in one tight card with the enquiry form pinned beside it.

New layout:

```text
← Back to directory

┌─ one card ────────────────────────────┐  ┌─ Contact {studio} ─┐
│ [logo]  SERVICE  SERVICE  SERVICE     │  │ First / Last name  │
│ Studio Name                Verified   │  │ Email              │
│ One-line summary of the studio        │  │ Phone              │
│                                       │  │ Message            │
│ BASED IN   IN BUSINESS  FOUNDED       │  │ [ Request consult ]│
│ SERVES     TEAM SIZE    TYPICAL COST  │  └────────────────────┘
│ STYLES: modern · japandi · coastal    │
│ ─────────────────────────────────────  │
│ About text (short, inside the card)   │
│ Credentials · designers on the team   │
│ Website · Directions                  │
│ ─────────────────────────────────────  │
│ 3 verified reviews (first one inline) │
└───────────────────────────────────────┘

Reviews (n)         [ Write a Review ]
Gallery · Videos · Map · Nearby · Related reading
```

- Service tags become small pill badges above the studio name, as in the reference.
- The meta strip is one compact label-over-value grid (uppercase micro-labels, tighter type, smaller icons) instead of today's roomy 4-column block.
- About, credentials, team, social links and the action buttons fold into the same card rather than a separate section.
- Review count sits at the bottom of the card with the first review quoted inline; the full reviews list stays as its own section below.
- Everything else (gallery, videos, map, nearby, related reading) keeps its current place, just with tighter spacing.
- The contact form stays in the right rail and sticks while scrolling.

## 2. Remove cover photos

- Delete the cover photo banner from the studio page and stop using it as the page's share image.
- Remove the cover photo upload field and its help text from the studio dashboard and the super-admin onboarding view.
- Nothing is deleted from the database; the field simply stops being shown or editable.

## 3. One job-cost field, replacing pricing tier

- Remove the "Pricing tier" dropdown from the dashboard entirely.
- Keep a single field: **Typical job cost** — a dropdown of ranges (Under $10k, $10k – $25k, $25k – $75k, $75k – $150k, $150k+) plus a **Custom** option that reveals a free-text box so a studio can write, for example, "From $4,500 per room".
- The studio page shows this in the meta strip as "Typical job cost", and it also shows on match result cards and in the compare view.
- Matching still works on budget: the chosen range maps to a budget band behind the scenes. A custom cost that doesn't map to a band is treated as flexible, so the studio isn't filtered out.
- "Packages & typical prices" stays as-is — that's the optional itemised list.

## 4. Phone clean-up

- Lead cards and the contact form keep the enquirer's phone number (that's the client's own contact detail, requested for follow-up) — left exactly as-is.
- Analytics stops offering the legacy "phone" lead type in its charts and labels, so no stale category shows.
- Stored studio phone numbers are cleared from the database in a migration so nothing lingers.

## Technical notes

- `src/routes/_site.provider.$slug.tsx`: merge hero/about/details into one card component, drop `hero_photo_url` render and `ld.image`, replace `price_tier` Meta with a job-cost Meta, inline first review + count, sticky right rail.
- `src/components/listing-manager.tsx`: remove the cover photo upload block and `hero_photo_url` from the save payload; delete the `price_tier` Select; turn `typical_project_budget` into range-select + custom text (custom stored as a raw string).
- `src/lib/owner.functions.ts`: drop `hero_photo_url` and `price_tier` from the update schema; on save derive `price_tier` server-side from the matching `BUDGET_BANDS` entry (else `flexible`) so `match.functions.ts` keeps working unchanged.
- `src/components/match-result-card.tsx` / `src/routes/_site.compare.tsx`: show the job-cost string rather than the tier label.
- `src/components/analytics-dashboard.tsx`: remove "phone" from lead-type label maps.
- Migration: `UPDATE public.providers SET phone = NULL;`.
