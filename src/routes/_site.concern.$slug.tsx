import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { CONCERNS, concernFromSlug, SERVICES } from "@/lib/cities";
import { CONCERN_TREATMENTS } from "@/lib/match.functions";
import { listByTreatment } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";

const concernProvidersOpts = (slug: string) =>
  queryOptions({
    queryKey: ["concern-providers", slug],
    queryFn: async () => {
      const treatments = CONCERN_TREATMENTS[slug] ?? [];
      const lists = await Promise.all(treatments.slice(0, 4).map((t) => listByTreatment({ data: { service: t } })));
      const seen = new Set<string>();
      const merged: Array<Awaited<ReturnType<typeof listByTreatment>>["providers"][number]> = [];
      for (const r of lists) for (const p of r.providers) { if (seen.has(p.place_id)) continue; seen.add(p.place_id); merged.push(p); }
      return { providers: merged.slice(0, 12) };
    },
  });

export const Route = createFileRoute("/_site/concern/$slug")({
  head: ({ params }) => {
    const c = concernFromSlug(params.slug);
    if (!c) return { meta: [{ title: "Concern not found" }] };
    return {
      meta: [
        { title: `${c.label} — Texas Medspas | Texas Aesthetics` },
        { name: "description", content: c.intro },
        { property: "og:title", content: `${c.label} in Texas` },
        { property: "og:description", content: c.intro },
      ],
      links: [{ rel: "canonical", href: `/concern/${c.slug}` }],
    };
  },
  loader: ({ context, params }) => {
    if (!concernFromSlug(params.slug)) throw notFound();
    context.queryClient.ensureQueryData(concernProvidersOpts(params.slug));
  },
  component: ConcernPage,
  notFoundComponent: () => <div className="mx-auto max-w-md py-24 text-center px-4"><h1 className="font-display text-3xl">Concern not found</h1></div>,
});

function ConcernPage() {
  const { slug } = Route.useParams();
  const concern = concernFromSlug(slug)!;
  const { data } = useSuspenseQuery(concernProvidersOpts(slug));
  const treatments = CONCERN_TREATMENTS[slug] ?? [];
  const treatmentNames = treatments.map((t) => SERVICES.find((s) => s.slug === t)).filter(Boolean) as { slug: string; name: string }[];

  return (
    <>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">Concern</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">{concern.label}</h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{concern.intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="font-display text-2xl">Recommended treatments</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {treatmentNames.map((t) => (
            <Link key={t.slug} to="/treatment/$slug" params={{ slug: t.slug }} className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium hover:border-brand hover:text-brand">
              {t.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <h2 className="font-display text-2xl">Top Texas providers</h2>
        {data.providers.length === 0 ? (
          <p className="mt-6 text-muted-foreground">No verified providers yet for this concern.</p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.providers.map((p) => <ProviderCard key={p.place_id} {...p} />)}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24">
        <h3 className="font-display text-xl">Explore other concerns</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {CONCERNS.filter((c) => c.slug !== slug).map((c) => (
            <Link key={c.slug} to="/concern/$slug" params={{ slug: c.slug }} className="rounded-full border border-border px-4 py-2 text-sm hover:border-brand hover:text-brand">
              {c.label}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
