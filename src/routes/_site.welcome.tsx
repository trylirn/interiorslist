import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Building2 } from "lucide-react";

export const Route = createFileRoute("/_site/welcome")({
  head: () => ({ meta: [{ title: "Welcome | Discover Medspa" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Welcome,
});

function Welcome() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-5xl md:text-6xl">Welcome to Discover Medspa</h1>
      <p className="mt-4 text-lg text-muted-foreground">What brings you here today?</p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Link to="/match" className="group rounded-3xl border border-border bg-card p-10 text-left transition hover:border-brand hover:shadow-md">
          <Heart className="h-8 w-8 text-brand" />
          <h2 className="mt-5 font-display text-2xl">Find a medspa</h2>
          <p className="mt-2 text-sm text-muted-foreground">Take a 60-second quiz and we'll match you with verified Texas providers.</p>
          <p className="mt-6 text-sm font-medium text-brand">Start matching →</p>
        </Link>
        <Link to="/for-business" className="group rounded-3xl border border-border bg-card p-10 text-left transition hover:border-brand hover:shadow-md">
          <Building2 className="h-8 w-8 text-brand" />
          <h2 className="mt-5 font-display text-2xl">I own a medspa</h2>
          <p className="mt-2 text-sm text-muted-foreground">Claim or submit your listing, manage your profile, and reach new patients.</p>
          <p className="mt-6 text-sm font-medium text-brand">Get started →</p>
        </Link>
      </div>
    </div>
  );
}
