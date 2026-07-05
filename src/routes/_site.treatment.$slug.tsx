import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SERVICES, TEXAS_CITIES, cityFromSlug } from "@/lib/cities";
import { listByTreatment, listCitiesForTreatment } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { getTreatmentContent } from "@/lib/treatment-content";
import { z } from "zod";

const searchSchema = z.object({ city: z.string().optional() });

export const Route = createFileRoute("/_site/treatment/$slug")({
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
    const path = cityParam ? `/treatment/${params.slug}?city=${cityParam}` : `/treatment/${params.slug}`;
    const canonical = `https://texas-beauty-glow.lovable.app${path}`;
    const content = getTreatmentContent(params.slug, name);
    const title = city
      ? `${name} in ${city.name}, TX — Cost, Recovery & Top Medspas`
      : `${name} in Texas — What It Is, Cost, Recovery & Top Medspas`;
    const description = city
      ? `${name} in ${city.name}, TX: what it is, benefits, risks, recovery, and average cost. Compare verified ${name.toLowerCase()} providers in ${city.name}.`
      : `Everything about ${name} in Texas: what it is, benefits, risks, recovery, average cost, and top verified providers.`;
    const keywords = city
      ? `${name} ${city.name}, ${name} near me ${city.name}, best ${name.toLowerCase()} ${city.name} TX, ${city.name} medspa ${name.toLowerCase()}, ${name.toLowerCase()} cost ${city.name}`
      : `${name} Texas, ${name} near me, best ${name.toLowerCase()} TX, ${name.toLowerCase()} cost Texas, ${name.toLowerCase()} recovery`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: keywords },
        { name: "geo.region", content: "US-TX" },
        ...(city ? [{ name: "geo.placename", content: `${city.name}, Texas` }] : []),
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalProcedure",
            name,
            description: content.what,
            howPerformed: content.what,
            preparation: content.candidate,
            followup: content.recovery,
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
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            url: canonical,
            about: { "@type": "MedicalProcedure", name },
            ...(city ? { spatialCoverage: { "@type": "City", name: city.name, containedInPlace: { "@type": "State", name: "Texas" } } } : {}),
          }),
        },
      ],
    };
  },
  loader: async ({ params, deps, context }) => {
    const [result, cities] = await Promise.all([
      context.queryClient.ensureQueryData(
        queryOptions({
          queryKey: ["treatment", params.slug, deps],
          queryFn: () => listByTreatment({ data: { service: params.slug, city: deps.city } }),
        }),
      ),
      context.queryClient.ensureQueryData(
        queryOptions({
          queryKey: ["treatment-cities", params.slug],
          queryFn: () => listCitiesForTreatment({ data: { service: params.slug } }),
        }),
      ),
    ]);
    return { ...result, cities: cities.cities, citySlug: deps.city };
  },
  component: TreatmentPage,
});

function TreatmentPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const svc = SERVICES.find((s) => s.slug === slug)!;
  const city = search.city ? cityFromSlug(search.city) : undefined;
  const content = getTreatmentContent(slug, svc.name);
  const { data } = useSuspenseQuery(
    queryOptions({
      queryKey: ["treatment", slug, search],
      queryFn: () => listByTreatment({ data: { service: slug, city: search.city } }),
    }),
  );
  const { data: citiesData } = useSuspenseQuery(
    queryOptions({
      queryKey: ["treatment-cities", slug],
      queryFn: () => listCitiesForTreatment({ data: { service: slug } }),
    }),
  );

  const providersShown = data.providers.slice(0, 6);
  const siblingTreatments = SERVICES.filter((s) => s.slug !== slug).slice(0, 8);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/" className="hover:text-brand">Home</Link> / Treatments / <span className="text-foreground">{svc.name}{city ? ` in ${city.name}` : ""}</span>
      </nav>

      <h1 className="mt-2 font-display text-4xl md:text-5xl">
        {svc.name} {city ? `in ${city.name}, TX` : "in Texas"}
      </h1>
      <p className="mt-3 max-w-3xl text-lg text-foreground/85 leading-relaxed">{content.what}</p>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl">Benefits</h2>
          <ul className="mt-3 space-y-2 text-sm text-foreground/85 list-disc pl-5">
            {content.benefits.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl">Risks & side effects</h2>
          <ul className="mt-3 space-y-2 text-sm text-foreground/85 list-disc pl-5">
            {content.risks.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl">Recovery</h2>
          <p className="mt-3 text-sm text-foreground/85 leading-relaxed">{content.recovery}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl">Average cost</h2>
          <p className="mt-3 text-sm text-foreground/85 leading-relaxed">{content.avgCost}</p>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-secondary/30 p-6">
        <h2 className="font-display text-2xl">Who is a good candidate?</h2>
        <p className="mt-3 text-sm text-foreground/85 leading-relaxed">{content.candidate}</p>
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

      {/* Providers */}
      <section className="mt-14 border-t border-border/60 pt-10">
        <h2 className="font-display text-3xl md:text-4xl">
          Find med spas offering {svc.name} {city ? `in ${city.name}, TX` : "near you"}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {data.providers.length} verified {city ? `${city.name}` : "Texas"} provider{data.providers.length === 1 ? "" : "s"}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/treatment/$slug" params={{ slug }} className={`rounded-full border px-3 py-1 text-sm ${!search.city ? "border-brand bg-brand text-brand-foreground" : "border-border"}`}>All Texas</Link>
          {TEXAS_CITIES.map((c) => (
            <Link key={c.slug} to="/treatment/$slug" params={{ slug }} search={{ city: c.slug } as never} className={`rounded-full border px-3 py-1 text-sm ${search.city === c.slug ? "border-brand bg-brand text-brand-foreground" : "border-border hover:border-brand"}`}>{c.name}</Link>
          ))}
        </div>

        {providersShown.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">No verified providers listed yet{city ? ` in ${city.name}` : ""}.</p>
        ) : (
          <>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {providersShown.map((p) => <ProviderCard key={p.place_id} {...p} />)}
            </div>
            {data.providers.length > providersShown.length && (
              <p className="mt-6 text-center">
                <Link to="/search" search={{ service: slug, ...(search.city ? { city: search.city } : {}) } as never} className="text-sm font-medium text-brand hover:underline">
                  See all {data.providers.length} providers →
                </Link>
              </p>
            )}
          </>
        )}
      </section>

      {/* Interlinks */}
      {citiesData.cities.length > 0 && (
        <section className="mt-12 rounded-2xl border border-border bg-secondary/30 p-6">
          <h2 className="font-display text-2xl">{svc.name} is also offered in</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {citiesData.cities.slice(0, 12).map((c) => (
              <Link key={c.slug} to="/treatment/$slug" params={{ slug }} search={{ city: c.slug } as never} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-brand">
                {svc.name} in {c.name} <span className="text-muted-foreground">({c.count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Related treatments</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {siblingTreatments.map((s) => (
            <Link key={s.slug} to="/treatment/$slug" params={{ slug: s.slug }} className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-sm hover:border-brand">
              {s.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
