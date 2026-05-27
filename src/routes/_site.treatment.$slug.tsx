import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SERVICES, TEXAS_CITIES } from "@/lib/cities";
import { listByTreatment } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { z } from "zod";

const searchSchema = z.object({ city: z.string().optional() });

export const Route = createFileRoute("/_site/treatment/$slug")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  beforeLoad: ({ params }) => {
    if (!SERVICES.find((s) => s.slug === params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const svc = SERVICES.find((s) => s.slug === params.slug);
    const name = svc?.name ?? params.slug;
    const path = `/treatment/${params.slug}`;
    return {
      meta: [
        { title: `${name} Providers in Texas | Texas Aesthetics` },
        { name: "description", content: `Find verified ${name} providers across every major Texas metro.` },
        { property: "og:title", content: `${name} in Texas` },
        { property: "og:description", content: `Verified ${name} providers across Texas.` },
        { property: "og:url", content: path },
      ],
      links: [{ rel: "canonical", href: path }],
    };
  },
  loader: ({ params, deps, context }) =>
    context.queryClient.ensureQueryData(
      queryOptions({
        queryKey: ["treatment", params.slug, deps],
        queryFn: () => listByTreatment({ data: { service: params.slug, city: deps.city } }),
      }),
    ),
  component: TreatmentPage,
});

function TreatmentPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const svc = SERVICES.find((s) => s.slug === slug)!;
  const { data } = useSuspenseQuery(
    queryOptions({
      queryKey: ["treatment", slug, search],
      queryFn: () => listByTreatment({ data: { service: slug, city: search.city } }),
    }),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <p className="text-sm text-muted-foreground">Treatments</p>
      <h1 className="mt-1 font-display text-4xl md:text-5xl">{svc.name} in Texas</h1>
      <p className="mt-2 text-muted-foreground">{data.providers.length} verified providers</p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link to="/treatment/$slug" params={{ slug }} className={`rounded-full border px-3 py-1 text-sm ${!search.city ? "border-brand bg-brand text-brand-foreground" : "border-border"}`}>All cities</Link>
        {TEXAS_CITIES.map((c) => (
          <Link key={c.slug} to="/treatment/$slug" params={{ slug }} search={{ city: c.slug } as never} className={`rounded-full border px-3 py-1 text-sm ${search.city === c.slug ? "border-brand bg-brand text-brand-foreground" : "border-border hover:border-brand"}`}>{c.name}</Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.providers.map((p) => <ProviderCard key={p.place_id} {...p} />)}
      </div>
    </div>
  );
}
