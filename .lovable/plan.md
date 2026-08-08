# Show style photos in the Get Matched quiz

## What changes

When the AI interview asks a question about design style ("Which look are you drawn to?"), the answer options render as an image grid instead of plain text rows. Each option shows a photo of that style with the label underneath; tapping the card selects it exactly as today (single or multi-select, Continue button, free-text box all unchanged).

Every other question in the quiz keeps the current plain option rows.

## Matching options to photos

The AI writes option labels in free English ("Warm minimalist", "Mid-century modern", "Coastal / breezy"). A small matcher maps each label to one of the 12 known styles (modern, mid-century, traditional, transitional, farmhouse, industrial, coastal, minimalist, maximalist, scandinavian, eclectic, contemporary luxury) using keyword/alias matching. If a label matches no style, that option falls back to the current text row, so the grid never shows a wrong or random photo.

The style question is detected from the question text plus how many of its options resolve to styles — only when most options are recognizable styles does the grid render.

## New photography

Generate a fresh, dedicated editorial photo for each of the 12 styles so each image unmistakably reads as that style (e.g. maximalist = layered pattern and colour; industrial = brick, steel, concrete; scandinavian = pale wood and light). These replace the current style images everywhere they are used (style pages, service banners, card fallbacks), which also fixes the styles that currently look interchangeable.

Each new image is reviewed against its label before being wired in, and uploaded as a CDN asset pointer.

## Technical notes

- New square-ish images generated, uploaded via `lovable-assets`, pointers replacing the existing entries in `src/lib/style-images.ts`.
- Add `matchStyleSlug(label)` (alias table) to `src/lib/style-images.ts`.
- In `src/routes/_site.match.tsx`, add a `StyleOptionGrid` branch in the option render block; keep `OptionRow` for non-style questions and unmatched options.
- No changes to `src/lib/match-ai.functions.ts` or matching logic.
