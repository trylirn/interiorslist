# A dedicated /faq page for Intearior

A single, Sam's List–style FAQ page at `/faq`: quiet editorial layout, section headings, and one-line questions that expand to reveal the answer.

## Structure

Three sections, each a group of expandable questions:

**1. About Intearior**
- What is Intearior?
- Who is Intearior for?
- Is Intearior free to use?
- Do you take a cut of a studio's fees?
- How do you make money?
- Are studios paying for placement?
- How do I report a bug, a wrong listing, or give feedback?

**2. For Home Owners**
- How does Intearior work?
- Can I browse on my own without taking the quiz?
- How does Get Matched work, and how many studios will I see?
- Why do I need to enter my details to see matches?
- How do I know a studio is legit?
- What's the difference between an interior designer and a decorator?
- Do I need a designer for a small project?
- What does interior design typically cost?
- What happens after I contact a studio?
- How quickly will someone respond?
- What if I'm not happy with my matches?
- Can I leave a review?

**3. For Interior Design Professionals**
- How do I get listed?
- How do I claim an existing profile?
- How does matching work — how do clients find me?
- How many leads can I expect?
- How are leads delivered?
- How do I optimize my profile?
- How do reviews work on my profile, and can I respond?
- Can I edit my address, hours, services and team?
- How do I remove my listing?

Answers stay short, plain, and honest — grounded only in what the site actually does (independent directory, no paid placement affecting relevance filtering, direct contact, claim flow, dashboard leads, reviews with owner responses).

Closing CTA band: Find a designer / Get matched / Claim your studio.

## Placement

- Linked from the footer "Trust" column (next to How it works, Privacy, Terms).
- Added to the sitemap and `public/llms.txt` page list.

## Technical notes

- New route `src/routes/_site.faq.tsx` with `createFileRoute("/_site/faq")`, own `head()` (title, description, og:title/description, og:type, twitter:card, canonical `/faq`).
- FAQ data as a typed array of `{ section, items[] }` in the route file; rendered with the existing shadcn `Accordion` (`type="single" collapsible`), matching the homepage FAQ styling.
- FAQPage JSON-LD covering every question, injected via a `<script type="application/ld+json">` in the component (same pattern used on service pages).
- Footer link added in `src/components/site-chrome.tsx`; `/faq` entry added to `src/routes/sitemap[.]xml.ts` and `public/llms.txt`.
- Verify with `bunx tsgo --noEmit`.
