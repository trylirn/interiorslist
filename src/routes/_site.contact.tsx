import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/contact")({
  head: () => ({
    meta: [
      { title: "Contact Intearior — Partnership & Support" },
      { name: "description", content: "Get in touch with Intearior for corrections, partnership inquiries, or support." },
      { property: "og:title", content: "Contact Intearior" },
      { property: "og:description", content: "Reach the Intearior team for corrections, partnerships, and support." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: () => (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-display text-5xl">Contact</h1>
      <p className="mt-6 text-lg text-muted-foreground">Questions, corrections, or partnership inquiries? Email <a className="text-brand underline" href="mailto:isaac@interiorslist.com">isaac@interiorslist.com</a>.</p>
      <p className="mt-8"><Link to="/" className="text-brand underline">← Back home</Link></p>
    </div>
  ),
});
