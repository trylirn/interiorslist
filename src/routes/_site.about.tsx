import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/about")({
  head: () => ({
    meta: [
      { title: "About | Texas Aesthetics" },
      { name: "description", content: "Texas Aesthetics is the trusted directory for aesthetic injectors across the state — Botox, fillers, Sculptra, and more, ranked by real patient reviews." },
      { property: "og:title", content: "About Texas Aesthetics" },
      { property: "og:description", content: "The trusted Texas directory for aesthetic injectors." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <h1 className="font-display text-5xl">About Texas Aesthetics</h1>
      <p className="mt-6 text-lg text-muted-foreground">Texas Aesthetics is the trusted directory for finding aesthetic injectors — Botox, dermal fillers, Sculptra, and more — across every major Texas metro.</p>
      <p className="mt-4 text-lg text-muted-foreground">Listings are continuously verified to confirm each business is still operating. We don't accept paid placement — every provider is ranked by real patient reviews.</p>
      <div className="mt-10 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Medical disclaimer</h2>
        <p className="mt-2 text-sm text-muted-foreground">This site is informational only and is not medical advice. Always verify a provider's credentials with the Texas Medical Board and consult a licensed professional before any cosmetic procedure.</p>
      </div>
      <p className="mt-8"><Link to="/" className="text-brand underline">← Back home</Link></p>
    </div>
  ),
});
