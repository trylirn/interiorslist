import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { cityFromSlug, SERVICES } from "@/lib/cities";
import { listProvidersByCity } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { z } from "zod";

const searchSchema = z.object({
  service: z.string().optional(),
  minRating: z.coerce.number().optional(),
  sort: z.enum(["rating", "reviews", "name"]).optional(),
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
    return {
      meta: [
        { title: `Aesthetic Injectors in ${name}, TX | Texas Aesthetics` },
        { name: "description", content: `Top-rated Botox, filler & medspa injectors in ${name}, Texas. Real patient reviews, hours, and contact info.` },
        { name: "keywords", content: `${name} Botox, ${name} filler, ${name} medspa, aesthetic injector ${name} Texas` },
        { property: "og:title", content: `${name} Aesthetic Injectors` },
        { property: "og:description", content: `Browse trusted injectors in ${name}, TX.` },
        { property: "og:type", content: "website" },
      ],
    };
  },
  loader: ({ params, deps, context }) => {
    const opts = queryOptions({
      queryKey: ["city", params.city, deps],
      queryFn: () => listProvidersByCity({ data: { citySlug: params.city, service: deps.service, minRating: deps.minRating, sort: deps.sort } }),
    });
    return context.queryClient.ensureQueryData(opts);
  },
  component: CityPage,
});

function CityPage() {
  const { city } = Route.useParams();
  const search = Route.useSearch();
  const c = cityFromSlug(city)!;
  const { data } = useSuspenseQuery(queryOptions({
    queryKey: ["city", city, search],
    queryFn: () => listProvidersByCity({ data: { citySlug: city, service: search.service, minRating: search.minRating, sort: search.sort } }),
  }));

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
          <p className="mt-2 text-muted-foreground">We're still gathering verified providers in this city. Check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.providers.map((p) => <ProviderCard key={p.place_id} {...p} />)}
        </div>
      )}
    </div>
  );
}
