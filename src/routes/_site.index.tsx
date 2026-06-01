import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { TEXAS_CITIES, SERVICES, CONCERNS } from "@/lib/cities";
import { getFeaturedProviders, getCityStats, listBrands } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, ShieldCheck, MapPin, BadgeCheck, Building2, Sparkles, MessageSquare, ListChecks } from "lucide-react";

const featuredOpts = queryOptions({ queryKey: ["featured"], queryFn: () => getFeaturedProviders() });
const statsOpts = queryOptions({ queryKey: ["city-stats"], queryFn: () => getCityStats() });

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "Texas Aesthetics — Find Trusted Aesthetic Injectors in Texas" },
      { name: "description", content: "Verified Botox, filler & medspa injectors across Houston, Dallas, Austin, San Antonio and every major Texas metro." },
      { property: "og:title", content: "Texas Aesthetics — The Texas Aesthetic Injector Directory" },
      { property: "og:description", content: "Search top verified Botox, filler, and medspa providers in Texas." },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
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
  const { data: brandsData } = useQuery({ queryKey: ["home-brands"], queryFn: () => listBrands() });
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  return (
    <>
      {/* HERO */}
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-16 pb-20 md:grid-cols-[1.1fr_0.9fr] md:gap-16 md:pt-24 md:pb-28">
          <div>
            <h1 className="font-display text-5xl leading-[1.02] md:text-7xl">Find Your<br />Trusted Injector</h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Verified Botox, filler, and medspa providers across Texas — vetted contact info, treatments, and locations all in one place.
            </p>

            <p className="mt-10 text-sm font-medium text-muted-foreground">I'm looking for…</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SERVICES.slice(0, 6).map((s) => (
                <Link key={s.slug} to="/treatment/$slug" params={{ slug: s.slug }} className="rounded-full border border-foreground/15 bg-card px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand">
                  {s.name}
                </Link>
              ))}
            </div>
            <Link to="/search" className="mt-3 inline-block text-sm text-muted-foreground hover:text-brand">Or browse all treatments →</Link>

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
            <div className="rounded-3xl border border-border bg-card p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.2)]">
              <p className="font-display text-2xl">Not sure where to start?</p>
              <p className="mt-3 text-sm text-muted-foreground">Answer 4 quick questions and we'll match you with verified Texas medspas.</p>
              <Button asChild className="mt-6 w-full rounded-full"><Link to="/match">Get matched →</Link></Button>
              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                <Stat label="Cities" value={String(TEXAS_CITIES.length)} />
                <Stat label="Treatments" value={String(SERVICES.length)} />
                <Stat label="Verified" value="100%" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">How it works</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Find a provider in 3 steps</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Step n="1" Icon={ListChecks} title="Tell us what you want" desc="Pick a treatment, concern, or just a city. Filter by brand or verified status." />
            <Step n="2" Icon={Sparkles} title="See verified matches" desc="Compare specialists, services, and locations — all reviewed before publication." />
            <Step n="3" Icon={MessageSquare} title="Reach out directly" desc="Message the clinic from their profile. No middlemen, no commissions." />
          </div>
        </div>
      </section>

      {/* CITIES */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">By City</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl">Browse Texas's biggest metros</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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

      {/* TREATMENTS */}
      <section className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">By Treatment</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Popular Texas treatments</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {SERVICES.slice(0, 18).map((s) => (
              <Link key={s.slug} to="/treatment/$slug" params={{ slug: s.slug }} className="rounded-xl border border-border bg-card px-4 py-4 text-center text-sm font-medium transition hover:border-brand hover:text-brand">
                {s.name}
              </Link>
            ))}
          </div>
          <p className="mt-6 text-center"><Link to="/search" className="text-sm font-medium text-brand hover:underline">See all {SERVICES.length} treatments →</Link></p>
        </div>
      </section>

      {/* CONCERNS */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">By Concern</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl">What are you trying to fix?</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {CONCERNS.map((c) => (
            <Link key={c.slug} to="/concern/$slug" params={{ slug: c.slug }} className="rounded-2xl border border-border bg-card p-6 transition hover:border-brand hover:shadow-md">
              <h3 className="font-display text-lg">{c.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{c.intro}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      {featured.providers.length > 0 && (
        <section className="border-y border-border/60 bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-20">
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">Featured</p>
              <h2 className="mt-2 font-display text-4xl md:text-5xl">Verified providers</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.providers.slice(0, 6).map((p) => <ProviderCard key={p.place_id} {...p} />)}
            </div>
          </div>
        </section>
      )}

      {/* BRANDS */}
      {brandsData?.brands && brandsData.brands.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">Brands</p>
              <h2 className="mt-2 font-display text-4xl md:text-5xl">Multi-location medspas</h2>
            </div>
            <Link to="/brands" className="hidden text-sm font-medium text-brand hover:underline md:block">All brands →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {brandsData.brands.slice(0, 8).map((b) => (
              <Link key={b.slug} to="/brand/$slug" params={{ slug: b.slug }} className="rounded-2xl border border-border bg-card p-5 transition hover:border-brand hover:shadow-md">
                <Building2 className="h-5 w-5 text-brand" />
                <h3 className="mt-3 font-display text-lg">{b.name}</h3>
                <p className="text-xs text-muted-foreground">{b.branchCount} {b.branchCount === 1 ? "location" : "locations"}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SAFETY */}
      <section className="border-t border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="grid gap-10 md:grid-cols-[1fr_1fr]">
            <div>
              <ShieldCheck className="h-10 w-10 text-brand" />
              <h2 className="mt-4 font-display text-4xl">Safety first, always</h2>
              <p className="mt-4 text-muted-foreground">
                Every listing is reviewed before publication. We surface practitioner credentials (MD, DO, NP, PA, RN, Esthetician) and link directly to provider websites so you can verify licensure with the Texas Medical Board or Texas Board of Nursing.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="outline" className="rounded-full"><Link to="/safety">Read our safety guide</Link></Button>
                <Button asChild variant="outline" className="rounded-full"><Link to="/credentials">Credentials glossary</Link></Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TrustCard Icon={BadgeCheck} title="Verified" body="Listings reviewed before publication." />
              <TrustCard Icon={ShieldCheck} title="Credentialed" body="Practitioner licenses shown on every profile." />
              <TrustCard Icon={MapPin} title="Texas only" body="Curated for the Lone Star State." />
              <TrustCard Icon={Sparkles} title="Independent" body="No paid placements or referral fees." />
            </div>
          </div>
        </div>
      </section>

      {/* FOR BUSINESS CTA */}
      <section className="mx-auto max-w-7xl px-4 py-24">
        <div className="rounded-3xl bg-brand p-12 text-center text-brand-foreground md:p-16">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">For business owners</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Own a Texas medspa?</h2>
          <p className="mx-auto mt-4 max-w-xl text-base opacity-90">Claim or submit your listing — free. Manage hours, services, photos, and respond to inquiries directly.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="rounded-full"><Link to="/for-business">Learn more</Link></Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-transparent text-brand-foreground border-brand-foreground/40 hover:bg-brand-foreground/10"><Link to="/submit">Submit your business</Link></Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-24">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">FAQ</p>
          <h2 className="mt-2 font-display text-4xl">Common questions</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {FAQ.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-3">
      <p className="font-display text-2xl">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function Step({ n, Icon, title, desc }: { n: string; Icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground">{n}</span>
        <Icon className="h-5 w-5 text-brand" />
      </div>
      <h3 className="mt-5 font-display text-2xl">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function TrustCard({ Icon, title, body }: { Icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <Icon className="h-6 w-6 text-brand" />
      <h3 className="mt-3 font-display text-lg">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

const FAQ = [
  { q: "Is Texas Aesthetics free for patients?", a: "Yes — searching, browsing, and contacting providers is always free." },
  { q: "How are providers verified?", a: "We review every listing for valid business info, an active website, and credentialed practitioners before publication." },
  { q: "Do you accept paid placements?", a: "No. There are no paid placements or commissions on inquiries. Featured spots are based on verification status." },
  { q: "How do I claim my business listing?", a: "Sign in and visit your business profile — you'll see a 'Claim this listing' button. We verify ownership before granting access." },
  { q: "What credentials should I look for?", a: "In Texas, neuromodulators and fillers must be administered by or under the supervision of a licensed physician (MD or DO). NPs, PAs, and RNs commonly inject under physician oversight." },
  { q: "Can I leave a review?", a: "Yes — sign in to leave a verified review on any provider's profile." },
  { q: "Do you cover the whole state?", a: "We focus on Texas only, with deep coverage of the largest metros and growing across mid-size cities." },
  { q: "How do I report incorrect info?", a: "Use the contact form on any provider's profile, or email us via the Contact page." },
];
