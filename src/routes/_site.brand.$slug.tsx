import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getBrandBySlug } from "@/lib/providers.functions";
import { Button } from "@/components/ui/button";
import { ProviderCard } from "@/components/provider-card";
import { Building2, Globe, BadgeCheck } from "lucide-react";

export const Route = createFileRoute("/_site/brand/$slug")({
  head: ({ params, loaderData }) => {
    const path = `/brand/${params.slug}`;
    const b = (loaderData as { brand?: any } | undefined)?.brand;
    const name = b?.name ?? params.slug;
    const count = (loaderData as { branches?: unknown[] } | undefined)?.branches?.length ?? 0;
    const description = b
      ? `${name} — ${count} Texas locations. All branches, services, and contact info in one place.`
      : `Aesthetic injector brand with multiple Texas locations.`;
    const scripts: Array<{ type: string; children: string }> = [];
    if (b) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: b.name,
          url: path,
          sameAs: b.website ? [b.website] : undefined,
        }),
      });
    }
    return {
      meta: [
        { title: `${name} — All Texas Locations | Texas Aesthetics` },
        { name: "description", content: description },
        { property: "og:title", content: `${name} | Texas Aesthetics` },
        { property: "og:description", content: description },
        { property: "og:url", content: path },
      ],
      links: [{ rel: "canonical", href: path }],
      scripts,
    };
  },
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(
      queryOptions({
        queryKey: ["brand", params.slug],
        queryFn: () => getBrandBySlug({ data: { slug: params.slug } }),
      }),
    ),
  component: BrandPage,
});

function BrandPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(
    queryOptions({
      queryKey: ["brand", slug],
      queryFn: () => getBrandBySlug({ data: { slug } }),
    }),
  );

  if (!data.brand) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Brand not found</h1>
        <Button asChild className="mt-6"><Link to="/">Back home</Link></Button>
      </div>
    );
  }

  const b = data.brand;
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:underline">Texas</Link> / Brands</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Building2 className="h-7 w-7 text-brand" />
        <h1 className="font-display text-4xl md:text-5xl">{b.name}</h1>
        {b.is_verified && (
          <span className="flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
            <BadgeCheck className="h-4 w-4" /> Verified brand
          </span>
        )}
      </div>
      <p className="mt-3 text-muted-foreground">{data.branches.length} locations across Texas</p>
      {b.description && <p className="mt-4 max-w-3xl text-foreground/85 leading-relaxed">{b.description}</p>}
      {b.website && (
        <Button asChild variant="outline" className="mt-4">
          <a href={b.website} target="_blank" rel="noopener noreferrer"><Globe className="mr-2 h-4 w-4" />Brand website</a>
        </Button>
      )}

      <section className="mt-12">
        <h2 className="font-display text-2xl">All locations</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.branches.map((p) => <ProviderCard key={p.place_id} {...p} />)}
        </div>
      </section>
    </div>
  );
}
