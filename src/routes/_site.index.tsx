import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { TEXAS_CITIES, SERVICES } from "@/lib/cities";
import { getFeaturedProviders, getCityStats } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShieldCheck, Sparkles, MapPin, BadgeCheck, Building2 } from "lucide-react";

const featuredOpts = queryOptions({ queryKey: ["featured"], queryFn: () => getFeaturedProviders() });
const statsOpts = queryOptions({ queryKey: ["city-stats"], queryFn: () => getCityStats() });

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "Texas Aesthetics — Find Trusted Aesthetic Injectors in Texas" },
      { name: "description", content: "Verified Botox, filler & medspa injectors across Houston, Dallas, Austin, San Antonio and every major Texas metro." },
      { name: "keywords", content: "Texas aesthetic injectors, Botox Texas, filler Texas, medspa Texas, lip filler, Sculptra, Dallas Botox, Houston injector, Austin medspa" },
      { property: "og:title", content: "Texas Aesthetics — The Texas Aesthetic Injector Directory" },
      { property: "og:description", content: "Search top verified Botox, filler, and medspa providers in Texas." },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "WebSite", name: "Texas Aesthetics", url: "/", potentialAction: { "@type": "SearchAction", target: "/search?q={search_term_string}", "query-input": "required name=search_term_string" } },
            { "@type": "Organization", name: "Texas Aesthetics", url: "/", description: "Verified directory of aesthetic injectors across Texas." },
          ],
        }),
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(featuredOpts);
    context.queryClient.ensureQueryData(statsOpts);
  },
  component: HomePage,
});

function HomePage() {
  const { data: featured } = useSuspenseQuery(featuredOpts);
  const { data: stats } = useSuspenseQuery(statsOpts);
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const heroFeatured = featured.providers[0];

  return (
    <>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-16 pb-20 md:grid-cols-[1.1fr_0.9fr] md:gap-16 md:pt-24 md:pb-28">
          <div>
            <h1 className="font-display text-5xl leading-[1.02] md:text-7xl">Find Your<br />Trusted Injector</h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Verified Botox, filler, and medspa providers across Texas — vetted contact info, treatments, and locations all in one place.
            </p>

            <p className="mt-10 text-sm font-medium text-muted-foreground">I'm looking for a…</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SERVICES.slice(0, 5).map((s) => (
                <Link key={s.slug} to="/treatment/$slug" params={{ slug: s.slug }} className="rounded-full border border-foreground/15 bg-card px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand">
                  {s.name}
                </Link>
              ))}
            </div>
            <Link to="/search" className="mt-3 inline-block text-sm text-muted-foreground hover:text-brand">Or search all services →</Link>

            <form
              onSubmit={(e) => { e.preventDefault(); navigate({ to: "/search", search: { q } as never }); }}
              className="mt-8 flex max-w-lg gap-2"
            >
              <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Clinic, injector, or city…" className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0" />
              </div>
              <Button type="submit" className="h-11 rounded-full px-6">Search</Button>
            </form>
          </div>

          <div className="relative">
            {heroFeatured ? <FeaturedProCard p={heroFeatured} /> : (
              <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
                <p className="font-display text-2xl">Verified Texas injectors, all in one place.</p>
                <Button asChild className="mt-6 rounded-full"><Link to="/search">Browse all</Link></Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">By City</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl">Browse Texas's biggest metros</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {TEXAS_CITIES.map((c) => {
            const count = stats.counts[c.slug] ?? 0;
            return (
              <Link key={c.slug} to="/tx/$city" params={{ city: c.slug }} className="group rounded-2xl border border-border bg-card p-5 transition hover:border-brand hover:shadow-md">
                <MapPin className="h-5 w-5 text-brand" />
                <h3 className="mt-3 font-display text-xl">{c.name}</h3>
                <p className="text-xs text-muted-foreground">{c.tagline}</p>
                <p className="mt-3 text-sm font-medium">{count} {count === 1 ? "provider" : "providers"}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {featured.providers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">Featured</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Verified providers</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featured.providers.slice(0, 8).map((p) => <ProviderCard key={p.place_id} {...p} />)}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="grid gap-8 rounded-3xl border border-border bg-card p-10 md:grid-cols-3 md:p-14">
          <div>
            <ShieldCheck className="h-8 w-8 text-brand" />
            <h3 className="mt-4 font-display text-2xl">Verified providers</h3>
            <p className="mt-2 text-sm text-muted-foreground">Every listing is reviewed and verified before publication.</p>
          </div>
          <div>
            <BadgeCheck className="h-8 w-8 text-brand" />
            <h3 className="mt-4 font-display text-2xl">Multi-location brands</h3>
            <p className="mt-2 text-sm text-muted-foreground">See every branch of franchise medspas in one place.</p>
          </div>
          <div>
            <Sparkles className="h-8 w-8 text-brand" />
            <h3 className="mt-4 font-display text-2xl">Texas only</h3>
            <p className="mt-2 text-sm text-muted-foreground">Curated exclusively for the Lone Star State.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24">
        <div className="rounded-3xl bg-brand p-12 text-center text-brand-foreground md:p-16">
          <h2 className="font-display text-4xl md:text-5xl">Are you an injector?</h2>
          <p className="mx-auto mt-4 max-w-xl text-base opacity-90">Claim your listing free to manage hours, services, and photos.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="rounded-full"><Link to="/submit">Submit your business</Link></Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-transparent text-brand-foreground border-brand-foreground/40 hover:bg-brand-foreground/10"><Link to="/login">Claim a listing</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}

function FeaturedProCard({ p }: { p: { slug: string; name: string; city: string; services?: string[] | null; branch_label?: string | null } }) {
  return (
    <Link to="/provider/$slug" params={{ slug: p.slug }} className="block rounded-3xl border border-border bg-card p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.15)] transition hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)]">
      <div className="flex items-start gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand/10 font-display text-3xl text-brand">{p.name.charAt(0)}</div>
        <div className="flex-1">
          <p className="font-display text-xl leading-tight">{p.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{p.city}, TX</p>
          {p.services?.[0] && (
            <span className="mt-2 inline-block rounded-full bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-foreground">{p.services[0].replace(/-/g, " ")}</span>
          )}
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
        {p.branch_label ? <><Building2 className="h-4 w-4" /> {p.branch_label}</> : <><BadgeCheck className="h-4 w-4 text-brand" /> Verified Texas provider</>}
      </div>
      <Button className="mt-6 w-full rounded-full">View profile</Button>
    </Link>
  );
}
