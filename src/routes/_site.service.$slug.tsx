import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SERVICES, CITIES, cityFromSlug } from "@/lib/cities";
import { listByTreatment, listCitiesForTreatment } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { getServiceContent } from "@/lib/service-content";
import { z } from "zod";

const searchSchema = z.object({ city: z.string().optional() });

export const Route = createFileRoute("/_site/service/$slug")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  beforeLoad: ({ params }) => {
    if (!SERVICES.find((s) => s.slug === params.slug)) throw notFound();
  },
  head: ({ params, loaderData }) => {
    const svc = SERVICES.find((s) => s.slug === params.slug);
    const name = svc?.name ?? params.slug;
    const cityParam = (loaderData as { citySlug?: string } | undefined)?.citySlug;
    const city = cityParam ? cityFromSlug(cityParam) : undefined;
    const path = cityParam ? `/service/${params.slug}?city=${cityParam}` : `/service/${params.slug}`;
    const content = getServiceContent(params.slug, name);
    const title = city
      ? `${name} in ${city.name}, ${city.state} — Cost, Process & Top Studios`
      : `${name} — What It Involves, Cost & Top Design Studios`;
    const description = city
      ? `${name} in ${city.name}, ${city.state}: what it involves, what it costs, and vetted interior design studios offering it.`
      : `${name}: what it involves, what it costs, how the process works, and vetted interior design studios offering it nationwide.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
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
            "@type": "Service",
            name,
            serviceType: name,
            description: content.what,
            provider: { "@type": "Organization", name: "Interiors List" },
            ...(city ? { areaServed: { "@type": "City", name: city.name } } : { areaServed: { "@type": "Country", name: "United States" } }),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: content.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        },
      ],
    };
  },
  loader: async ({ params, deps, context }) => {
    const [result, cities] = await Promise.all([
      context.queryClient.ensureQueryData(
        queryOptions({
          queryKey: ["service", params.slug, deps],
          queryFn: () => listByTreatment({ data: { service: params.slug, city: deps.city } }),
        }),
      ),
      context.queryClient.ensureQueryData(
        queryOptions({
          queryKey: ["service-cities", params.slug],
          queryFn: () => listCitiesForTreatment({ data: { service: params.slug } }),
        }),
      ),
    ]);
    return { ...result, cities: cities.cities, citySlug: deps.city };
  },
  component: ServicePage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-3xl">Service not found</h1>
      <p className="mt-3"><Link to="/search" className="text-brand underline">Browse all studios</Link></p>
    </div>
  ),
});

function ServicePage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const svc = SERVICES.find((s) => s.slug === slug)!;
  const city = search.city ? cityFromSlug(search.city) : undefined;
  const content = getServiceContent(slug, svc.name);
  const { data } = useSuspenseQuery(
    queryOptions({
      queryKey: ["service", slug, search],
      queryFn: () => listByTreatment({ data: { service: slug, city: search.city } }),
    }),
  );
  const { data: citiesData } = useSuspenseQuery(
    queryOptions({
      queryKey: ["service-cities", slug],
      queryFn: () => listCitiesForTreatment({ data: { service: slug } }),
    }),
  );

  const providersShown = data.providers.slice(0, 6);
  const siblings = SERVICES.filter((s) => s.slug !== slug).slice(0, 8);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/" className="hover:text-brand">Home</Link> / Services / <span className="text-foreground">{svc.name}{city ? ` in ${city.name}` : ""}</span>
      </nav>

      <h1 className="mt-2 font-display text-4xl md:text-5xl">
        {svc.name} {city ? `in ${city.name}, ${city.state}` : ""}
      </h1>
      <p className="mt-3 max-w-3xl text-lg text-foreground/85 leading-relaxed">{content.what}</p>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl">What you get</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-foreground/85">
            {content.benefits.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl">What to watch for</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-foreground/85">
            {content.considerations.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl">How the process works</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/85">{content.process}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl">Typical cost</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/85">{content.avgCost}</p>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-secondary/30 p-6">
        <h2 className="font-display text-2xl">Is this right for you?</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/85">{content.candidate}</p>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Frequently asked questions</h2>
        <div className="mt-4 space-y-3">
          {content.faqs.map((f) => (
            <details key={f.q} className="rounded-xl border border-border bg-secondary/20 p-4">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-sm text-foreground/80">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-14 border-t border-border/60 pt-10">
        <h2 className="font-display text-3xl md:text-4xl">
          Design studios offering {svc.name} {city ? `in ${city.name}, ${city.state}` : "near you"}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {data.providers.length} vetted studio{data.providers.length === 1 ? "" : "s"}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/service/$slug" params={{ slug }} className={`rounded-full border px-3 py-1 text-sm ${!search.city ? "border-brand bg-brand text-brand-foreground" : "border-border"}`}>All cities</Link>
          {CITIES.map((c) => (
            <Link key={c.slug} to="/service/$slug" params={{ slug }} search={{ city: c.slug } as never} className={`rounded-full border px-3 py-1 text-sm ${search.city === c.slug ? "border-brand bg-brand text-brand-foreground" : "border-border hover:border-brand"}`}>{c.name}</Link>
          ))}
        </div>

        {providersShown.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">No studios listed yet{city ? ` in ${city.name}` : ""}.</p>
        ) : (
          <>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {providersShown.map((p) => <ProviderCard key={p.place_id} {...p} />)}
            </div>
            {data.providers.length > providersShown.length && (
              <p className="mt-6 text-center">
                <Link to="/search" search={{ service: slug, ...(search.city ? { city: search.city } : {}) } as never} className="text-sm font-medium text-brand hover:underline">
                  See all {data.providers.length} studios →
                </Link>
              </p>
            )}
          </>
        )}
      </section>

      {citiesData.cities.length > 0 && (
        <section className="mt-12 rounded-2xl border border-border bg-secondary/30 p-6">
          <h2 className="font-display text-2xl">{svc.name} is also offered in</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {citiesData.cities.slice(0, 12).map((c) => (
              <Link key={c.slug} to="/service/$slug" params={{ slug }} search={{ city: c.slug } as never} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-brand">
                {svc.name} in {c.name} <span className="text-muted-foreground">({c.count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Related services</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {siblings.map((s) => (
            <Link key={s.slug} to="/service/$slug" params={{ slug: s.slug }} className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-sm hover:border-brand">
              {s.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
