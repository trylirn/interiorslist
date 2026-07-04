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

  const intro = CITY_INTRO[city];
  const neighbors = CITY_NEIGHBORS[city] ?? [];
  const topServices = SERVICES.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/" className="hover:text-brand">Home</Link> / Texas / <span className="text-foreground">{c.name}</span>
      </nav>
      <div className="mb-8 mt-2">
        <h1 className="font-display text-4xl md:text-5xl">Aesthetic Injectors & Medspas in {c.name}, TX</h1>
        <p className="mt-2 text-muted-foreground">{data.providers.length} verified providers • {c.tagline}</p>
        {intro && <p className="mt-3 max-w-3xl text-foreground/85">{intro}</p>}
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

      {/* Local-intent internal links: treatment × city permutations */}
      <section className="mt-14 rounded-3xl border border-border bg-secondary/30 p-6 md:p-8">
        <h2 className="font-display text-2xl">Popular treatments in {c.name}, TX</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {topServices.map((s) => (
            <Link key={s.slug} to="/treatment/$slug" params={{ slug: s.slug }} search={{ city } as never}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-brand">
              {s.name} in {c.name}
            </Link>
          ))}
        </div>
      </section>

      {neighbors.length > 0 && (
        <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
          <h2 className="font-display text-2xl">Serving nearby areas</h2>
          <p className="mt-2 text-foreground/85">Injectors and medspas listed on this page serve patients across the greater {c.name} area, including {neighbors.join(", ")}.</p>
        </section>
      )}

      <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
        <h2 className="font-display text-2xl">Frequently asked</h2>
        <div className="mt-4 space-y-3 text-sm">
          <details className="rounded-xl border border-border bg-secondary/30 p-4">
            <summary className="cursor-pointer font-medium">How much does Botox cost in {c.name}, TX?</summary>
            <p className="mt-2 text-foreground/80">Botox in {c.name} typically ranges $12–$18 per unit depending on the injector's experience. Compare providers above for exact pricing.</p>
          </details>
          <details className="rounded-xl border border-border bg-secondary/30 p-4">
            <summary className="cursor-pointer font-medium">Are medspas in {c.name} licensed?</summary>
            <p className="mt-2 text-foreground/80">Every reputable medspa in {c.name}, Texas operates under a licensed Medical Director. Verify licensure with the Texas Medical Board and Texas Board of Nursing.</p>
          </details>
          <details className="rounded-xl border border-border bg-secondary/30 p-4">
            <summary className="cursor-pointer font-medium">Where can I find the best filler injector near me in {c.name}?</summary>
            <p className="mt-2 text-foreground/80">Browse the verified filler and Botox injectors listed above. Each profile shows services, patient reviews, and contact details for {c.name}, TX.</p>
          </details>
        </div>
      </section>
    </div>
  );
}

