import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getProviderBySlug } from "@/lib/providers.functions";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Phone, Globe, Clock, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_site/provider/$slug")({
  head: ({ params, loaderData }) => {
    const path = `/provider/${params.slug}`;
    const p = (loaderData as { provider?: any } | undefined)?.provider;
    const displayName = p?.name ?? params.slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    const description = p
      ? `Patient reviews, hours, services, and contact info for ${p.name}${p.city ? ` in ${p.city}, TX` : ""}.`
      : `Patient reviews, hours, services, and contact info for ${displayName}, a Texas aesthetic injector.`;
    const meta: Array<Record<string, string>> = [
      { title: `${displayName} — Reviews, Hours & Services | Texas Aesthetics` },
      { name: "description", content: description },
      { property: "og:title", content: `${displayName} | Texas Aesthetics` },
      { property: "og:description", content: description },
      { property: "og:url", content: path },
      { property: "og:type", content: "profile" },
    ];
    if (p?.hero_photo_url) {
      meta.push({ property: "og:image", content: p.hero_photo_url });
      meta.push({ name: "twitter:image", content: p.hero_photo_url });
    }
    const scripts: Array<{ type: string; children: string }> = [];
    if (p) {
      const ld: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: p.name,
        url: path,
      };
      if (p.address) ld.address = { "@type": "PostalAddress", streetAddress: p.address, addressRegion: "TX", addressCountry: "US" };
      if (p.phone) ld.telephone = p.phone;
      if (p.website) ld.sameAs = [p.website];
      if (p.hero_photo_url) ld.image = p.hero_photo_url;
      if (p.rating != null && p.review_count) {
        ld.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue: Number(p.rating).toFixed(1),
          reviewCount: p.review_count,
        };
      }
      scripts.push({ type: "application/ld+json", children: JSON.stringify(ld) });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: path }],
      scripts,
    };
  },
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(queryOptions({
      queryKey: ["provider", params.slug],
      queryFn: () => getProviderBySlug({ data: { slug: params.slug } }),
    })),
  component: ProviderPage,
});

function ProviderPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(queryOptions({
    queryKey: ["provider", slug],
    queryFn: () => getProviderBySlug({ data: { slug } }),
  }));

  if (!data.provider) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Provider not found</h1>
        <p className="mt-2 text-muted-foreground">This listing may have been removed.</p>
        <Button asChild className="mt-6"><Link to="/">Back home</Link></Button>
      </div>
    );
  }

  const p = data.provider;
  const hours = (p.hours_json as { weekdayDescriptions?: string[] } | null)?.weekdayDescriptions ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">Texas</Link> /{" "}
        <Link to="/tx/$city" params={{ city: p.city_slug }} className="hover:underline">{p.city}</Link>
      </p>
      <div className="mt-2 flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex-1">
          <h1 className="font-display text-4xl md:text-5xl">{p.name}</h1>
          {p.rating != null && (
            <div className="mt-3 flex items-center gap-2 text-base">
              <Star className="h-5 w-5 fill-rating text-rating" />
              <span className="font-semibold">{Number(p.rating).toFixed(1)}</span>
              <span className="text-muted-foreground">({p.review_count} patient reviews)</span>
            </div>
          )}
          {p.address && (
            <p className="mt-3 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {p.address}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {p.phone && <Button asChild><a href={`tel:${p.phone}`}><Phone className="mr-2 h-4 w-4" />Call</a></Button>}
          {p.website && <Button asChild variant="outline"><a href={p.website} target="_blank" rel="noopener noreferrer"><Globe className="mr-2 h-4 w-4" />Website</a></Button>}
          {p.google_maps_url && <Button asChild variant="outline"><a href={p.google_maps_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Directions</a></Button>}
        </div>
      </div>

      {p.hero_photo_url && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          <img src={p.hero_photo_url} alt={p.name} className="aspect-[16/9] w-full object-cover" />
        </div>
      )}

      {p.services && p.services.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl">Services</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.services.map((s: string) => (
              <span key={s} className="rounded-full bg-accent px-3 py-1 text-sm capitalize">{s.replace(/-/g, " ")}</span>
            ))}
          </div>
        </section>
      )}

      {hours.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl flex items-center gap-2"><Clock className="h-5 w-5" />Hours</h2>
          <ul className="mt-3 grid gap-1 text-sm md:grid-cols-2">
            {hours.map((h) => <li key={h} className="text-muted-foreground">{h}</li>)}
          </ul>
        </section>
      )}

      {data.reviews.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl">Recent reviews</h2>
          <div className="mt-4 space-y-4">
            {data.reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  {r.rating && <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-rating text-rating" /><span className="text-sm font-medium">{r.rating}</span></div>}
                  <span className="text-sm text-muted-foreground">{r.author_name} • {r.relative_time}</span>
                </div>
                {r.text && <p className="mt-2 text-sm leading-relaxed">{r.text}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 rounded-2xl border border-border bg-secondary/50 p-6 text-center">
        <p className="font-display text-xl">Is this your business?</p>
        <p className="mt-1 text-sm text-muted-foreground">Claim this listing to update hours, services, and photos.</p>
        <Button asChild className="mt-4"><Link to="/login">Claim this listing</Link></Button>
      </section>
    </div>
  );
}
