import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Building2 } from "lucide-react";

export const Route = createFileRoute("/_site/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome | Intearior" },
      { name: "description", content: "Tell us what brings you to Intearior — finding a design studio or listing your own." },
      { property: "og:title", content: "Welcome | Intearior" },
      { property: "og:description", content: "Find a design studio or list your own on Intearior." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-5xl md:text-6xl">Welcome to Intearior</h1>
      <p className="mt-4 text-lg text-muted-foreground">What brings you here today?</p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Link to="/match" className="group rounded-3xl border border-border bg-card p-10 text-left transition hover:border-brand hover:shadow-md">
          <Heart className="h-8 w-8 text-brand" />
          <h2 className="mt-5 font-display text-2xl">Find a design studio</h2>
          <p className="mt-2 text-sm text-muted-foreground">Take a 60-second quiz and we'll match you with verified studios nationwide.</p>
          <p className="mt-6 text-sm font-medium text-brand">Start matching →</p>
        </Link>
        <Link to="/for-business" className="group rounded-3xl border border-border bg-card p-10 text-left transition hover:border-brand hover:shadow-md">
          <Building2 className="h-8 w-8 text-brand" />
          <h2 className="mt-5 font-display text-2xl">I own a design studio</h2>
          <p className="mt-2 text-sm text-muted-foreground">Claim or submit your listing, manage your profile, and reach new clients.</p>
          <p className="mt-6 text-sm font-medium text-brand">Get started →</p>
        </Link>
      </div>
    </div>
  );
}
