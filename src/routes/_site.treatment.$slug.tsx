import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SERVICES, TEXAS_CITIES, cityFromSlug } from "@/lib/cities";
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
  head: ({ params, loaderData }) => {
    const svc = SERVICES.find((s) => s.slug === params.slug);
    const name = svc?.name ?? params.slug;
    const cityParam = (loaderData as { citySlug?: string } | undefined)?.citySlug;
    const city = cityParam ? cityFromSlug(cityParam) : undefined;
    const path = cityParam ? `/treatment/${params.slug}?city=${cityParam}` : `/treatment/${params.slug}`;
    const canonical = `https://texas-beauty-glow.lovable.app${path}`;
    const title = city
      ? `${name} in ${city.name}, TX — Verified Injectors & Medspas Near You`
      : `${name} in Texas — Verified Injectors & Medspas`;
    const description = city
      ? `Compare verified ${name} providers in ${city.name}, Texas. Real reviews, pricing guidance, and contact info for ${name.toLowerCase()} near you.`
      : `Compare verified ${name} providers across Texas. Real patient reviews and contact info for ${name.toLowerCase()} in every major metro.`;
    const keywords = city
      ? `${name} ${city.name}, ${name} near me ${city.name}, best ${name.toLowerCase()} ${city.name} TX, ${city.name} medspa ${name.toLowerCase()}`
      : `${name} Texas, ${name} near me, best ${name.toLowerCase()} TX`;
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
    const result = await context.queryClient.ensureQueryData(
      queryOptions({
        queryKey: ["treatment", params.slug, deps],
        queryFn: () => listByTreatment({ data: { service: params.slug, city: deps.city } }),
      }),
    );
    return { ...result, citySlug: deps.city };
  },
  component: TreatmentPage,
});

function TreatmentPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const svc = SERVICES.find((s) => s.slug === slug)!;
  const city = search.city ? cityFromSlug(search.city) : undefined;
  const { data } = useSuspenseQuery(
    queryOptions({
      queryKey: ["treatment", slug, search],
      queryFn: () => listByTreatment({ data: { service: slug, city: search.city } }),
    }),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <p className="text-sm text-muted-foreground">Treatments{city ? ` / ${city.name}` : ""}</p>
      <h1 className="mt-1 font-display text-4xl md:text-5xl">
        {svc.name} {city ? `in ${city.name}, TX` : "in Texas"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {data.providers.length} verified {city ? `${city.name}` : "Texas"} providers
      </p>

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

