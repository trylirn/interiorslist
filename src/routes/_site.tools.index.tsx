import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Calculator, Palette } from "lucide-react";

export const Route = createFileRoute("/_site/tools/")({
  head: () => ({
    meta: [
      { title: "Free Interior Design Tools | Intearior" },
      {
        name: "description",
        content:
          "Free tools for planning a project: an interior design budget estimator and a colour palette generator. No sign-up, saved in your browser.",
      },
      { property: "og:title", content: "Free Interior Design Tools | Intearior" },
      { property: "og:description", content: "Estimate a budget and build a colour palette — free, no sign-up." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/tools" }],
  }),
  component: ToolsHub,
});

function ToolsHub() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">Free tools</p>
      <h1 className="mt-3 font-display text-5xl md:text-6xl">Plan it before you pay for it.</h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        Free tools for homeowners and studios. Nothing to sign up for, and everything you make is saved
        in your own browser.
      </p>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        <ToolCard
          to="/tools/budget-estimator" Icon={Calculator} title="Budget Estimator"
          body="Room, size, scope, finish level and state — get a realistic cost range with a breakdown of where it goes."
        />
        <ToolCard
          to="/tools/color-palette" Icon={Palette} title="Colour Palette Generator"
          body="Built for studios: harmony rules, shade ladders, contrast checks and palettes pulled from a photo."
        />
      </div>


      <div className="mt-16 border border-border bg-secondary/30 p-8">
        <h2 className="font-display text-2xl">Ready to talk to a real studio?</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Tools get you to a shortlist of decisions. A designer gets you to a finished room. Answer a few
          questions and we'll match you with up to three studios that fit.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild className="rounded-none"><Link to="/match">Get matched</Link></Button>
          <Button asChild variant="outline" className="rounded-none"><Link to="/cost-estimator">Cost guides</Link></Button>
        </div>
      </div>
    </div>
  );
}

function ToolCard({
  to, Icon, title, body,
}: {
  to: "/tools/budget-estimator" | "/tools/color-palette";
  Icon: typeof Calculator;
  title: string;
  body: string;
}) {
  return (
    <Link to={to} className="group border border-border bg-card p-6 transition hover:border-brand">
      <Icon className="h-6 w-6 text-brand" />
      <h2 className="mt-4 font-display text-2xl group-hover:text-brand">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <span className="mt-4 inline-block text-sm font-medium text-brand">Open tool →</span>
    </Link>
  );
}
