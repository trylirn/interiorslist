import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { STYLES, styleFromSlug, SERVICES } from "@/lib/cities";
import { STYLE_SERVICES } from "@/lib/match.functions";
import { listByTreatment } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";

const styleProvidersOpts = (slug: string) =>
  queryOptions({
    queryKey: ["style-providers", slug],
    queryFn: async () => {
      const services = STYLE_SERVICES[slug] ?? ["full-home-design"];
      const lists = await Promise.all(services.slice(0, 4).map((t) => listByTreatment({ data: { service: t } })));
      const seen = new Set<string>();
      const merged: Array<Awaited<ReturnType<typeof listByTreatment>>["providers"][number]> = [];
      for (const r of lists) for (const p of r.providers) { if (seen.has(p.place_id)) continue; seen.add(p.place_id); merged.push(p); }
      return { providers: merged.slice(0, 12) };
    },
  });

export const Route = createFileRoute("/_site/style/$slug")({
  head: ({ params }) => {
    const c = styleFromSlug(params.slug);
    if (!c) return { meta: [{ title: "Style not found | Intearior" }] };
    const title = `${c.label} Interior Designers | Intearior`;
    return {
      meta: [
        { title },
        { name: "description", content: c.intro },
        { property: "og:title", content: title },
        { property: "og:description", content: c.intro },
        { property: "og:url", content: `/style/${c.slug}` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/style/${c.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description: c.intro,
            url: `https://interiorslist.lovable.app/style/${c.slug}`,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://interiorslist.lovable.app/" },
              { "@type": "ListItem", position: 2, name: "Styles", item: "https://interiorslist.lovable.app/search" },
              { "@type": "ListItem", position: 3, name: c.label, item: `https://interiorslist.lovable.app/style/${c.slug}` },
            ],
          }),
        },
      ],
    };
  },
  loader: ({ context, params }) => {
    if (!styleFromSlug(params.slug)) throw notFound();
    context.queryClient.ensureQueryData(styleProvidersOpts(params.slug));
  },
  component: StylePage,
  notFoundComponent: () => <div className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="font-display text-3xl">Style not found</h1></div>,
});

function StylePage() {
  const { slug } = Route.useParams();
  const style = styleFromSlug(slug)!;
  const { data } = useSuspenseQuery(styleProvidersOpts(slug));
  const services = (STYLE_SERVICES[slug] ?? [])
    .map((t) => SERVICES.find((s) => s.slug === t))
    .filter(Boolean) as { slug: string; name: string }[];

  return (
    <>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">Style</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">{style.label}</h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{style.intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="font-display text-2xl">Services that suit this look</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {services.map((t) => (
            <Link key={t.slug} to="/service/$slug" params={{ slug: t.slug }} className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium hover:border-brand hover:text-brand">
              {t.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <h2 className="font-display text-2xl">Studios to consider</h2>
        {data.providers.length === 0 ? (
          <p className="mt-6 text-muted-foreground">No studios listed yet for this style.</p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.providers.map((p) => <ProviderCard key={p.place_id} {...p} />)}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24">
        <h3 className="font-display text-xl">Explore other styles</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {STYLES.filter((c) => c.slug !== slug).map((c) => (
            <Link key={c.slug} to="/style/$slug" params={{ slug: c.slug }} className="rounded-full border border-border px-4 py-2 text-sm hover:border-brand hover:text-brand">
              {c.label}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
