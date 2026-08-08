import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SERVICES } from "@/lib/cities";
import { getCitySummary, listProvidersByCity } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { placeImage } from "@/lib/style-images";
import { z } from "zod";

const searchSchema = z.object({
  service: z.string().optional(),
  sort: z.enum(["name", "verified"]).optional(),
});

const cityQuery = (citySlug: string) =>
  queryOptions({
    queryKey: ["city-summary", citySlug],
    queryFn: () => getCitySummary({ data: { citySlug } }),
    staleTime: 10 * 60 * 1000,
  });

const listQuery = (citySlug: string, deps: z.infer<typeof searchSchema>) =>
  queryOptions({
    queryKey: ["city", citySlug, deps],
    queryFn: () => listProvidersByCity({ data: { citySlug, service: deps.service, sort: deps.sort } }),
  });

function titleCase(slug: string) {
  return slug.replace(/-[a-z]{2}$/, "").split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export const Route = createFileRoute("/_site/designers/$state/$city")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  head: ({ params }) => {
    const name = titleCase(params.city);
    const st = params.state.toUpperCase();
    const path = `/designers/${params.state}/${params.city}`;
    const title = `Interior Designers in ${name}, ${st} | Intearior`;
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
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description,
            url: `https://interiorslist.lovable.app${path}`,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://interiorslist.lovable.app/" },
              { "@type": "ListItem", position: 2, name: st, item: `https://interiorslist.lovable.app/designers/${params.state}` },
              { "@type": "ListItem", position: 3, name: `${name}, ${st}`, item: `https://interiorslist.lovable.app${path}` },
            ],
          }),
        },
      ],
    };
  },
  loader: async ({ params, deps, context }) => {
    const summary = await context.queryClient.ensureQueryData(cityQuery(params.city));
    if (!summary.city) throw notFound();
    await context.queryClient.ensureQueryData(listQuery(params.city, deps));
  },
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
  const { data: summary } = useSuspenseQuery(cityQuery(city));
  const { data } = useSuspenseQuery(listQuery(city, search));
  const c = summary.city!;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/" className="hover:text-brand">Home</Link> /{" "}
        <Link to="/designers/$state" params={{ state }} className="hover:text-brand">{c.stateName}</Link> /{" "}
        <span className="text-foreground">{c.name}</span>
      </nav>

      <div className="relative mt-3 overflow-hidden rounded-3xl">
        <img
          src={placeImage(c.slug)}
          alt={`Interior design project in ${c.name}, ${c.state}`}
          width={1600}
          height={912}
          loading="lazy"
          className="h-56 w-full object-cover md:h-72"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
          <h1 className="font-display text-4xl text-white md:text-5xl">Interior Designers in {c.name}, {c.state}</h1>
          <p className="mt-2 text-sm text-white/85">{data.providers.length} vetted studios in {c.name}</p>
        </div>
      </div>

      <p className="mb-8 mt-4 max-w-3xl text-foreground/85">
        Browse interior design studios working across {c.name} and the wider {c.stateName} area — from full-home
        projects and kitchen renovations to furnishing, styling and e-design. Compare portfolios, then send an
        enquiry to the studios that fit your project.
      </p>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link to="/designers/$state/$city" params={{ state, city }} className={`rounded-full border px-3 py-1 text-sm ${!search.service ? "border-brand bg-brand text-brand-foreground" : "border-border"}`}>All services</Link>
        {SERVICES.map((s) => (
          <Link key={s.slug} to="/designers/$state/$city" params={{ state, city }} search={{ ...search, service: s.slug } as never} className={`rounded-full border px-3 py-1 text-sm ${search.service === s.slug ? "border-brand bg-brand text-brand-foreground" : "border-border hover:border-brand"}`}>{s.name}</Link>
        ))}
      </div>

      {data.providers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="font-display text-2xl">No listings yet for that filter in {c.name}</p>
          <p className="mt-2 text-muted-foreground">Try another service, or <Link to="/designers/$state" params={{ state }} className="text-brand underline">browse all of {c.stateName}</Link>.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.providers.map((p) => <ProviderCard key={p.place_id} {...p} />)}
        </div>
      )}

      <section className="mt-14 rounded-3xl border border-border bg-secondary/30 p-6 md:p-8">
        <h2 className="font-display text-2xl">Popular services in {c.name}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {SERVICES.slice(0, 6).map((s) => (
            <Link key={s.slug} to="/service/$slug" params={{ slug: s.slug }} search={{ city } as never}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-brand">
              {s.name} in {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
        <h2 className="font-display text-2xl">Frequently asked</h2>
        <div className="mt-4 space-y-3 text-sm">
          <details className="rounded-xl border border-border bg-secondary/30 p-4">
            <summary className="cursor-pointer font-medium">What does an interior designer cost in {c.name}?</summary>
            <p className="mt-2 text-foreground/80">Studios in {c.name} typically charge a flat design fee, an hourly rate of roughly $100–$300, or a cost-plus percentage on furnishings. Each listing shows a typical project budget where the studio has shared one.</p>
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
