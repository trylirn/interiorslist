import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TEXAS_CITIES } from "@/lib/cities";
import { getMatches } from "@/lib/match.functions";
import { BadgeCheck, Building2, Check, ChevronLeft, Lock, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";

export const Route = createFileRoute("/_site/match")({
  head: () => ({
    meta: [
      { title: "Get Matched with a Texas Injector | Texas Aesthetics" },
      { name: "description", content: "Answer 5 quick questions and get matched with 3–8 verified Texas aesthetic injectors that fit your goals." },
      { property: "og:title", content: "Get Matched — Texas Aesthetics" },
      { property: "og:description", content: "Personalized injector matches in under 60 seconds." },
      { property: "og:url", content: "/match" },
    ],
    links: [{ rel: "canonical", href: "/match" }],
  }),
  component: MatchPage,
});

const PRIORITY_OPTS = [
  { id: "botox", label: "Botox & wrinkle relaxers", desc: "Smoothing forehead, frown, crow's feet" },
  { id: "fillers", label: "Dermal fillers", desc: "Lips, cheeks, jawline, volume restoration" },
  { id: "skin", label: "Skin treatments", desc: "Microneedling, peels, PRP, glow" },
  { id: "body", label: "Body contouring", desc: "Kybella, Sculptra, slimming" },
  { id: "wellness", label: "IV therapy & wellness", desc: "Hydration, vitamins, recovery" },
  { id: "exploring", label: "Just exploring", desc: "Show me everything" },
];

const CONCERN_OPTS = [
  { id: "wrinkles", label: "Wrinkles & fine lines" },
  { id: "volume", label: "Volume loss" },
  { id: "jawline", label: "Jawline definition" },
  { id: "lips", label: "Lip enhancement" },
  { id: "acne-scars", label: "Acne scars" },
  { id: "pigmentation", label: "Pigmentation / dark spots" },
  { id: "hair-loss", label: "Hair thinning" },
  { id: "glow", label: "Overall glow" },
];

const BUDGET_OPTS = [
  { id: "under-500", label: "Under $500" },
  { id: "500-1500", label: "$500 – $1,500" },
  { id: "1500-5000", label: "$1,500 – $5,000" },
  { id: "open", label: "I'm flexible" },
];

const TIMING_OPTS = [
  { id: "exploring", label: "Just exploring" },
  { id: "1-2-weeks", label: "Within 1–2 weeks" },
  { id: "month", label: "Within a month" },
  { id: "2-3-months", label: "Within 2–3 months" },
];

type Answers = {
  priority: string;
  concerns: string[];
  budget: string;
  timing: string;
  citySlug: string;
  firstName: string;
  lastName: string;
  email: string;
};

function MatchPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    priority: "",
    concerns: [],
    budget: "",
    timing: "",
    citySlug: "any",
    firstName: "",
    lastName: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Awaited<ReturnType<typeof getMatches>>["matches"] | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, "interested" | "not_a_fit">>({});
  const fetchMatches = useServerFn(getMatches);

  const totalSteps = 6;
  const canNext = (() => {
    if (step === 0) return !!answers.priority;
    if (step === 1) return answers.concerns.length > 0;
    if (step === 2) return !!answers.budget;
    if (step === 3) return !!answers.timing;
    if (step === 4) return !!answers.citySlug;
    if (step === 5) return answers.firstName && answers.lastName && /.+@.+\..+/.test(answers.email);
    return false;
  })();

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetchMatches({
        data: {
          priority: answers.priority,
          concerns: answers.concerns,
          citySlug: answers.citySlug,
          budget: answers.budget,
          timing: answers.timing,
        },
      });
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
          <Button asChild className="mt-6"><Link to="/search">Browse all providers</Link></Button>
        </div>
      );
    }
    const active = results[activeIdx];
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-center">
          <h1 className="font-display text-4xl md:text-5xl">Your top matches</h1>
          <p className="mt-3 text-muted-foreground">Tap interested or not a fit for each — view full profiles below.</p>
          <div className="mt-6 inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent-foreground">
            Match {activeIdx + 1} of {results.length} · {results.length - activeIdx - 1} more to review
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 font-display text-2xl text-brand">{active.name.charAt(0)}</div>
              <div>
                <h2 className="font-display text-2xl leading-tight">{active.name}</h2>
                <p className="text-sm text-muted-foreground">{active.city}, TX{active.branch_label ? ` · ${active.branch_label}` : ""}</p>
              </div>
            </div>
            <span className="rounded-full bg-brand px-3 py-1 text-sm font-semibold text-brand-foreground">{active.matchPercent}% match</span>
          </div>

          {active.is_verified && <p className="mt-4 flex items-center gap-1 text-sm text-brand"><BadgeCheck className="h-4 w-4" /> Verified provider</p>}
          {active.brand_id && <p className="mt-1 flex items-center gap-1 text-sm text-brand"><Building2 className="h-4 w-4" /> Multi-location brand</p>}
          {active.specialists && <p className="mt-4 text-foreground/85 leading-relaxed">{active.specialists}</p>}

          {active.services && active.services.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Treatments</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {active.services.slice(0, 8).map((s: string) => (
                  <span key={s} className="rounded-full bg-accent px-2.5 py-0.5 text-xs capitalize">{s.replace(/-/g, " ")}</span>
                ))}
              </div>
            </div>
          )}

          <Link to="/provider/$slug" params={{ slug: active.slug }} className="mt-6 inline-block text-sm font-medium text-brand hover:underline">View full profile →</Link>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setResponses({ ...responses, [active.place_id]: "not_a_fit" });
                if (activeIdx < results.length - 1) setActiveIdx(activeIdx + 1);
              }}
            >
              <ThumbsDown className="mr-2 h-4 w-4" /> Not a fit
            </Button>
            <Button
              className="rounded-full"
              onClick={() => {
                setResponses({ ...responses, [active.place_id]: "interested" });
                if (activeIdx < results.length - 1) setActiveIdx(activeIdx + 1);
              }}
            >
              <ThumbsUp className="mr-2 h-4 w-4" /> Interested
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {results.map((r, i) => (
            <button
              key={r.place_id}
              onClick={() => setActiveIdx(i)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${i === activeIdx ? "border-brand bg-brand/5" : "border-border bg-card hover:border-brand"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.name}</span>
                <span className="text-xs text-muted-foreground">{r.matchPercent}%</span>
              </div>
              {responses[r.place_id] && (
                <span className={`mt-1 text-xs ${responses[r.place_id] === "interested" ? "text-brand" : "text-muted-foreground"}`}>
                  {responses[r.place_id] === "interested" ? "✓ Interested" : "Not a fit"}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

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
            <h1 className="font-display text-3xl md:text-4xl">What's your biggest aesthetic priority?</h1>
            <p className="mt-2 text-muted-foreground">Pick the one that's most pressing.</p>
            <div className="mt-6 space-y-3">
              {PRIORITY_OPTS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswers({ ...answers, priority: opt.id })}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition ${answers.priority === opt.id ? "border-brand bg-brand/5" : "border-border bg-card hover:border-brand/60"}`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded border ${answers.priority === opt.id ? "border-brand bg-brand text-brand-foreground" : "border-border"}`}>
                    {answers.priority === opt.id && <Check className="h-3 w-3" />}
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
            <h1 className="font-display text-3xl md:text-4xl">What are you hoping to address?</h1>
            <p className="mt-2 text-muted-foreground">Pick up to 4 concerns.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {CONCERN_OPTS.map((opt) => {
                const on = answers.concerns.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      const next = on
                        ? answers.concerns.filter((c) => c !== opt.id)
                        : answers.concerns.length < 4
                          ? [...answers.concerns, opt.id]
                          : answers.concerns;
                      setAnswers({ ...answers, concerns: next });
                    }}
                    className={`rounded-xl border p-4 text-left text-sm transition ${on ? "border-brand bg-brand/5 font-medium" : "border-border bg-card hover:border-brand/60"}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">What's your budget?</h1>
            <p className="mt-2 text-muted-foreground">Per treatment / session.</p>
            <div className="mt-6 space-y-3">
              {BUDGET_OPTS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswers({ ...answers, budget: opt.id })}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${answers.budget === opt.id ? "border-brand bg-brand/5" : "border-border bg-card hover:border-brand/60"}`}
                >
                  <div className={`h-4 w-4 rounded-full border ${answers.budget === opt.id ? "border-brand bg-brand" : "border-border"}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">When are you looking to get started?</h1>
            <div className="mt-6 space-y-3">
              {TIMING_OPTS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswers({ ...answers, timing: opt.id })}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${answers.timing === opt.id ? "border-brand bg-brand/5" : "border-border bg-card hover:border-brand/60"}`}
                >
                  <div className={`h-4 w-4 rounded-full border ${answers.timing === opt.id ? "border-brand bg-brand" : "border-border"}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Where in Texas?</h1>
            <p className="mt-2 text-muted-foreground">We'll prioritize providers near you.</p>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button
                onClick={() => setAnswers({ ...answers, citySlug: "any" })}
                className={`rounded-xl border p-3 text-sm transition ${answers.citySlug === "any" ? "border-brand bg-brand/5 font-medium" : "border-border bg-card hover:border-brand/60"}`}
              >
                Any city
              </button>
              {TEXAS_CITIES.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setAnswers({ ...answers, citySlug: c.slug })}
                  className={`rounded-xl border p-3 text-sm transition ${answers.citySlug === c.slug ? "border-brand bg-brand/5 font-medium" : "border-border bg-card hover:border-brand/60"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">One more step</p>
            <h1 className="mt-2 font-display text-3xl md:text-4xl">Your matches are ready</h1>
            <p className="mt-2 text-muted-foreground">Enter your details to reveal your personalized matches.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium">First name <span className="text-rose-500">*</span></span>
                <Input value={answers.firstName} onChange={(e) => setAnswers({ ...answers, firstName: e.target.value })} className="mt-1" />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Last name <span className="text-rose-500">*</span></span>
                <Input value={answers.lastName} onChange={(e) => setAnswers({ ...answers, lastName: e.target.value })} className="mt-1" />
              </label>
              <label className="col-span-full block text-sm">
                <span className="font-medium">Email <span className="text-rose-500">*</span></span>
                <Input type="email" value={answers.email} onChange={(e) => setAnswers({ ...answers, email: e.target.value })} className="mt-1" />
              </label>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-foreground/80">Your information stays private. We only share details with providers you personally pick.</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        {step < totalSteps - 1 ? (
          <Button disabled={!canNext} onClick={() => setStep(step + 1)} className="rounded-full px-8">
            Continue
          </Button>
        ) : (
          <Button disabled={!canNext || submitting} onClick={submit} className="w-full rounded-full text-base">
            <Sparkles className="mr-2 h-4 w-4" />
            {submitting ? "Finding matches…" : "Reveal my matches →"}
          </Button>
        )}
      </div>
    </div>
  );
}
