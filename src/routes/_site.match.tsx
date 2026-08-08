import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MatchResultCard } from "@/components/match-result-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CITIES, serviceName, styleLabel, projectTypeLabel, BUDGET_BANDS } from "@/lib/cities";
import { CONSULT_IMAGE } from "@/lib/style-images";
import { getMatches } from "@/lib/match.functions";
import { sendContactMessage } from "@/lib/contact.functions";
import { nextMatchStep, type MatchCriteria, type MatchQuestion } from "@/lib/match-ai.functions";
import { BadgeCheck, Check, ChevronLeft, Loader2, Lock, Sparkles } from "lucide-react";


const PRIORITY_SERVICE: Record<string, string> = {
  "full-home": "full-home-design",
  "kitchen-bath": "kitchen-design",
  "living-spaces": "living-dining",
  workspace: "home-office",
  commercial: "commercial-office",
  furnishing: "furniture-sourcing",
  virtual: "e-design",
  exploring: "",
};

export const Route = createFileRoute("/_site/match")({
  validateSearch: z.object({ priority: z.string().optional(), city: z.string().optional(), q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Get Matched with an Interior Designer | Intearior" },
      { name: "description", content: "Answer a few AI-guided questions about your space, style, budget and timeline and we'll shortlist interior design studios that fit your project." },
      { property: "og:title", content: "Get Matched with an Interior Designer" },
      { property: "og:description", content: "Tell us about your project and our assistant will shortlist design studios that fit." },
      { property: "og:url", content: "/match" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Get Matched with an Interior Designer" },
      { name: "twitter:description", content: "Tell us about your project and our assistant will shortlist design studios that fit." },
    ],
    links: [{ rel: "canonical", href: "/match" }],
  }),
  component: MatchPage,
});

type Turn = { question: string; answer: string };

function OptionRow({ selected, label, onClick, multi }: { selected: boolean; label: string; onClick: () => void; multi?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${selected ? "border-brand bg-brand/5" : "border-border bg-card hover:border-brand/60"}`}
    >
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center border ${multi ? "rounded" : "rounded-full"} ${selected ? "border-brand bg-brand text-brand-foreground" : "border-border"}`}>
        {selected && <Check className="h-3 w-3" />}
      </div>
      <p className="font-medium">{label}</p>
    </button>
  );
}

function MatchPage() {
  const { priority: initialPriority, city: initialCity, q: initialQ } = Route.useSearch();
  const ask = useServerFn(nextMatchStep);
  const fetchMatches = useServerFn(getMatches);

  const [citySlug, setCitySlug] = useState(initialCity ?? "any");
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [step, setStep] = useState<MatchQuestion | null>(null);
  const [progress, setProgress] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [thinking, setThinking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [criteria, setCriteria] = useState<MatchCriteria | null>(null);
  const [results, setResults] = useState<Awaited<ReturnType<typeof getMatches>>["matches"] | null>(null);
  const [selected, setSelected] = useState<{ placeId: string; name: string } | null>(null);
  const started = useRef(false);

  async function advance(next: Turn[]) {
    setThinking(true);
    setError(null);
    setPicked([]);
    setFreeText("");
    try {
      const res = await ask({ data: { transcript: next, citySlug } });
      setProgress(res.progress);
      if (res.kind === "question") {
        setStep(res.step);
      } else {
        setCriteria(res.criteria);
        const m = await fetchMatches({
          data: {
            priority: res.criteria.priority,
            concerns: res.criteria.concerns,
            styles: res.criteria.styles,
            projectType: res.criteria.projectType,
            budget: res.criteria.budget,
            timing: res.criteria.timing,
            citySlug,
            preferences: citySlug === "any" ? ["remote-ok"] : [],
          },
        });
        setResults(m.matches);
        setSelected(m.matches[0] ? { placeId: m.matches[0].place_id, name: m.matches[0].name } : null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setThinking(false);
    }
  }

  // Kick off the conversation, seeding whatever the homepage hero already collected.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const seed: Turn[] = [];
    if (initialQ) seed.push({ question: "What would you like designed?", answer: initialQ });
    else if (initialPriority) seed.push({ question: "What would you like designed?", answer: initialPriority.replace(/-/g, " ") });
    void advance(seed);
    setTranscript(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submitAnswer(answer: string) {
    if (!step || !answer.trim()) return;
    const next = [...transcript, { question: step.question, answer: answer.trim().slice(0, 400) }];
    setTranscript(next);
    void advance(next);
  }

  function back() {
    if (transcript.length === 0) return;
    const next = transcript.slice(0, -1);
    setTranscript(next);
    void advance(next);
  }

  function restart() {
    setResults(null);
    setCriteria(null);
    setSelected(null);
    setTranscript([]);
    void advance([]);
  }

  /* ----------------------------- results ----------------------------- */
  if (results) {
    if (results.length === 0) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="font-display text-4xl">No matches yet</h1>
          <p className="mt-3 text-muted-foreground">Try widening your city, or browse the full directory.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={restart}>Start over</Button>
            <Button asChild><Link to="/search">Browse all studios</Link></Button>
          </div>
        </div>
      );
    }

    const cityName = citySlug === "any" ? "your area" : (CITIES.find((c) => c.slug === citySlug)?.name ?? "your area");
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <button onClick={restart} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
          <ChevronLeft className="h-4 w-4" /> Start again
        </button>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">Your matches</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {criteria?.summary ? `${criteria.summary} ` : ""}
          {results.length} {results.length === 1 ? "studio" : "studios"} in {cityName} fit your brief.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r) => (
            <div key={r.place_id} className="flex flex-col">
              <span className="mb-2 self-start rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-brand-foreground">
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
              <Button
                variant={selected?.placeId === r.place_id ? "default" : "outline"}
                className="mt-2 rounded-full"
                onClick={() => {
                  setSelected({ placeId: r.place_id, name: r.name });
                  document.getElementById("send-brief")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {selected?.placeId === r.place_id ? "Selected" : "Send my brief"}
              </Button>
            </div>
          ))}
        </div>

        {selected && (
          <section id="send-brief" className="mt-12 grid gap-6 overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-[1fr_1.1fr]">
            <img
              src={CONSULT_IMAGE}
              alt="Interior designer reviewing plans and samples with clients"
              loading="lazy"
              width={1440}
              height={720}
              className="h-full min-h-64 w-full object-cover"
            />
            <div className="p-6 md:p-8">
              <h2 className="font-display text-2xl">Send your project brief to {selected.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">We've pre-filled your answers — add your details and we'll pass it straight to the studio.</p>
              <div className="mt-6">
                <ConsultationForm
                  key={selected.placeId}
                  placeId={selected.placeId}
                  studioName={selected.name}
                  compact
                  defaults={{
                    service: PRIORITY_SERVICE[criteria?.priority ?? ""] ?? "",
                    projectType: criteria?.projectType ?? "",
                    budget: criteria?.budget ?? "",
                    style: criteria?.styles?.[0] ?? "",
                  }}
                />
              </div>
            </div>
          </section>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" className="rounded-full"><Link to="/search">Browse all studios</Link></Button>
          <Button variant="ghost" className="rounded-full" onClick={restart}>Start over</Button>
        </div>
      </div>
    );
  }

  /* --------------------------- conversation --------------------------- */
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <p className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand">
          <Sparkles className="h-3 w-3" /> AI matching
        </p>
        <div className="mx-auto mt-4 h-1.5 max-w-md overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${Math.max(8, progress)}%` }} />
        </div>
      </div>

      {transcript.length > 0 && (
        <button onClick={back} disabled={thinking} className="mt-8 flex items-center gap-1 text-sm text-muted-foreground hover:text-brand disabled:opacity-50">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
      )}

      {transcript.length > 0 && (
        <div className="mt-6 space-y-2">
          {transcript.map((t, i) => (
            <div key={i} className="rounded-xl border border-border/70 bg-secondary/30 px-4 py-2 text-sm">
              <span className="text-muted-foreground">{t.question}</span>
              <span className="ml-2 font-medium">{t.answer}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm">
          <p>{error}</p>
          <Button className="mt-3 rounded-full" size="sm" onClick={() => void advance(transcript)}>Try again</Button>
        </div>
      )}

      {thinking && !error && (
        <div className="mt-10 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
          <p>{transcript.length === 0 ? "Setting up your consultation…" : "Thinking about your next question…"}</p>
        </div>
      )}

      {!thinking && !error && step && (
        <div className="mt-8">
          <h1 className="font-display text-3xl md:text-4xl">{step.question}</h1>
          {step.helper && <p className="mt-2 text-muted-foreground">{step.helper}</p>}

          <div className="mt-6 space-y-3">
            {step.options.map((opt) => (
              <OptionRow
                key={opt}
                multi={step.multi}
                selected={picked.includes(opt)}
                label={opt}
                onClick={() => {
                  if (step.multi) setPicked((p) => (p.includes(opt) ? p.filter((x) => x !== opt) : [...p, opt]));
                  else submitAnswer(opt);
                }}
              />
            ))}
          </div>

          {step.allowFreeText && (
            <div className="mt-4 flex gap-2">
              <Input
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitAnswer(freeText); }}
                placeholder="Or describe it in your own words…"
                className="h-12"
              />
              <Button variant="outline" className="h-12 rounded-full px-6" onClick={() => submitAnswer(freeText)} disabled={!freeText.trim()}>
                Send
              </Button>
            </div>
          )}

          {step.multi && (
            <Button className="mt-6 w-full rounded-full md:w-auto md:px-10" disabled={picked.length === 0} onClick={() => submitAnswer(picked.join(", "))}>
              Continue
            </Button>
          )}

          <div className="mt-8 space-y-3 rounded-2xl border border-border bg-card p-4">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Where is your project?</label>
            <Select value={citySlug} onValueChange={setCitySlug}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="any">Anywhere / virtual</SelectItem>
                {CITIES.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}, {c.state}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <p className="mt-6 flex items-center gap-1 text-xs text-muted-foreground">
            <BadgeCheck className="h-3.5 w-3.5 text-brand" /> We never sell your details. You choose who to contact.
          </p>
        </div>
      )}
    </div>
  );
}
