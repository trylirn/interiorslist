import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { cityFromSlug, SERVICES } from "@/lib/cities";
import { listProvidersByCity } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { z } from "zod";

const searchSchema = z.object({
  service: z.string().optional(),
  sort: z.enum(["name", "verified"]).optional(),
});

export const Route = createFileRoute("/_site/designers/$state/$city")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  beforeLoad: ({ params }) => {
    const c = cityFromSlug(params.city);
    if (!c || c.state.toLowerCase() !== params.state.toLowerCase()) throw notFound();
  },
  head: ({ params }) => {
    const c = cityFromSlug(params.city);
    const name = c?.name ?? params.city;
    const st = c?.state ?? params.state.toUpperCase();
    const path = `/designers/${params.state}/${params.city}`;
    const title = `Interior Designers in ${name}, ${st} | Interiors List`;
    const description = `Vetted interior design studios in ${name}, ${st}. Compare services, styles, typical project budgets and reviews, then request a consultation.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: `Interior Designers in ${name}, ${st}` },
        { property: "og:description", content: description },
        { property: "og:url", content: path },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: path }],
    };
  },
  loader: ({ params, deps, context }) =>
    context.queryClient.ensureQueryData(
      queryOptions({
        queryKey: ["city", params.city, deps],
        queryFn: () => listProvidersByCity({ data: { citySlug: params.city, service: deps.service, sort: deps.sort } }),
      }),
    ),
  component: CityPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-3xl">City not found</h1>
      <p className="mt-3"><Link to="/search" className="text-brand underline">Browse all studios</Link></p>
    </div>
  ),
});

function CityPage() {
  const { city, state } = Route.useParams();
  const search = Route.useSearch();
  const c = cityFromSlug(city)!;
  const { data } = useSuspenseQuery(
    queryOptions({
      queryKey: ["city", city, search],
      queryFn: () => listProvidersByCity({ data: { citySlug: city, service: search.service, sort: search.sort } }),
    }),
  );

  const topServices = SERVICES.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/" className="hover:text-brand">Home</Link> / {c.stateName} / <span className="text-foreground">{c.name}</span>
      </nav>
      <div className="mb-8 mt-2">
        <h1 className="font-display text-4xl md:text-5xl">Interior Designers in {c.name}, {c.state}</h1>
        <p className="mt-2 text-muted-foreground">{data.providers.length} vetted studios • {c.tagline}</p>
        <p className="mt-3 max-w-3xl text-foreground/85">{c.intro}</p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link to="/designers/$state/$city" params={{ state, city }} className={`rounded-full border px-3 py-1 text-sm ${!search.service ? "border-brand bg-brand text-brand-foreground" : "border-border"}`}>All services</Link>
        {SERVICES.map((s) => (
          <Link key={s.slug} to="/designers/$state/$city" params={{ state, city }} search={{ ...search, service: s.slug } as never} className={`rounded-full border px-3 py-1 text-sm ${search.service === s.slug ? "border-brand bg-brand text-brand-foreground" : "border-border hover:border-brand"}`}>{s.name}</Link>
        ))}
      </div>

      {data.providers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="font-display text-2xl">No listings yet for {c.name}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.providers.map((p) => <ProviderCard key={p.place_id} {...p} />)}
        </div>
      )}

      <section className="mt-14 rounded-3xl border border-border bg-secondary/30 p-6 md:p-8">
        <h2 className="font-display text-2xl">Popular services in {c.name}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {topServices.map((s) => (
            <Link key={s.slug} to="/service/$slug" params={{ slug: s.slug }} search={{ city } as never}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-brand">
              {s.name} in {c.name}
            </Link>
          ))}
        </div>
      </section>

      {c.neighbors.length > 0 && (
        <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
          <h2 className="font-display text-2xl">Also serving nearby</h2>
          <p className="mt-2 text-foreground/85">Studios listed here typically take projects across the greater {c.name} area, including {c.neighbors.join(", ")}.</p>
        </section>
      )}

      <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
        <h2 className="font-display text-2xl">Frequently asked</h2>
        <div className="mt-4 space-y-3 text-sm">
          <details className="rounded-xl border border-border bg-secondary/30 p-4">
            <summary className="cursor-pointer font-medium">What does an interior designer cost in {c.name}?</summary>
            <p className="mt-2 text-foreground/80">Studios in {c.name} typically charge a flat design fee, an hourly rate of roughly $100–$300, or a cost-plus percentage on furnishings. Each listing shows a typical project budget.</p>
          </details>
          <details className="rounded-xl border border-border bg-secondary/30 p-4">
            <summary className="cursor-pointer font-medium">Do I need a licensed interior designer?</summary>
            <p className="mt-2 text-foreground/80">Residential decorating generally has no licensing requirement, but many states register or license designers for commercial work. Look for NCIDQ certification and ASID or IIDA membership.</p>
          </details>
          <details className="rounded-xl border border-border bg-secondary/30 p-4">
            <summary className="cursor-pointer font-medium">How do I shortlist studios in {c.name}?</summary>
            <p className="mt-2 text-foreground/80">Filter by service above, compare portfolios and typical project budgets, then send an enquiry to two or three studios from their profile pages.</p>
          </details>
        </div>
      </section>
    </div>
  );
}
