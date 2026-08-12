import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { CITIES, SERVICES, STYLES } from "@/lib/cities";
import { getFeaturedProviders, getCityStats, getDirectoryStats } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, ShieldCheck, MapPin, BadgeCheck, Wand2, Scale, MessageSquare, ListChecks } from "lucide-react";
import { HeroMatchCard } from "@/components/hero-match-card";
import { HERO_IMAGE, styleImage } from "@/lib/style-images";


const HOME_STYLE_SLUGS = ["modern", "mid-century", "traditional", "farmhouse", "coastal", "minimalist"];
const HOME_STYLES = HOME_STYLE_SLUGS.map((slug) => STYLES.find((s) => s.slug === slug)!).filter(Boolean);

const HOME_SERVICE_SLUGS = [
  "full-home-design", "kitchen-design", "bathroom-design", "living-dining",
  "bedroom-design", "home-office", "outdoor-patio", "commercial-office",
  "home-staging", "e-design", "space-planning", "renovation-management",
];
const HOME_SERVICES = HOME_SERVICE_SLUGS.map((slug) => SERVICES.find((s) => s.slug === slug)!).filter(Boolean);

const featuredOpts = queryOptions({ queryKey: ["featured"], queryFn: () => getFeaturedProviders() });
const statsOpts = queryOptions({ queryKey: ["city-stats"], queryFn: () => getCityStats() });
const dirStatsOpts = queryOptions({ queryKey: ["directory-stats"], queryFn: () => getDirectoryStats(), staleTime: 30 * 60 * 1000 });

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "Intearior — Find an Interior Designer Near You" },
      { name: "description", content: "Browse vetted interior design studios across the US. Compare styles, services and budgets, then request a consultation." },
      { property: "og:title", content: "Intearior — Find an Interior Designer Near You" },
      { property: "og:description", content: "A nationwide directory of vetted interior design studios. Compare styles, services and budgets." },
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
          "@type": "WebSite",
          name: "Intearior",
          potentialAction: {
            "@type": "SearchAction",
            target: "/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Intearior",
          description: "A nationwide directory of vetted interior design studios.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(featuredOpts);
    context.queryClient.ensureQueryData(statsOpts);
    context.queryClient.ensureQueryData(dirStatsOpts);
  },
  component: HomePage,
});

function HomePage() {
  const { data: featured } = useSuspenseQuery(featuredOpts);
  const { data: stats } = useSuspenseQuery(statsOpts);
  const { data: dirStats } = useSuspenseQuery(dirStatsOpts);

  const navigate = useNavigate();
  const [q, setQ] = useState("");

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-border/60">
        <img
          src={HERO_IMAGE}
          alt="Sunlit living room designed by an interior designer"
          width={1536}
          height={1024}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/90 to-background/30" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-20 pb-24 md:grid-cols-[1.05fr_0.95fr] md:gap-16 md:pt-28 md:pb-32">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">INTERIOR DESIGN DIRECTORY</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.02] md:text-7xl">Find Your<br />Interior Designer</h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Vetted design studios across the country — see their services, styles, typical project budgets and portfolios, then request a consultation in one step.
            </p>

            <p className="mt-10 text-sm font-medium text-muted-foreground">I need help with…</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SERVICES.slice(0, 6).map((s) => (
                <Link key={s.slug} to="/service/$slug" params={{ slug: s.slug }} className="rounded-full border border-foreground/15 bg-card/80 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:border-brand hover:text-brand">
                  {s.name}
                </Link>
              ))}
            </div>
            <Link to="/search" className="mt-3 inline-block text-sm text-muted-foreground hover:text-brand">Or browse all services →</Link>

            <form
              onSubmit={(e) => { e.preventDefault(); navigate({ to: "/search", search: { q } as never }); }}
              className="mt-8 flex max-w-lg gap-2"
            >
              <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input aria-label="Search studios" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Studio, designer, city, or style…" className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0" />
              </div>
              <Button type="submit" className="h-11 rounded-full px-6">Search</Button>
            </form>
          </div>

          <div className="relative">
            <HeroMatchCard stats={dirStats} studios={featured.providers} />
          </div>
        </div>
      </section>


      {/* HOW IT WORKS */}
      <section className="border-b border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">How it works</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Hire a designer in 3 steps</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Step n="1" Icon={ListChecks} title="Describe your project" desc="Rooms, style, budget and timeline — it takes about two minutes." />
            <Step n="2" Icon={Wand2} title="Review your matches" desc="Compare studios on services, style, credentials and typical project size." />
            <Step n="3" Icon={MessageSquare} title="Request a consultation" desc="Send your brief straight to the studio. No commissions, no middlemen." />
          </div>
        </div>
      </section>

      {/* STYLES — magazine grid */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">By Style</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Find a studio that matches your taste</h2>
          </div>
          <Link to="/search" className="text-sm font-medium text-brand hover:underline">Browse every studio →</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_STYLES.map((c, i) => (
            <Link
              key={c.slug}
              to="/style/$slug"
              params={{ slug: c.slug }}
              className={`group relative isolate overflow-hidden rounded-3xl border border-border ${i === 0 ? "lg:col-span-2 lg:row-span-1" : ""}`}
            >
              <img
                src={styleImage(c.slug)}
                alt={`${c.label} interior design`}
                loading="lazy"
                width={1024}
                height={768}
                className={`w-full object-cover transition duration-500 group-hover:scale-[1.04] ${i === 0 ? "h-72 md:h-80" : "h-60"}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-background">
                <h3 className="font-display text-2xl">{c.label}</h3>
                <p className="mt-1 text-sm text-background/80 line-clamp-2">{c.intro}</p>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center"><Link to="/search" className="text-sm font-medium text-brand hover:underline">See all {STYLES.length} design styles →</Link></p>
      </section>


      {/* CITIES */}
      <section className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">By City</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Browse designers by city</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {CITIES.map((c) => {
              const count = stats.counts[c.slug] ?? 0;
              return (
                <Link
                  key={c.slug}
                  to="/designers/$state/$city"
                  params={{ state: c.state.toLowerCase(), city: c.slug }}
                  className="group rounded-2xl border border-border bg-card p-5 transition hover:border-brand hover:shadow-md"
                >
                  <MapPin className="h-5 w-5 text-brand" />
                  <h3 className="mt-3 font-display text-xl">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">{c.tagline}</p>
                  <p className="mt-3 text-xs font-medium text-brand">{count} studio{count === 1 ? "" : "s"} →</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">By Service</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl">What do you need designed?</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {HOME_SERVICES.map((s) => (
            <Link key={s.slug} to="/service/$slug" params={{ slug: s.slug }} className="rounded-xl border border-border bg-card px-4 py-4 text-center text-sm font-medium transition hover:border-brand hover:text-brand">
              {s.name}
            </Link>
          ))}
        </div>
        <p className="mt-6 text-center"><Link to="/search" className="text-sm font-medium text-brand hover:underline">See all {SERVICES.length} services →</Link></p>
      </section>


      {/* FEATURED */}
      {featured.providers.length > 0 && (
        <section className="border-y border-border/60 bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-20">
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">Featured</p>
              <h2 className="mt-2 font-display text-4xl md:text-5xl">Vetted design studios</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.providers.slice(0, 6).map((p) => <ProviderCard key={p.place_id} {...p} />)}
            </div>
          </div>
        </section>
      )}

      {/* TRUST */}
      <section className="border-t border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="grid gap-10 md:grid-cols-[1fr_1fr]">
            <div>
              <ShieldCheck className="h-10 w-10 text-brand" />
              <h2 className="mt-4 font-display text-4xl">Hire with confidence</h2>
              <p className="mt-4 text-muted-foreground">
                Every listing is reviewed before it goes live. We show credentials such as NCIDQ certification, ASID or IIDA membership and state registration, and link straight to each studio's own portfolio so you can check the work yourself.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="outline" className="rounded-full"><Link to="/how-it-works">How it works</Link></Button>
                <Button asChild variant="outline" className="rounded-full"><Link to="/search">Browse all studios</Link></Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TrustCard Icon={BadgeCheck} title="Vetted" body="Listings reviewed before publication." />
              <TrustCard Icon={ShieldCheck} title="Credentials shown" body="NCIDQ, ASID, IIDA and registration on every profile." />
              <TrustCard Icon={MapPin} title="Nationwide" body="Major metros across the country, plus virtual e-design." />
              <TrustCard Icon={Scale} title="Independent" body="No paid placements or referral fees." />
            </div>
          </div>
        </div>
      </section>

      {/* FOR BUSINESS CTA */}
      <section className="mx-auto max-w-7xl px-4 py-24">
        <div className="rounded-3xl bg-brand p-12 text-center text-brand-foreground md:p-16">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">For design studios</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Run an interior design studio?</h2>
          <p className="mx-auto mt-4 max-w-xl text-base opacity-90">Claim or submit your listing — free. Manage services, styles, portfolio images and respond to enquiries directly.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="rounded-full"><Link to="/for-business">See how it works for studios</Link></Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-transparent text-brand-foreground border-brand-foreground/40 hover:bg-brand-foreground/10"><Link to="/submit">Submit your studio</Link></Button>
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
  { q: "Is Intearior free to use?", a: "Yes — searching, comparing and contacting design studios is always free for homeowners and businesses." },
  { q: "How are studios vetted?", a: "We review every listing for a real business address, an active portfolio or website, and any credentials the studio claims before it is published." },
  { q: "Do you accept paid placements?", a: "No. There are no paid placements and no commission on projects. Featured studios are chosen on verification status and review quality." },
  { q: "How much does an interior designer cost?", a: "Fees are usually charged as a flat project fee, an hourly rate, a cost-plus percentage on furnishings, or a mix. Every listing shows a typical project budget so you can shortlist studios that work at your scale." },
  { q: "What credentials should I look for?", a: "NCIDQ certification is the main professional standard in the US, with ASID and IIDA as leading membership bodies. Some states also register or license interior designers for commercial work." },
  { q: "How do I claim my studio's listing?", a: "Sign in and open your studio's profile — you'll see a 'Claim this listing' button. We verify ownership before granting access." },
  { q: "Can I leave a review?", a: "Yes. Sign in and leave a review on any studio's profile, including how the project went on budget, communication and results." },
  { q: "Do you cover my city?", a: "We cover major metros nationwide and are adding cities continuously. Many studios also offer virtual e-design anywhere in the country." },
];
