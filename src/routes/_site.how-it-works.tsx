import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Search, ListChecks, MessageSquare, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_site/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works | Discover Medspa" },
      { name: "description", content: "How Discover Medspa verifies medspas and helps you find a trusted aesthetic injector." },
      { property: "og:title", content: "How It Works | Discover Medspa" },
      { property: "og:description", content: "How we verify medspas and help you find a trusted injector." },
    ],
    links: [{ rel: "canonical", href: "/how-it-works" }],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">How It Works</p>
      <h1 className="mt-3 font-display text-5xl md:text-6xl">A simple, transparent process.</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        Discover Medspa is an independent directory. We verify every listing, surface credentials, and let you contact providers directly — no middlemen.
      </p>

      <div className="mt-14 space-y-10">
        <Block n="1" Icon={ListChecks} title="Tell us what you want">
          Pick a treatment (Botox, lip filler, Morpheus8…), a concern (acne scars, jawline, glow), or just a city. Or take our 60-second match quiz for tailored recommendations.
        </Block>
        <Block n="2" Icon={Search} title="See verified providers">
          Every listing is reviewed for valid business info, an active website, and credentialed practitioners. You see specialists, services, locations, and credentials up front.
        </Block>
        <Block n="3" Icon={MessageSquare} title="Reach out directly">
          Message the clinic from their profile. The clinic gets the inquiry in their dashboard and responds to you directly. We don't take a cut.
        </Block>
        <Block n="4" Icon={ShieldCheck} title="Verify before you book">
          We link to provider websites and surface MD / DO / NP / PA / RN credentials, but always confirm a practitioner's license on the Texas Medical Board or Texas Board of Nursing site before treatment.
        </Block>
      </div>

      <div className="mt-16 flex flex-wrap gap-3">
        <Button asChild size="lg" className="rounded-full"><Link to="/match">Take the match quiz</Link></Button>
        <Button asChild size="lg" variant="outline" className="rounded-full"><Link to="/search">Browse providers</Link></Button>
      </div>
    </div>
  );
}

function Block({ n, Icon, title, children }: { n: string; Icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-6">
      <div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-bold text-brand-foreground">{n}</span>
      </div>
      <div className="flex-1 border-l border-border pl-6">
        <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-brand" /><h2 className="font-display text-2xl">{title}</h2></div>
        <p className="mt-3 text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
