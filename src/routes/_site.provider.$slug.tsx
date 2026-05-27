import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getProviderBySlug } from "@/lib/providers.functions";
import { Button } from "@/components/ui/button";
import { MapPin, Globe, Mail, ExternalLink, BadgeCheck, Building2, ShieldCheck, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/_site/provider/$slug")({
  head: ({ params, loaderData }) => {
    const path = `/provider/${params.slug}`;
    const p = (loaderData as { provider?: any } | undefined)?.provider;
    const displayName = p?.name ?? params.slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    const description = p
      ? `${p.name}${p.city ? ` in ${p.city}, TX` : ""} — services, contact info, and patient reviews for this verified Texas aesthetic injector.`
      : `Verified Texas aesthetic injector. Services, contact, and reviews.`;
    const meta: Array<Record<string, string>> = [
      { title: `${displayName} — Texas Aesthetics` },
      { name: "description", content: description },
      { property: "og:title", content: `${displayName} | Texas Aesthetics` },
      { property: "og:description", content: description },
      { property: "og:url", content: path },
      { property: "og:type", content: "profile" },
    ];
    const scripts: Array<{ type: string; children: string }> = [];
    if (p) {
      const ld: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: p.name,
        url: path,
      };
      if (p.address) ld.address = { "@type": "PostalAddress", streetAddress: p.address, addressLocality: p.city, addressRegion: "TX", addressCountry: "US" };
      if (p.website) ld.sameAs = [p.website];
      if (p.email) ld.email = p.email;
      scripts.push({ type: "application/ld+json", children: JSON.stringify(ld) });
    }
    return { meta, links: [{ rel: "canonical", href: path }], scripts };
  },
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(
      queryOptions({
        queryKey: ["provider", params.slug],
        queryFn: () => getProviderBySlug({ data: { slug: params.slug } }),
      }),
    ),
  component: ProviderPage,
});

function ProviderPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(
    queryOptions({
      queryKey: ["provider", slug],
      queryFn: () => getProviderBySlug({ data: { slug } }),
    }),
  );

  if (!data.provider) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Provider not found</h1>
        <Button asChild className="mt-6"><Link to="/">Back home</Link></Button>
      </div>
    );
  }

  const p = data.provider;
  const mapsHref = p.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${p.address}`)}`
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">Texas</Link> /{" "}
        <Link to="/tx/$city" params={{ city: p.city_slug }} className="hover:underline">{p.city}</Link>
      </p>

      <div className="mt-2 flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl md:text-5xl">{p.name}</h1>
            {p.is_verified && (
              <span className="flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
                <BadgeCheck className="h-4 w-4" /> Verified
              </span>
            )}
          </div>
          {p.branch_label && (
            <p className="mt-2 flex items-center gap-1 text-sm text-brand">
              <Building2 className="h-4 w-4" /> {p.branch_label} location
            </p>
          )}
          {p.address && (
            <p className="mt-3 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {p.address}, {p.city}, TX
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {p.email && <Button asChild><a href={`mailto:${p.email}`}><Mail className="mr-2 h-4 w-4" />Email</a></Button>}
          {p.website && <Button asChild variant="outline"><a href={p.website} target="_blank" rel="noopener noreferrer"><Globe className="mr-2 h-4 w-4" />Website</a></Button>}
          {mapsHref && <Button asChild variant="outline"><a href={mapsHref} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Directions</a></Button>}
        </div>
      </div>

      {p.specialists && (
        <section className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl">Injectors & Team</h2>
          <p className="mt-2 text-foreground/85 leading-relaxed">{p.specialists}</p>
        </section>
      )}

      {p.services && p.services.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl">Treatments offered</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.services.map((s: string) => (
              <Link
                key={s}
                to="/treatment/$slug"
                params={{ slug: s }}
                className="rounded-full bg-accent px-3 py-1 text-sm capitalize hover:bg-brand hover:text-brand-foreground"
              >
                {s.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </section>
      )}

      {p.notes && (
        <section className="mt-10">
          <h2 className="font-display text-2xl">Notes</h2>
          <p className="mt-2 text-foreground/85 leading-relaxed">{p.notes}</p>
        </section>
      )}

      {data.brandSiblings.length > 0 && (
        <section className="mt-10 rounded-2xl border border-border bg-secondary/30 p-6">
          <h2 className="font-display text-2xl flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand" /> Other locations
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {data.brandSiblings.map((b) => (
              <li key={b.slug}>
                <Link to="/provider/$slug" params={{ slug: b.slug }} className="block rounded-lg border border-border bg-card px-4 py-3 hover:border-brand">
                  <span className="font-medium">{b.branch_label || b.city}</span>
                  <span className="ml-2 text-sm text-muted-foreground">{b.city}, TX</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.reviews.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl">Patient reviews</h2>
          <div className="mt-4 space-y-4">
            {data.reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-5">
                <div className="text-sm text-muted-foreground">{r.author_name} • {r.relative_time}</div>
                {r.text && <p className="mt-2 text-sm leading-relaxed">{r.text}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mt-10">
        <h2 className="font-display text-2xl flex items-center gap-2"><HelpCircle className="h-5 w-5" /> Frequently asked</h2>
        <div className="mt-4 space-y-3">
          <FaqItem q={`How do I book an appointment with ${p.name}?`} a="Contact the clinic directly using the email or website above to schedule a consultation." />
          <FaqItem q="Is a consultation required?" a="Most aesthetic injectors recommend a consultation before treatment to discuss your goals and review medical history." />
          <FaqItem q="What should I bring to my first visit?" a="Bring a valid ID, list of current medications, and any questions about treatment options and pricing." />
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-secondary/40 p-6">
        <p className="flex items-center gap-2 text-sm text-foreground/80">
          <ShieldCheck className="h-4 w-4 text-brand" />
          Always verify a provider's licensure with the Texas Medical Board or Texas Board of Nursing before treatment.
        </p>
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-secondary/50 p-6 text-center">
        <p className="font-display text-xl">Is this your business?</p>
        <p className="mt-1 text-sm text-muted-foreground">Claim this listing to update contact info, photos, and services.</p>
        <Button asChild className="mt-4"><Link to="/login">Claim this listing</Link></Button>
      </section>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-border bg-card p-4">
      <summary className="cursor-pointer font-medium">{q}</summary>
      <p className="mt-2 text-sm text-foreground/80">{a}</p>
    </details>
  );
}
