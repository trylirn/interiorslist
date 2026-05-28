import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { cityFromSlug, TEXAS_CITIES } from "@/lib/cities";
import { listProvidersByCity } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/_site/best/$city")({
  beforeLoad: ({ params }) => {
    if (!cityFromSlug(params.city)) throw notFound();
  },
  head: ({ params }) => {
    const c = cityFromSlug(params.city);
    const name = c?.name ?? params.city;
    const path = `/best/${params.city}`;
    return {
      meta: [
        { title: `Best Medspas & Aesthetic Injectors in ${name}, TX (${new Date().getFullYear()}) | Texas Aesthetics` },
        { name: "description", content: `The top verified Botox, filler, and medspa providers in ${name}, Texas — curated, reviewed, and ranked.` },
        { property: "og:title", content: `Best Medspas in ${name}, TX` },
        { property: "og:description", content: `Top verified aesthetic injectors in ${name}.` },
        { property: "og:url", content: path },
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
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:underline">Texas</Link> / Best in {c.name}</p>
      <div className="mt-2 flex items-center gap-3">
        <Trophy className="h-8 w-8 text-brand" />
        <h1 className="font-display text-4xl md:text-5xl">Best Medspas in {c.name}, TX</h1>
      </div>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        The top {Math.min(10, data.providers.length)} verified aesthetic injectors and medspas in {c.name}, hand-curated for {new Date().getFullYear()}. {c.tagline}.
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
        <h2 className="font-display text-2xl">Other top Texas cities</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {TEXAS_CITIES.filter((x) => x.slug !== city).map((x) => (
            <Link key={x.slug} to="/best/$city" params={{ city: x.slug }} className="rounded-full border border-border bg-card px-4 py-1.5 text-sm hover:border-brand">
              Best in {x.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
