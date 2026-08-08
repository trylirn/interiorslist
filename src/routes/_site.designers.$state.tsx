import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getStateSummary } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { placeImage } from "@/lib/style-images";

const stateQuery = (state: string) =>
  queryOptions({
    queryKey: ["state", state.toLowerCase()],
    queryFn: () => getStateSummary({ data: { state } }),
    staleTime: 10 * 60 * 1000,
  });

export const Route = createFileRoute("/_site/designers/$state")({
  beforeLoad: ({ params }) => {
    if (!/^[a-zA-Z]{2}$/.test(params.state)) throw notFound();
  },
  head: ({ params }) => {
    const st = params.state.toUpperCase();
    const path = `/designers/${params.state.toLowerCase()}`;
    const title = `Interior Designers in ${st} — Browse by City | Intearior`;
    const description = `Find vetted interior design studios across ${st}. Browse by city, compare portfolios and request a consultation.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: `Interior Designers in ${st}` },
        { property: "og:description", content: description },
        { property: "og:url", content: path },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: path }],
    };
  },
  loader: async ({ params, context }) => {
    const s = await context.queryClient.ensureQueryData(stateQuery(params.state));
    if (!s.total) throw notFound();
  },
  component: StatePage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-3xl">State not found</h1>
      <p className="mt-3"><Link to="/search" className="text-brand underline">Browse all studios</Link></p>
    </div>
  ),
});

function StatePage() {
  const { state } = Route.useParams();
  const { data } = useSuspenseQuery(stateQuery(state));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/" className="hover:text-brand">Home</Link> / <span className="text-foreground">{data.name}</span>
      </nav>

      <div className="relative mt-3 overflow-hidden rounded-3xl">
        <img
          src={placeImage(`state-${data.code}`)}
          alt={`Interior design work in ${data.name}`}
          width={1600}
          height={912}
          loading="lazy"
          className="h-56 w-full object-cover md:h-72"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
          <h1 className="font-display text-4xl text-white md:text-5xl">Interior Designers in {data.name}</h1>
          <p className="mt-2 text-sm text-white/85">{data.total} studios across {data.cities.length} cities</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Browse by city</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.cities.map((c) => (
            <Link
              key={c.slug}
              to="/designers/$state/$city"
              params={{ state: state.toLowerCase(), city: c.slug }}
              className="rounded-full border border-border bg-card px-4 py-1.5 text-sm hover:border-brand"
            >
              {c.name} <span className="text-muted-foreground">({c.count})</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Featured studios in {data.name}</h2>
        <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(data.providers as Array<Record<string, unknown>>).map((p) => (
            <ProviderCard key={String(p.place_id)} {...(p as unknown as React.ComponentProps<typeof ProviderCard>)} />
          ))}
        </div>
        <div className="mt-8">
          <Link to="/search" search={{ state: data.code } as never} className="rounded-full bg-brand px-6 py-3 text-sm text-brand-foreground">
            See all {data.total} studios in {data.name}
          </Link>
        </div>
      </section>
    </div>
  );
}
