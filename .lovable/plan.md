# Gated match results: 3–5 studios, unlocked with your details

## What changes on /match

1. **Fewer, better matches** — the AI match returns only the top 3–5 studios instead of 9.
2. **Blurred until you unlock** — results render immediately but visually blurred and non-interactive, with an overlay card:
   - "Your 4 matches are ready" + short summary of the brief
   - Fields: First name, Last name (required), Email (required), Phone (optional)
   - Button: "Request a consultation"
3. **After unlock** — cards become fully visible and selectable. The user picks which studios to send the brief to:
   - Checkbox on each card, plus "Select all"
   - One "Send my brief to N studio(s)" button submits the same brief to each selected studio
   - Confirmation panel listing who received it
4. **Richer match cards** so the reason for the match is obvious. Each card shows:
   - Match percent + verified badge
   - Studio name, city/state, branch label
   - Rating and review count
   - Styles that matched (highlighted) vs other styles
   - Services that matched (highlighted)
   - Project types, price tier / budget fit, remote-friendly flag
   - A one-line "Why this match" summary built from the overlapping signals

## Technical notes

- `src/lib/match.functions.ts`: cap results at 5 (min 3 when available), and return per-provider match reasons — `matchedServices`, `matchedStyles`, `matchedProjectType`, `budgetFit`, `remoteOk` — alongside the existing fields so the card can explain the score.
- New `src/components/match-result-card.tsx` renders the enriched card with matched attributes highlighted; used only on the match results screen.
- `src/routes/_site.match.tsx`: add `unlocked` state plus lead fields. Blur wrapper (`blur-sm pointer-events-none select-none`) over the grid with an absolutely-positioned unlock card until `unlocked`. Replace the single-studio `ConsultationForm` block with multi-select submission.
- Sending uses the existing `sendContactMessage` server function, called once per selected `placeId` with the composed brief (quiz answers + notes). No schema or backend changes needed; each send still lands in `contact_messages`.
- Name and email validated client-side before unlocking (email format, non-empty names); phone stays optional but the brief includes it when given.
