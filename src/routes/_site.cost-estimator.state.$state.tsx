import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BudgetEstimator } from "@/components/tools/budget-estimator";
import { Button } from "@/components/ui/button";
import { COST_TOPICS } from "@/lib/cost-content";
import { ROOMS, SCOPES, estimate, moneyExact, stateFromSlug } from "@/lib/cost-model";
import { getCostContext } from "@/lib/cost.functions";

export const Route = createFileRoute("/_site/cost-estimator/state/$state")({
  loader: ({ params }) => {
    const st = stateFromSlug(params.state);
    if (!st) throw notFound();
    return { st };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "State not found | Intearior" }, { name: "robots", content: "noindex" }] };
    }
    const { st } = loaderData;
    const title = `Interior Design & Remodel Costs in ${st.name} | Intearior`;
    const description = `What interior design and remodelling costs in ${st.name} — typical kitchen, bathroom and whole-home ranges, plus the design studios we list across the state.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: `/cost-estimator/state/${st.slug}` }],
    };
  },
  notFoundComponent: StateNotFound,
  component: StateCostPage,
});

function StateNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24">
      <h1 className="font-display text-3xl">We don't have a cost page for that state.</h1>
      <Button asChild className="mt-6 rounded-none"><Link to="/cost-estimator">All cost guides</Link></Button>
    </div>
  );
}

const SNAPSHOT: { room: (typeof ROOMS)[number]["slug"]; scope: (typeof SCOPES)[number]["slug"] }[] = [
  { room: "kitchen", scope: "remodel" },
  { room: "bathroom", scope: "remodel" },
  { room: "living-room", scope: "refresh" },
  { room: "primary-suite", scope: "refresh" },
  { room: "whole-home", scope: "remodel" },
];

function StateCostPage() {
  const { st } = Route.useLoaderData();
  const { data: ctx } = useQuery({
    queryKey: ["cost-context", st.code],
    queryFn: () => getCostContext({ data: { state: st.code } }),
    staleTime: 30 * 60 * 1000,
  });

  const pct = Math.round(st.index * 100);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">
        <Link to="/cost-estimator" className="hover:underline">Cost guides</Link>
      </p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">
        Interior design costs in {st.name}
      </h1>
      <p className="mt-5 text-lg text-muted-foreground">
        {st.name} runs at roughly {pct}% of the US average for design and remodelling work
        {pct > 103 ? " — labour and trade availability push budgets up here." : pct < 97 ? " — labour rates keep budgets below the national norm." : ", close to the national norm."}
        {ctx ? ` We list ${ctx.studioCount.toLocaleString()} published studios across ${ctx.citiesCovered} ${st.name} cities.` : ""}
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Typical ranges in {st.name}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="py-2">Project</th>
                <th className="py-2">Typical size</th>
                <th className="py-2">Range</th>
              </tr>
            </thead>
            <tbody>
              {SNAPSHOT.map((s) => {
                const room = ROOMS.find((r) => r.slug === s.room)!;
                const e = estimate({ room: s.room, sqft: room.typicalSqFt, scope: s.scope, stateCode: st.code });
                return (
                  <tr key={`${s.room}-${s.scope}`} className="border-b border-border/60">
                    <td className="py-3">
                      {room.label} — {SCOPES.find((x) => x.slug === s.scope)!.label.toLowerCase()}
                    </td>
                    <td className="py-3 text-muted-foreground">{room.typicalSqFt} sq ft</td>
                    <td className="py-3 tabular-nums">{moneyExact(e.low)} – {moneyExact(e.high)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Estimates, not quotes — built from typical published US ranges adjusted for {st.name} costs.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl">Estimate your own project</h2>
        <div className="mt-4">
          <BudgetEstimator defaultState={st.code} />
        </div>
      </section>

      {ctx && ctx.topCities.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl">Studios across {st.name}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {ctx.topCities.map((c) => (
              <li key={c.slug}>
                <Link
                  to="/designers/$state/$city"
                  params={{ state: st.code.toLowerCase(), city: c.slug }}
                  className="hover:text-brand"
                >
                  {c.name} <span className="text-muted-foreground/70">({c.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-14 border border-border bg-secondary/30 p-6">
        <h2 className="font-display text-2xl">Get quotes from {st.name} studios</h2>
        <p className="mt-2 text-muted-foreground">
          Answer a few questions and we'll match you with up to three studios that work on projects like yours.
        </p>
        <Button asChild className="mt-4 rounded-none"><Link to="/match">Get matched</Link></Button>
      </div>

      <section className="mt-14">
        <h2 className="font-display text-2xl">Cost guides by project</h2>
        <ul className="mt-4 space-y-2">
          {COST_TOPICS.slice(0, 5).map((t) => (
            <li key={t.slug}>
              <Link to="/cost-estimator/$slug" params={{ slug: t.slug }} className="hover:text-brand">
                {t.h1}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
