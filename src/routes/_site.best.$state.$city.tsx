import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { cityFromSlug, CITIES } from "@/lib/cities";
import { listProvidersByCity } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/_site/best/$state/$city")({
  beforeLoad: ({ params }) => {
    const c = cityFromSlug(params.city);
    if (!c || c.state.toLowerCase() !== params.state.toLowerCase()) throw notFound();
  },
  head: ({ params }) => {
    const c = cityFromSlug(params.city);
    const name = c?.name ?? params.city;
    const st = c?.state ?? params.state.toUpperCase();
    const path = `/best/${params.state}/${params.city}`;
    const title = `Best Interior Designers in ${name}, ${st} (${new Date().getFullYear()}) | Intearior`;
    const description = `The top vetted interior design studios in ${name}, ${st} — curated, reviewed and ranked.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: `Best Interior Designers in ${name}, ${st}` },
        { property: "og:description", content: description },
        { property: "og:url", content: path },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: path }],
    };
  },
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(
      queryOptions({
        queryKey: ["best-city", params.city],
        queryFn: () => listProvidersByCity({ data: { citySlug: params.city, sort: "verified", limit: 10 } }),
      }),
    ),
  component: BestCity,
  notFoundComponent: () => <div className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="font-display text-3xl">City not found</h1></div>,
});

function BestCity() {
  const { city } = Route.useParams();
  const c = cityFromSlug(city)!;
  const { data } = useSuspenseQuery(
    queryOptions({
      queryKey: ["best-city", city],
      queryFn: () => listProvidersByCity({ data: { citySlug: city, sort: "verified", limit: 10 } }),
    }),
  );
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:underline">Home</Link> / Best in {c.name}</p>
      <div className="relative mt-3 overflow-hidden rounded-3xl">
        <img src={cityImage(`best-${c.slug}`)} alt={`Interior design work in ${c.name}, ${c.state}`} className="h-56 w-full object-cover md:h-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-6 md:p-8">
          <Trophy className="h-8 w-8 text-white" />
          <h1 className="font-display text-4xl text-white md:text-5xl">Best Interior Designers in {c.name}, {c.state}</h1>
        </div>
      </div>

      <p className="mt-3 max-w-2xl text-muted-foreground">
        The top {Math.min(10, data.providers.length)} vetted design studios in {c.name}, curated for {new Date().getFullYear()}. {c.tagline}.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.providers.map((p, idx) => (
          <div key={p.place_id} className="relative">
            <span className="absolute -left-3 -top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-brand font-display text-lg text-brand-foreground shadow-md">{idx + 1}</span>
            <ProviderCard {...p} />
          </div>
        ))}
      </div>

      <section className="mt-16 rounded-3xl bg-secondary/40 p-8">
        <h2 className="font-display text-2xl">Other top cities</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {CITIES.filter((x) => x.slug !== city).map((x) => (
            <Link key={x.slug} to="/best/$state/$city" params={{ state: x.state.toLowerCase(), city: x.slug }} className="rounded-full border border-border bg-card px-4 py-1.5 text-sm hover:border-brand">
              Best in {x.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
