# Remove About page, drop named certifications, and the Lovable question

## 1. Remove the About page

- Delete the About route (`src/routes/_site.about.tsx`) so `/about` no longer exists.
- Remove the "About" link from the footer in `src/components/site-chrome.tsx`.
- Remove the `/about` entry from the sitemap so search engines stop being pointed at it.

Note: the page is currently indexed, so the URL will start returning the site's not-found page after publishing. If you would rather keep the content but hide it from navigation, say so and I'll leave the route in place and only drop the footer link and sitemap entry.

## 2. Remove named certification bodies

Every mention of NCIDQ, ASID and IIDA gets replaced with neutral wording along the lines of "professional certifications and memberships" / "look for relevant certifications and licensing". Places affected:

- Homepage: trust card, credentials paragraph and the "What credentials should I look for?" FAQ answer.
- How it works, Terms, Privacy, Submit a studio (field label), city pages (licensing paragraph).
- Sign-up / login: the licence-type dropdown drops the three named options and keeps generic entries (Certified Interior Designer, Licensed Interior Designer, Design Principal, Other).
- Studio dashboard: the "Credentials & licenses" placeholder text becomes generic.
- Match scoring: the certification bonus stops keyword-matching those three acronyms and instead looks for generic certification/licence wording in the studio's own text.

No database changes; studios that typed those acronyms into their own credentials field keep their text, since that is their own content.

## 3. Can Lovable references be removed from the codebase?

Not entirely, and removing them would break the app. The remaining references fall into three groups:

- **Build and runtime dependencies** (`@lovable.dev/vite-tanstack-config`, `@lovable.dev/cloud-auth-js`, the component tagger) — these are the framework config and the auth client the app is built on. Removing them stops the project from building.
- **Auto-generated integration files** (backend client, preview auth storage, auth middleware) — regenerated automatically; edits are overwritten.
- **Hosting URLs** (`interiorslist.lovable.app` in the sitemap, robots.txt and page metadata) — these are the live domain today. They can all be swapped to your own domain the moment you connect a custom domain, which is the real fix for public-facing branding.

What I can do now, if you want it: nothing user-visible mentions Lovable today — the name appears only in dependency names and internal files no visitor sees. So the practical answer is to connect a custom domain and then switch every hard-coded `interiorslist.lovable.app` URL to it. Say the word and I'll include that swap once the domain is live.
