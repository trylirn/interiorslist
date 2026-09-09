import { createFileRoute, Link } from "@tanstack/react-router";
import { BudgetEstimator } from "@/components/tools/budget-estimator";
import { COST_TOPICS } from "@/lib/cost-content";

export const Route = createFileRoute("/_site/tools/budget-estimator")({
  head: () => ({
    meta: [
      { title: "Interior Design Budget Estimator | Intearior" },
      {
        name: "description",
        content:
          "Estimate an interior design or remodel budget by room, size, scope, finish level and state — with a breakdown of design fees, furniture, materials and labour.",
      },
      { property: "og:title", content: "Interior Design Budget Estimator | Intearior" },
      { property: "og:description", content: "Get a realistic cost range for your project in under a minute." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/tools/budget-estimator" }],
  }),
  component: EstimatorPage,
});

function EstimatorPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">
        <Link to="/tools" className="hover:underline">Free tools</Link>
      </p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">Budget Estimator</h1>
      <p className="mt-4 text-muted-foreground">
        Tell us the room, roughly how big it is, how much work it needs and where you are. You'll get a
        realistic range and a breakdown of where the money goes. It's an estimate, not a quote.
      </p>

      <div className="mt-10">
        <BudgetEstimator />
      </div>

      <section className="mt-16">
        <h2 className="font-display text-2xl">Cost guides</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {COST_TOPICS.map((t) => (
            <li key={t.slug}>
              <Link to="/cost-estimator/$slug" params={{ slug: t.slug }} className="text-sm hover:text-brand">
                {t.h1}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
