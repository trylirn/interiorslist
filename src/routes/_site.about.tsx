import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { CITIES, SERVICES } from "@/lib/cities";
import { getDirectoryStats } from "@/lib/providers.functions";
import { STUDIO_IMAGE, CONSULT_IMAGE } from "@/lib/style-images";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Scale, MessageSquare, ListChecks, BadgeCheck, Wand2, ShieldCheck } from "lucide-react";

const dirStatsOpts = queryOptions({
  queryKey: ["directory-stats"],
  queryFn: () => getDirectoryStats(),
  staleTime: 30 * 60 * 1000,
});

const TITLE = "About Intearior — An Independent Interior Design Directory";
const DESCRIPTION =
  "Intearior is an independent, nationwide directory of interior design studios. No paid placement — browse by city, service and style, compare studios, and request consultations.";

const FAQS = [
  {
    q: "Is Intearior an interior design firm?",
    a: "No. Intearior is a directory. We don't design homes ourselves — we help you find and contact independent studios that do.",
  },
  {
    q: "Do studios pay to appear or rank higher?",
    a: "No. There is no paid placement anywhere in the directory. Listings appear because the studio operates in that city, and ordering is driven by profile completeness and genuine client reviews.",
  },
  {
    q: "How are listings verified?",
    a: "Every listing is checked to confirm the studio is still operating and that its location, services and contact route are current. Studios can claim their listing to keep the details accurate themselves.",
  },
  {
    q: "How does getting matched work?",
    a: "You answer a short set of questions about your project, budget and style. We then surface up to three studios that fit, explain why each one matched, and let you choose which of them receives your consultation request.",
  },
  {
    q: "Does it cost anything to use?",
    a: "Browsing, comparing, reviewing and requesting consultations are all free for homeowners.",
  },
];

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="font-display text-3xl">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="font-display text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-[1.05rem] leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

function AboutPage() {
  const { data: stats } = useSuspenseQuery(dirStatsOpts);
  const services = SERVICES.slice(0, 18);
  const cities = CITIES.slice(0, 24);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">About Intearior</p>
      <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
        An independent directory for finding the right interior design studio
      </h1>
      <p className="mt-5 text-lg text-muted-foreground">
        Choosing a designer is one of the biggest decisions in any renovation, and most people start with a search engine
        and a handful of tabs. Intearior exists to make that first step orderly: one place to see which studios work in
        your city, what they actually do, what they cost, and what their clients say — with no advertising deciding who
        you see first.
      </p>

      <img
        src={STUDIO_IMAGE}
        alt="Interior design studio desk with material samples, fabric swatches and floor plans"
        className="mt-8 h-72 w-full rounded-3xl object-cover"
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat value={`${stats.studios.toLocaleString()}`} label="Design studios listed" />
        <Stat value={`${stats.cities.toLocaleString()}`} label="Cities covered" />
        <Stat value={`${stats.states.toLocaleString()}`} label="States represented" />
      </div>

      <Section title="What Intearior is">
        <p>
          Intearior is a nationwide directory of interior design studios — from solo designers taking on a single room to
          full-service firms managing whole-home renovations. Each listing is a profile, not an advert: services offered,
          styles worked in, typical job cost, service area, team, portfolio and client reviews.
        </p>
        <p>
          We are independent of every studio in the directory. Nobody buys a position, a badge, or a place in the match
          results, and we don't publish sponsored listings dressed up as recommendations.
        </p>
      </Section>

      <Section title="How we build the directory">
        <ul className="space-y-3">
          <li className="flex gap-3">
            <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand" />
            <span>
              <strong className="text-foreground">Gathered city by city.</strong> We build out each metro area from
              public business records, then normalise names, addresses and service areas so studios can be compared
              fairly.
            </span>
          </li>
          <li className="flex gap-3">
            <BadgeCheck className="mt-1 h-5 w-5 shrink-0 text-brand" />
            <span>
              <strong className="text-foreground">Checked for signs of life.</strong> Listings are reviewed to confirm
              the studio is still operating and reachable. Firms that have closed come off the directory.
            </span>
          </li>
          <li className="flex gap-3">
            <ListChecks className="mt-1 h-5 w-5 shrink-0 text-brand" />
            <span>
              <strong className="text-foreground">Kept current by the studios themselves.</strong> Any studio can claim
              its listing, and once verified the owner maintains services, styles, pricing, photos and team details
              directly.
            </span>
          </li>
          <li className="flex gap-3">
            <MessageSquare className="mt-1 h-5 w-5 shrink-0 text-brand" />
            <span>
              <strong className="text-foreground">Shaped by real clients.</strong> Reviews come from people who worked
              with the studio, and studios can respond publicly.
            </span>
          </li>
        </ul>
      </Section>

      <Section title="What you can do here">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: Search, t: "Browse by city and state", d: "Start from a city hub or a whole state and work down to individual studios." },
            { icon: ListChecks, t: "Filter by service, style and budget", d: "Narrow to the studios that do kitchens, e-design, staging — in the style and price range you want." },
            { icon: Wand2, t: "Get matched to up to three studios", d: "Answer a few questions about your project and see which studios fit, and why." },
            { icon: Scale, t: "Compare studios side by side", d: "Put shortlisted studios next to each other on services, area, pricing and reviews." },
            { icon: MessageSquare, t: "Read and write client reviews", d: "See what past clients say, and add your own experience after a project." },
            { icon: ShieldCheck, t: "Request consultations", d: "Send your brief to the studios you choose — not to everyone at once." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-5">
              <Icon className="h-5 w-5 text-brand" />
              <h3 className="mt-3 font-semibold text-foreground">{t}</h3>
              <p className="mt-1 text-sm">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <img
        src={CONSULT_IMAGE}
        alt="Designer reviewing a project brief and finish samples with clients at a table"
        loading="lazy"
        className="mt-14 h-64 w-full rounded-3xl object-cover"
      />

      <Section title="Services covered">
        <p>
          From a single-room refresh to a whole-home programme, every service has its own page explaining scope, process
          and realistic cost.
        </p>
        <div className="flex flex-wrap gap-2">
          {services.map((s) => (
            <Link
              key={s.slug}
              to="/service/$slug"
              params={{ slug: s.slug }}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground hover:border-brand hover:text-brand"
            >
              {s.name}
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Cities we cover">
        <p>Design studios across {stats.states.toLocaleString()} states, organised by metro area.</p>
        <div className="flex flex-wrap gap-2">
          {cities.map((c) => (
            <Link
              key={c.slug}
              to="/designers/$state/$city"
              params={{ state: c.state.toLowerCase(), city: c.slug }}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground hover:border-brand hover:text-brand"
            >
              {c.name}, {c.state}
            </Link>
          ))}
        </div>
      </Section>

      <Section title="For design studios">
        <p>
          If you run a studio, your listing is yours to shape. Claim it to publish your portfolio and services, respond
          to reviews in your own words, and receive consultation requests from homeowners who already know what they're
          looking for.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link to="/claim">Claim your studio</Link></Button>
          <Button asChild variant="outline"><Link to="/for-business">How it works for studios</Link></Button>
        </div>
      </Section>

      <Section title="How we stay independent">
        <p>
          Intearior makes money from studios that choose to upgrade their own presence on the directory — never from
          selling rank, badges or editorial coverage. Match results and orderings are produced the same way whether a
          studio pays us anything or not.
        </p>
      </Section>

      <Section title="Common questions">
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {FAQS.map((f) => (
            <div key={f.q} className="p-5">
              <h3 className="font-semibold text-foreground">{f.q}</h3>
              <p className="mt-1.5 text-sm">{f.a}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="mt-12 rounded-2xl border border-border bg-secondary/30 p-6">
        <h2 className="font-display text-2xl">Before you hire</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This site is informational only. Always verify a studio's licensing, insurance and professional credentials
          (such as ASID or NCIDQ membership) and read any contract carefully before starting a project.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild size="lg"><Link to="/search">Find a designer</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/match">Get matched</Link></Button>
        <Button asChild size="lg" variant="ghost"><Link to="/claim">Claim your studio</Link></Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_site/about")({
  loader: ({ context }) => context.queryClient.ensureQueryData(dirStatsOpts),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://interiorslist.lovable.app/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://interiorslist.lovable.app/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Intearior",
          url: "https://interiorslist.lovable.app",
          description: DESCRIPTION,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: AboutPage,
});
