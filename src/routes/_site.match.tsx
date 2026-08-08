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
  const [chosen, setChosen] = useState<string[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string[] | null>(null);
  const send = useServerFn(sendContactMessage);
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
        setChosen(m.matches.map((x) => x.place_id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setThinking(false);
    }
  }

  // Kick off the conversation once the location step is done,
  // seeding whatever the homepage hero already collected.
  function beginConversation() {
    if (started.current) return;
    started.current = true;
    const seed: Turn[] = [];
    if (initialQ) seed.push({ question: "What would you like designed?", answer: initialQ });
    else if (initialPriority) seed.push({ question: "What would you like designed?", answer: initialPriority.replace(/-/g, " ") });
    void advance(seed);
    setTranscript(seed);
  }


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
    setChosen([]);
    setUnlocked(false);
    setSentTo(null);
    setTranscript([]);
    void advance([]);
  }

  function buildBrief() {
    return [
      criteria?.summary && `Brief: ${criteria.summary}`,
      criteria?.priority && `Focus: ${PRIORITY_SERVICE[criteria.priority] ? serviceName(PRIORITY_SERVICE[criteria.priority]!) : criteria.priority.replace(/-/g, " ")}`,
      criteria?.projectType && `Project type: ${projectTypeLabel(criteria.projectType)}`,
      criteria?.styles?.length && `Preferred styles: ${criteria.styles.map(styleLabel).join(", ")}`,
      criteria?.budget && `Budget: ${BUDGET_BANDS.find((b) => b.slug === criteria.budget)?.label ?? criteria.budget}`,
      criteria?.timing && `Timeline: ${criteria.timing.replace(/-/g, " ")}`,
      citySlug !== "any" && `Location: ${CITIES.find((c) => c.slug === citySlug)?.name ?? citySlug}`,
      "",
      ...transcript.map((t) => `${t.question} — ${t.answer}`),
      notes && `\nNotes:\n${notes}`,
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 3900);
  }

  function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please add your first and last name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setUnlocked(true);
    toast.success("Your matches are unlocked.");
  }

  async function sendBrief() {
    if (!results || chosen.length === 0) return;
    setSending(true);
    try {
      const message = buildBrief() || "Consultation request";
      const picks = results.filter((r) => chosen.includes(r.place_id));
      for (const p of picks) {
        await send({
          data: {
            placeId: p.place_id,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim() || "not provided",
            message,
          },
        });
      }
      setSentTo(picks.map((p) => p.name));
      toast.success(`Brief sent to ${picks.length} ${picks.length === 1 ? "studio" : "studios"}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your brief.");
    } finally {
      setSending(false);
    }
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
          We found {results.length} {results.length === 1 ? "studio" : "studios"} in {cityName} that fit your brief.
        </p>

        <div className="relative mt-8">
          <div className={unlocked ? "" : "pointer-events-none select-none blur-md"} aria-hidden={!unlocked}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r) => (
                <MatchResultCard
                  key={r.place_id}
                  m={r}
                  selectable={unlocked && !sentTo}
                  selected={chosen.includes(r.place_id)}
                  onToggle={() =>
                    setChosen((c) => (c.includes(r.place_id) ? c.filter((x) => x !== r.place_id) : [...c, r.place_id]))
                  }
                />
              ))}
            </div>
          </div>

          {!unlocked && (
            <div className="absolute inset-0 flex items-start justify-center p-4">
              <form
                onSubmit={unlock}
                className="sticky top-24 w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl"
              >
                <p className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand">
                  <Lock className="h-3 w-3" /> Locked
                </p>
                <h2 className="mt-3 font-display text-2xl">
                  Your {results.length} {results.length === 1 ? "match is" : "matches are"} ready
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your details to reveal the studios. You choose who — if anyone — receives your brief.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">First name</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Last name</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" className="mt-5 w-full rounded-full">Request a consultation</Button>
                <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <BadgeCheck className="h-3.5 w-3.5 text-brand" /> We never sell your details.
                </p>
              </form>
            </div>
          )}
        </div>

        {unlocked && !sentTo && (
          <section id="send-brief" className="mt-10 grid gap-6 overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-[1fr_1.2fr]">
            <img
              src={CONSULT_IMAGE}
              alt="Interior designer reviewing plans and samples with clients"
              loading="lazy"
              width={1440}
              height={720}
              className="h-full min-h-64 w-full object-cover"
            />
            <div className="p-6 md:p-8">
              <h2 className="font-display text-2xl">Send your brief</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Pick the studios you'd like to hear from — tick as many as you want, or send to all.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setChosen(results.map((r) => r.place_id))}
                >
                  Select all
                </Button>
                <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => setChosen([])}>
                  Clear
                </Button>
                <span className="text-sm text-muted-foreground">{chosen.length} selected</span>
              </div>
              <div className="mt-4 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Anything else the studio should know?</Label>
                <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Square footage, what you like, what isn't working." />
              </div>
              <Button className="mt-5 w-full rounded-full" disabled={sending || chosen.length === 0} onClick={() => void sendBrief()}>
                {sending ? "Sending…" : `Send my brief to ${chosen.length} ${chosen.length === 1 ? "studio" : "studios"}`}
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                Your details go straight to the studios you pick.
              </p>
            </div>
          </section>
        )}

        {sentTo && (
          <section className="mt-10 rounded-3xl border border-brand/30 bg-brand/5 p-6 md:p-8">
            <h2 className="font-display text-2xl">Brief sent</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We passed your project brief to {sentTo.length} {sentTo.length === 1 ? "studio" : "studios"}. They'll reply to {email}.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {sentTo.map((n) => (
                <li key={n} className="rounded-full bg-card px-3 py-1 text-sm">
                  <Check className="mr-1 inline h-3.5 w-3.5 text-brand" />
                  {n}
                </li>
              ))}
            </ul>
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
