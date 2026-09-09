import { createFileRoute, Link } from "@tanstack/react-router";
import { BudgetEstimator } from "@/components/tools/budget-estimator";
import { COST_TOPICS } from "@/lib/cost-content";
import { US_STATES } from "@/lib/cost-model";

export const Route = createFileRoute("/_site/cost-estimator/")({
  head: () => ({
    meta: [
      { title: "Interior Design Cost Guides & Estimator | Intearior" },
      {
        name: "description",
        content:
          "What interior design and remodelling really costs in the US — room-by-room guides, designer fee models and state-by-state ranges, plus a free budget estimator.",
      },
      { property: "og:title", content: "Interior Design Cost Guides & Estimator | Intearior" },
      { property: "og:description", content: "Room-by-room and state-by-state interior design cost guides, plus a free estimator." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/cost-estimator" }],
  }),
  component: CostHub,
});

function CostHub() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">Cost guides</p>
      <h1 className="mt-3 font-display text-4xl md:text-6xl">What interior design actually costs.</h1>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
        Straight answers on room budgets, designer fees and regional differences — plus an estimator that
        gives you a range for your own project in under a minute.
      </p>

      <div className="mt-10">
        <BudgetEstimator />
      </div>

      <section className="mt-16">
        <h2 className="font-display text-3xl">Guides by project</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {COST_TOPICS.map((t) => (
            <Link
              key={t.slug} to="/cost-estimator/$slug" params={{ slug: t.slug }}
              className="border border-border bg-card p-5 transition hover:border-brand"
            >
              <h3 className="font-display text-xl">{t.h1}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl">Costs by state</h2>
        <p className="mt-2 text-muted-foreground">
          Labour rates and trade availability shift budgets significantly. Pick your state for a local range
          and the studios we list there.
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
          {US_STATES.map((s) => (
            <li key={s.code}>
              <Link to="/cost-estimator/state/$state" params={{ state: s.slug }} className="hover:text-brand">
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
