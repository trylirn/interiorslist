import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BadgeCheck, Eye, MessageSquare, BarChart3, ShieldCheck, Building2 } from "lucide-react";

export const Route = createFileRoute("/_site/for-business")({
  head: () => ({
    meta: [
      { title: "For Business — Claim Your Medspa Listing | Discover Medspa" },
      { name: "description", content: "Claim or submit your Texas medspa listing free. Manage your profile, respond to inquiries, and reach high-intent patients across Texas." },
      { property: "og:title", content: "For Business | Discover Medspa" },
      { property: "og:description", content: "Claim or submit your Texas medspa listing free." },
    ],
    links: [{ rel: "canonical", href: "/for-business" }],
  }),
  component: ForBusiness,
});

function ForBusiness() {
  return (
    <>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">For Medspa Owners</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Grow your Texas medspa.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Get discovered by patients actively searching for Botox, fillers, and aesthetic treatments in your city — free.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full"><Link to="/login">Submit your business</Link></Button>
            <Button asChild size="lg" variant="outline" className="rounded-full"><Link to="/claim">Claim existing listing</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-center font-display text-3xl md:text-4xl">What you get</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Benefit Icon={Eye} title="Discovery" body="Show up in city, treatment, brand, and concern searches across our directory." />
          <Benefit Icon={MessageSquare} title="Direct leads" body="Patient inquiries land in your dashboard. No middlemen, no commissions." />
          <Benefit Icon={BadgeCheck} title="Verified badge" body="A verified badge signals trust to high-intent patients." />
          
          <Benefit Icon={BarChart3} title="Lead status tracking" body="Mark inquiries as new / contacted / closed to keep your team aligned." />
          <Benefit Icon={ShieldCheck} title="Profile control" body="Edit hours, services, photos, specialists, and credentials anytime." />
        </div>
      </section>

      <section className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <h2 className="text-center font-display text-3xl md:text-4xl">How it works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { n: "1", t: "Submit or claim", d: "If you're listed already, claim it. If not, submit your business in under 2 minutes." },
              { n: "2", t: "Verify ownership", d: "We confirm you represent the business via the contact info on your website or business email." },
              { n: "3", t: "Manage & grow", d: "Edit your profile, see leads, and update services from your dashboard." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-card p-8">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-bold text-brand-foreground">{s.n}</span>
                <h3 className="mt-4 font-display text-xl">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-center font-display text-3xl">Owner FAQ</h2>
        <Accordion type="single" collapsible className="mt-8">
          {OWNER_FAQ.map((f, i) => (
            <AccordionItem key={i} value={`f-${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-12 rounded-3xl bg-brand p-10 text-center text-brand-foreground">
          <h3 className="font-display text-3xl">Ready to start?</h3>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="rounded-full"><Link to="/submit">Submit your business</Link></Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-transparent text-brand-foreground border-brand-foreground/40 hover:bg-brand-foreground/10"><Link to="/login">Sign in to claim</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Benefit({ Icon, title, body }: { Icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <Icon className="h-7 w-7 text-brand" />
      <h3 className="mt-4 font-display text-lg">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

const OWNER_FAQ = [
  { q: "Is it really free?", a: "Yes — listing, claiming, and managing your profile is free. No commissions on leads." },
  { q: "How long does verification take?", a: "Most claims are verified within 1–2 business days." },
  { q: "Can I edit my services and prices?", a: "You can edit services, specialists, photos, hours, and contact info. We don't display prices to keep listings consistent." },
  { q: "What happens with leads?", a: "Patient inquiries appear in your dashboard and you can mark them new / contacted / closed." },
  { q: "Can I manage multiple locations?", a: "Yes — if you're a brand with multiple branches, each branch is its own listing and rolls up under your brand page." },
];
