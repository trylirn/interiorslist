import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { TEXAS_CITIES } from "@/lib/cities";
import { getMatches } from "@/lib/match.functions";
import { ProviderCard } from "@/components/provider-card";
import { BadgeCheck, Check, ChevronLeft, Sparkles } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/_site/match")({
  validateSearch: z.object({
    priority: z.string().optional(),
    city: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Find a Texas Medspa | Texas Aesthetics" },
      { name: "description", content: "Pick your priority and city to browse verified Texas medspas and aesthetic injectors that match." },
      { property: "og:title", content: "Find a Texas Medspa — Texas Aesthetics" },
      { property: "og:description", content: "Browse verified Texas medspas in seconds." },
      { property: "og:url", content: "/match" },
    ],
    links: [{ rel: "canonical", href: "/match" }],
  }),
  component: MatchPage,
});

const PRIORITY_OPTS = [
  { id: "botox", label: "Botox & wrinkle relaxers", desc: "Forehead, frown, crow's feet" },
  { id: "fillers", label: "Dermal fillers", desc: "Lips, cheeks, jawline, volume" },
  { id: "skin", label: "Skin treatments", desc: "Microneedling, peels, PRP, glow" },
  { id: "body", label: "Body contouring", desc: "Kybella, Sculptra, slimming" },
  { id: "laser", label: "Laser treatments", desc: "Hair removal, resurfacing, IPL" },
  { id: "wellness", label: "IV therapy & wellness", desc: "Hydration, vitamins, recovery" },
  { id: "exploring", label: "Just exploring", desc: "Show me everything" },
];

function MatchPage() {
  const { priority: initialPriority, city: initialCity } = Route.useSearch();
  const [step, setStep] = useState(initialPriority ? 1 : 0);
  const [priority, setPriority] = useState(initialPriority ?? "");
  const [citySlug, setCitySlug] = useState(initialCity ?? "any");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Awaited<ReturnType<typeof getMatches>>["matches"] | null>(null);
  const fetchMatches = useServerFn(getMatches);

  const canNext = step === 0 ? !!priority : !!citySlug;

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetchMatches({ data: { priority, citySlug } });
      setResults(res.matches);
    } finally {
      setSubmitting(false);
    }
  }

  if (results) {
    if (results.length === 0) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="font-display text-4xl">No matches yet</h1>
          <p className="mt-3 text-muted-foreground">Try widening your city or treatment criteria.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => { setResults(null); setStep(0); }}>Start over</Button>
            <Button asChild><Link to="/search">Browse all providers</Link></Button>
          </div>
        </div>
      );
    }

    const cityName = citySlug === "any" ? "Texas" : (TEXAS_CITIES.find((c) => c.slug === citySlug)?.name ?? "Texas");
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <button onClick={() => setResults(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
          <ChevronLeft className="h-4 w-4" /> Refine your search
        </button>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">Your matches</h1>
        <p className="mt-3 text-muted-foreground">
          {results.length} verified {results.length === 1 ? "provider" : "providers"} in {cityName} for{" "}
          <span className="font-medium text-foreground">{PRIORITY_OPTS.find((o) => o.id === priority)?.label ?? priority}</span>.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Tap a card to view services, hours, reviews, and contact details. Reach out to any provider directly — we don't share your info.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r) => (
            <div key={r.place_id} className="relative">
              <span className="absolute right-3 top-3 z-10 rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-brand-foreground">
                {r.matchPercent}% match
              </span>
              <ProviderCard
                place_id={r.place_id}
                slug={r.slug}
                name={r.name}
                city={r.city}
                address={r.address}
                services={r.services}
                specialists={r.specialists}
                branch_label={r.branch_label}
                is_verified={r.is_verified}
              />
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" className="rounded-full"><Link to="/search">Browse all providers</Link></Button>
          <Button variant="ghost" className="rounded-full" onClick={() => { setResults(null); setStep(0); }}>Start over</Button>
        </div>
      </div>
    );
  }

  const totalSteps = 2;
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Step {step + 1} of {totalSteps}</p>
        <div className="mx-auto mt-3 flex max-w-md gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-border"}`} />
          ))}
        </div>
      </div>

      {step > 0 && (
        <button onClick={() => setStep(step - 1)} className="mt-8 flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
      )}

      <div className="mt-6">
        {step === 0 && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">What are you looking for?</h1>
            <p className="mt-2 text-muted-foreground">Pick the treatment category you want to explore.</p>
            <div className="mt-6 space-y-3">
              {PRIORITY_OPTS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPriority(opt.id)}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition ${priority === opt.id ? "border-brand bg-brand/5" : "border-border bg-card hover:border-brand/60"}`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded border ${priority === opt.id ? "border-brand bg-brand text-brand-foreground" : "border-border"}`}>
                    {priority === opt.id && <Check className="h-3 w-3" />}
                  </div>
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-sm text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Where in Texas?</h1>
            <p className="mt-2 text-muted-foreground">We'll prioritize verified providers in your area.</p>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button
                onClick={() => setCitySlug("any")}
                className={`rounded-xl border p-3 text-sm transition ${citySlug === "any" ? "border-brand bg-brand/5 font-medium" : "border-border bg-card hover:border-brand/60"}`}
              >
                Any city
              </button>
              {TEXAS_CITIES.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setCitySlug(c.slug)}
                  className={`rounded-xl border p-3 text-sm transition ${citySlug === c.slug ? "border-brand bg-brand/5 font-medium" : "border-border bg-card hover:border-brand/60"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <BadgeCheck className="h-3.5 w-3.5 text-brand" /> No forms, no lead-selling. Browse and reach out directly.
        </p>
        {step < totalSteps - 1 ? (
          <Button disabled={!canNext} onClick={() => setStep(step + 1)} className="rounded-full px-8">
            Continue
          </Button>
        ) : (
          <Button disabled={!canNext || submitting} onClick={submit} className="rounded-full px-8">
            <Sparkles className="mr-2 h-4 w-4" />
            {submitting ? "Finding…" : "Show matches"}
          </Button>
        )}
      </div>
    </div>
  );
}
