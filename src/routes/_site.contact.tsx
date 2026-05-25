import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/contact")({
  head: () => ({ meta: [{ title: "Contact | Texas Aesthetics" }] }),
  component: () => (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-display text-5xl">Contact</h1>
      <p className="mt-6 text-lg text-muted-foreground">Questions, corrections, or partnership inquiries? Email <a className="text-brand underline" href="mailto:hello@texasinjectors.com">hello@texasinjectors.com</a>.</p>
      <p className="mt-8"><Link to="/" className="text-brand underline">← Back home</Link></p>
    </div>
  ),
});
