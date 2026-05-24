import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { TEXAS_CITIES, SERVICES } from "@/lib/cities";
import { getFeaturedProviders, getCityStats } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShieldCheck, Sparkles, MapPin } from "lucide-react";

const featuredOpts = queryOptions({ queryKey: ["featured"], queryFn: () => getFeaturedProviders() });
const statsOpts = queryOptions({ queryKey: ["city-stats"], queryFn: () => getCityStats() });

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "TexasInjectors — Find Trusted Aesthetic Injectors in Texas" },
      { name: "description", content: "Browse the most trusted Botox, filler, and aesthetic injectors across Houston, Dallas, Austin, San Antonio and every major Texas metro." },
      { property: "og:title", content: "TexasInjectors — The Texas Aesthetic Injector Directory" },
      { property: "og:description", content: "Search top-rated Botox, filler, and medspa providers in Texas." },
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

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent via-background to-secondary/60" />
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 text-center md:pt-28 md:pb-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span>The Texas aesthetic injector directory</span>
          </div>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] md:text-7xl">
            Find your <span className="italic text-brand">trusted injector</span><br />anywhere in Texas.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Honest, up-to-date listings for Botox, fillers, and aesthetic medspas across every major Texas metro — sourced from real Google reviews.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/search", search: { q } as never }); }}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a clinic, injector, or treatment…" className="border-0 bg-transparent text-base shadow-none focus-visible:ring-0" />
            </div>
            <Button type="submit" size="lg" className="h-12">Search</Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {SERVICES.slice(0, 6).map((s) => (
              <Link key={s.slug} to="/search" search={{ q: s.name } as never} className="rounded-full border border-border bg-background px-3 py-1 text-sm hover:border-brand">{s.name}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* CITIES */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl md:text-4xl">Browse by city</h2>
            <p className="mt-2 text-muted-foreground">Texas's top 10 metros, hand-mapped.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {TEXAS_CITIES.map((c) => {
            const count = stats.counts[c.slug] ?? 0;
            return (
              <Link key={c.slug} to="/tx/$city" params={{ city: c.slug }} className="group rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
                <MapPin className="h-5 w-5 text-brand" />
                <h3 className="mt-3 font-display text-xl">{c.name}</h3>
                <p className="text-xs text-muted-foreground">{c.tagline}</p>
                <p className="mt-3 text-sm font-medium">{count} {count === 1 ? "provider" : "providers"}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED */}
      {featured.providers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-8">
            <h2 className="font-display text-3xl md:text-4xl">Top-rated this month</h2>
            <p className="mt-2 text-muted-foreground">Highest-rated injectors across the state.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featured.providers.map((p) => <ProviderCard key={p.place_id} {...p} />)}
          </div>
        </section>
      )}

      {/* TRUST */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 rounded-3xl border border-border bg-card p-10 md:grid-cols-3">
          <div>
            <ShieldCheck className="h-8 w-8 text-brand" />
            <h3 className="mt-4 font-display text-xl">Real reviews</h3>
            <p className="mt-1 text-sm text-muted-foreground">Listings include verified Google reviews from real patients.</p>
          </div>
          <div>
            <Sparkles className="h-8 w-8 text-brand" />
            <h3 className="mt-4 font-display text-xl">Currently operating</h3>
            <p className="mt-1 text-sm text-muted-foreground">We continuously verify each listing is still in business.</p>
          </div>
          <div>
            <MapPin className="h-8 w-8 text-brand" />
            <h3 className="mt-4 font-display text-xl">Texas-only</h3>
            <p className="mt-1 text-sm text-muted-foreground">Curated exclusively for the Lone Star State.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="rounded-3xl bg-brand p-10 text-center text-brand-foreground">
          <h2 className="font-display text-3xl md:text-4xl">Are you an injector?</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">Claim your listing free to manage your hours, services, and photos.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary"><Link to="/submit">Submit your business</Link></Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent text-brand-foreground border-brand-foreground/30 hover:bg-brand-foreground/10"><Link to="/login">Claim a listing</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
