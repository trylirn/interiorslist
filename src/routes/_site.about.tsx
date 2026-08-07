import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/about")({
  head: () => ({
    meta: [
      { title: "About | Interiors List" },
      { name: "description", content: "Interiors List is the trusted nationwide directory for interior design studios — full-home design, kitchen & bath, and more, ranked by real client reviews." },
      { property: "og:title", content: "About Interiors List" },
      { property: "og:description", content: "The trusted nationwide directory for interior design studios." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: () => (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <h1 className="font-display text-5xl">About Interiors List</h1>
      <p className="mt-6 text-lg text-muted-foreground">Interiors List is the trusted directory for finding interior design studios — full-home design, kitchen & bath, renovation management, staging, and e-design — across every major U.S. city.</p>
      <p className="mt-4 text-lg text-muted-foreground">Listings are continuously verified to confirm each studio is still operating. We don't accept paid placement — every studio is ranked by real client reviews.</p>
      <div className="mt-10 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl">A quick note</h2>
        <p className="mt-2 text-sm text-muted-foreground">This site is informational only. Always verify a studio's licensing, insurance, and professional credentials (such as ASID or NCIDQ membership) and review any contract carefully before hiring them for your project.</p>
      </div>
      <p className="mt-8"><Link to="/" className="text-brand underline">← Back home</Link></p>
    </div>
  ),
});
