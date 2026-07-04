import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { cityFromSlug, SERVICES, CITY_GEO, CITY_INTRO, CITY_NEIGHBORS } from "@/lib/cities";
import { listProvidersByCity } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { z } from "zod";

const searchSchema = z.object({
  service: z.string().optional(),
  sort: z.enum(["name", "verified"]).optional(),
});

export const Route = createFileRoute("/_site/tx/$city")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  beforeLoad: ({ params }) => {
    if (!cityFromSlug(params.city)) throw notFound();
  },
  head: ({ params }) => {
    const c = cityFromSlug(params.city);
    const name = c?.name ?? params.city;
    const path = `/tx/${params.city}`;
    const canonical = `https://texas-beauty-glow.lovable.app${path}`;
    const geo = CITY_GEO[params.city];
    const intro = CITY_INTRO[params.city] ?? `Verified aesthetic injectors in ${name}, TX.`;
    const title = `${name}, TX Aesthetic Injectors & Medspas | Botox, Filler Near You`;
    const description = `Find the best Botox, dermal filler, and medspa injectors in ${name}, Texas. ${intro} Real patient reviews and verified providers — no paid placement.`;
    const keywords = [
      `${name} medspa`, `medspa ${name} TX`, `medspa near me ${name}`,
      `botox ${name}`, `filler ${name}`, `lip filler ${name} TX`,
      `best injector ${name}`, `aesthetic injector ${name} Texas`,
      `${name} skin clinic`, `laser hair removal ${name}`,
    ].join(", ");
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: keywords },
      { name: "geo.region", content: "US-TX" },
      { name: "geo.placename", content: `${name}, Texas` },
      { property: "og:title", content: `${name} Aesthetic Injectors & Medspas` },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
    ];
    if (geo) {
      meta.push({ name: "geo.position", content: `${geo.lat};${geo.lng}` });
      meta.push({ name: "ICBM", content: `${geo.lat}, ${geo.lng}` });
      meta.push({ property: "place:location:latitude", content: String(geo.lat) });
      meta.push({ property: "place:location:longitude", content: String(geo.lng) });
    }
    const collectionLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `Aesthetic Injectors & Medspas in ${name}, TX`,
      url: canonical,
      about: { "@type": "City", name, containedInPlace: { "@type": "State", name: "Texas" } },
      isPartOf: { "@type": "WebSite", name: "Texas Aesthetics", url: "https://texas-beauty-glow.lovable.app/" },
    };
    if (geo) collectionLd.geo = { "@type": "GeoCoordinates", latitude: geo.lat, longitude: geo.lng };
    return {
      meta,
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(collectionLd) },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://texas-beauty-glow.lovable.app/" },
              { "@type": "ListItem", position: 2, name: "Texas", item: "https://texas-beauty-glow.lovable.app/" },
              { "@type": "ListItem", position: 3, name: `${name}, TX`, item: canonical },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              { "@type": "Question", name: `How much does Botox cost in ${name}, TX?`,
                acceptedAnswer: { "@type": "Answer", text: `Botox in ${name}, Texas typically ranges $12–$18 per unit depending on the injector's experience and clinic. Compare local providers above for pricing details.` } },
              { "@type": "Question", name: `Are medspas in ${name} licensed?`,
                acceptedAnswer: { "@type": "Answer", text: `Reputable medspas in ${name}, TX operate under a licensed Medical Director. Every listing on Texas Aesthetics can be cross-checked with the Texas Medical Board and Texas Board of Nursing.` } },
              { "@type": "Question", name: `Where can I find the best filler injector near me in ${name}?`,
                acceptedAnswer: { "@type": "Answer", text: `Browse verified filler and Botox injectors in ${name}, TX on this page. Each provider profile lists services, reviews, and contact details.` } },
            ],
          }),
        },
      ],
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
});


function CityPage() {
  const { city } = Route.useParams();
  const search = Route.useSearch();
  const c = cityFromSlug(city)!;
  const { data } = useSuspenseQuery(
    queryOptions({
      queryKey: ["city", city, search],
      queryFn: () => listProvidersByCity({ data: { citySlug: city, service: search.service, sort: search.sort } }),
    }),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Texas / {c.name}</p>
        <h1 className="mt-1 font-display text-4xl md:text-5xl">Aesthetic Injectors in {c.name}</h1>
        <p className="mt-2 text-muted-foreground">{data.providers.length} verified providers • {c.tagline}</p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link to="/tx/$city" params={{ city }} className={`rounded-full border px-3 py-1 text-sm ${!search.service ? "border-brand bg-brand text-brand-foreground" : "border-border"}`}>All services</Link>
        {SERVICES.map((s) => (
          <Link key={s.slug} to="/tx/$city" params={{ city }} search={{ ...search, service: s.slug } as never} className={`rounded-full border px-3 py-1 text-sm ${search.service === s.slug ? "border-brand bg-brand text-brand-foreground" : "border-border hover:border-brand"}`}>{s.name}</Link>
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
    </div>
  );
}
