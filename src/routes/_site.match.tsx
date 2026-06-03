import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TEXAS_CITIES } from "@/lib/cities";
import { getMatches } from "@/lib/match.functions";
import { sendContactMessage } from "@/lib/contact.functions";
import { toast } from "sonner";
import { BadgeCheck, Building2, Check, CheckCircle2, ChevronLeft, Lock, Send, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";

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
  const [phase, setPhase] = useState<"review" | "consult" | "done">("review");
  const [messageNote, setMessageNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string[]>([]);
  const fetchMatches = useServerFn(getMatches);
  const sendMessage = useServerFn(sendContactMessage);

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

    const interested = results.filter((r) => responses[r.place_id] === "interested");
    const allReviewed = results.every((r) => responses[r.place_id]);

    // ── DONE: request results screen ────────────────────────────────
    if (phase === "done") {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-brand" />
          <h1 className="mt-4 font-display text-4xl">Requests sent!</h1>
          <p className="mt-3 text-muted-foreground">
            {sentTo.length === 1 ? "1 provider has" : `${sentTo.length} providers have`} received your consult request. They'll reach out at {answers.email}.
          </p>
          <div className="mt-8 space-y-3 text-left">
            {results.filter((r) => sentTo.includes(r.place_id)).map((r) => (
              <Link
                key={r.place_id}
                to="/provider/$slug"
                params={{ slug: r.slug }}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:border-brand"
              >
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.city}, TX</p>
                </div>
                <span className="text-xs text-brand">View profile →</span>
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline" className="rounded-full"><Link to="/search">Browse all providers</Link></Button>
            <Button asChild className="rounded-full"><Link to="/dashboard">Track replies</Link></Button>
          </div>
        </div>
      );
    }

    // ── CONSULT: confirm + send to interested providers ─────────────
    if (phase === "consult") {
      async function submitConsults() {
        if (interested.length === 0) return;
        setSending(true);
        const message =
          (messageNote || `Hi! I'm interested in a consult.`) +
          `\n\nWhat I'm focused on: ${PRIORITY_OPTS.find((o) => o.id === answers.priority)?.label ?? answers.priority}.` +
          (answers.concerns.length ? `\nConcerns: ${answers.concerns.join(", ")}.` : "") +
          (answers.timing ? `\nTiming: ${TIMING_OPTS.find((o) => o.id === answers.timing)?.label}.` : "") +
          (answers.budget ? `\nBudget: ${BUDGET_OPTS.find((o) => o.id === answers.budget)?.label}.` : "") +
          `\n\nFound you via Texas Aesthetics.`;
        const sent: string[] = [];
        for (const p of interested) {
          try {
            await sendMessage({
              data: {
                placeId: p.place_id,
                firstName: answers.firstName,
                lastName: answers.lastName,
                email: answers.email,
                phone: "",
                message,
              },
            });
            sent.push(p.place_id);
          } catch {
            // continue with the rest
          }
        }
        setSentTo(sent);
        setSending(false);
        if (sent.length === 0) {
          toast.error("Couldn't send any requests. Please try again.");
        } else {
          toast.success(`Sent ${sent.length} request${sent.length === 1 ? "" : "s"}`);
          setPhase("done");
        }
      }

      return (
        <div className="mx-auto max-w-2xl px-4 py-12">
          <button onClick={() => setPhase("review")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
            <ChevronLeft className="h-4 w-4" /> Back to matches
          </button>
          <h1 className="mt-4 font-display text-4xl md:text-5xl">Request your consults</h1>
          <p className="mt-3 text-muted-foreground">
            We'll send your details and goals to the {interested.length} {interested.length === 1 ? "provider" : "providers"} you're interested in. You can skip any time.
          </p>

          <div className="mt-6 space-y-3">
            {interested.map((p) => (
              <div key={p.place_id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 font-display text-brand">{p.name.charAt(0)}</div>
                <div className="flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.city}, TX</p>
                </div>
                <button
                  onClick={() => setResponses({ ...responses, [p.place_id]: "not_a_fit" })}
                  className="text-xs text-muted-foreground hover:text-rose-500"
                  aria-label="Remove"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <label className="mt-6 block text-sm">
            <span className="font-medium">Anything else they should know? (optional)</span>
            <Textarea
              className="mt-2 min-h-24"
              value={messageNote}
              onChange={(e) => setMessageNote(e.target.value)}
              placeholder="e.g., flexible weekdays, first-time client, specific questions..."
              maxLength={2000}
            />
          </label>

          <Button
            onClick={submitConsults}
            disabled={sending || interested.length === 0}
            className="mt-6 w-full rounded-full text-base"
          >
            <Send className="mr-2 h-4 w-4" />
            {sending
              ? "Sending…"
              : interested.length === 0
                ? "Pick at least one provider to continue"
                : `Send to ${interested.length} ${interested.length === 1 ? "provider" : "providers"} →`}
          </Button>
        </div>
      );
    }

    // ── REVIEW: swipe through matches ───────────────────────────────
    const active = results[activeIdx];
    const remaining = results.length - activeIdx - 1;
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-center">
          <h1 className="font-display text-4xl md:text-5xl">Your top matches</h1>
          <p className="mt-3 text-muted-foreground">Tap interested or not a fit for each — view full profiles below.</p>
          <div className="mt-6 inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent-foreground">
            Match {activeIdx + 1} of {results.length} · {interested.length} interested so far
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

        {/* CONTINUE TO CONSULT — appears once any matches are marked Interested OR after going through all */}
        {(interested.length > 0 && (remaining === 0 || allReviewed)) && (
          <div className="mt-8 rounded-3xl border border-brand bg-brand/5 p-6 text-center md:p-8">
            <CheckCircle2 className="mx-auto h-10 w-10 text-brand" />
            <h2 className="mt-3 font-display text-2xl">You're done reviewing — ready to reach out?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {interested.length} {interested.length === 1 ? "provider" : "providers"} marked as interested.
            </p>
            <Button onClick={() => setPhase("consult")} className="mt-5 rounded-full px-8">
              Request consults →
            </Button>
          </div>
        )}

        {interested.length > 0 && remaining > 0 && (
          <div className="mt-6 text-center">
            <button onClick={() => setPhase("consult")} className="text-sm font-medium text-brand hover:underline">
              Skip ahead — request consults from the {interested.length} you've picked →
            </button>
          </div>
        )}

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
