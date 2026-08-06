import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ProviderCard } from "@/components/provider-card";
import { CITIES, STYLES, PROJECT_TYPES, BUDGET_BANDS } from "@/lib/cities";
import { getMatches } from "@/lib/match.functions";
import { BadgeCheck, Check, ChevronLeft, Sparkles } from "lucide-react";

const TOTAL_STEPS = 8;

const PRIORITY_OPTS = [
  { id: "full-home", label: "Full-home design", desc: "Every room, one coherent scheme" },
  { id: "kitchen-bath", label: "Kitchen or bathroom", desc: "Cabinetry, tile, fixtures and layout" },
  { id: "living-spaces", label: "Living, dining or bedroom", desc: "Furnishing and finishing key rooms" },
  { id: "workspace", label: "Home office or workspace", desc: "Work-from-home or studio setup" },
  { id: "commercial", label: "Commercial or hospitality", desc: "Office, retail, restaurant or clinic" },
  { id: "furnishing", label: "Furniture & styling only", desc: "No construction involved" },
  { id: "virtual", label: "Virtual / e-design", desc: "Remote plan you install yourself" },
  { id: "exploring", label: "Just exploring", desc: "Show me a bit of everything" },
];

const ROOM_OPTS = [
  { id: "whole-home", label: "Whole home" },
  { id: "kitchen", label: "Kitchen" },
  { id: "bathroom", label: "Bathroom" },
  { id: "living-room", label: "Living room" },
  { id: "dining-room", label: "Dining room" },
  { id: "bedroom", label: "Bedroom" },
  { id: "home-office", label: "Home office" },
  { id: "outdoor", label: "Outdoor / patio" },
  { id: "storage", label: "Storage & millwork" },
  { id: "lighting", label: "Lighting" },
  { id: "window-treatments", label: "Window treatments" },
  { id: "paint-color", label: "Paint & colour" },
];

const TIMING_OPTS = [
  { id: "asap", label: "As soon as possible" },
  { id: "1-3-months", label: "In 1–3 months" },
  { id: "3-6-months", label: "In 3–6 months" },
  { id: "planning", label: "Just planning" },
];

const PREFERENCE_OPTS = [
  { id: "verified-only", label: "Only show vetted studios" },
  { id: "highly-rated", label: "Highly rated (4.5★ and up)" },
  { id: "well-reviewed", label: "Lots of reviews" },
  { id: "boutique", label: "Small, boutique studio" },
  { id: "certified", label: "NCIDQ / ASID / IIDA credentials" },
  { id: "manages-build", label: "Can manage contractors and the build" },
  { id: "remote-ok", label: "Open to remote / virtual work" },
];

export const Route = createFileRoute("/_site/match")({
  validateSearch: z.object({ priority: z.string().optional(), city: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Get Matched with an Interior Designer | Interiors List" },
      { name: "description", content: "Answer eight quick questions about your space, style, budget and timeline and we'll shortlist interior design studios that fit your project." },
      { property: "og:title", content: "Get Matched with an Interior Designer" },
      { property: "og:description", content: "Tell us about your project and we'll shortlist design studios that fit." },
      { property: "og:url", content: "/match" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/match" }],
  }),
  component: MatchPage,
});

function OptionRow({ selected, label, desc, onClick, multi }: { selected: boolean; label: string; desc?: string; onClick: () => void; multi?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${selected ? "border-brand bg-brand/5" : "border-border bg-card hover:border-brand/60"}`}
    >
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center border ${multi ? "rounded" : "rounded-full"} ${selected ? "border-brand bg-brand text-brand-foreground" : "border-border"}`}>
        {selected && <Check className="h-3 w-3" />}
      </div>
      <div>
        <p className="font-medium">{label}</p>
        {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      </div>
    </button>
  );
}

function MatchPage() {
  const { priority: initialPriority, city: initialCity } = Route.useSearch();
  const [step, setStep] = useState(initialPriority ? 1 : 0);
  const [priority, setPriority] = useState(initialPriority ?? "");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [projectType, setProjectType] = useState("");
  const [styles, setStyles] = useState<string[]>([]);
  const [citySlug, setCitySlug] = useState(initialCity ?? "any");
  const [budget, setBudget] = useState("");
  const [timing, setTiming] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Awaited<ReturnType<typeof getMatches>>["matches"] | null>(null);
  const fetchMatches = useServerFn(getMatches);

  function toggle(list: string[], set: (v: string[]) => void, id: string) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  const canNext =
    step === 0 ? !!priority :
    step === 2 ? !!projectType :
    step === 4 ? !!citySlug :
    step === 5 ? !!budget :
    true;

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetchMatches({
        data: { priority, concerns, citySlug, budget, timing, preferences, styles, projectType },
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
          <p className="mt-3 text-muted-foreground">Try widening your city, budget or preference filters.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => { setResults(null); setStep(0); }}>Start over</Button>
            <Button asChild><Link to="/search">Browse all studios</Link></Button>
          </div>
        </div>
      );
    }

    const cityName = citySlug === "any" ? "your area" : (CITIES.find((c) => c.slug === citySlug)?.name ?? "your area");
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <button onClick={() => setResults(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
          <ChevronLeft className="h-4 w-4" /> Refine your answers
        </button>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">Your matches</h1>
        <p className="mt-3 text-muted-foreground">
          {results.length} {results.length === 1 ? "studio" : "studios"} in {cityName} for{" "}
          <span className="font-medium text-foreground">{PRIORITY_OPTS.find((o) => o.id === priority)?.label ?? priority}</span>.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Open any profile to see services, styles, typical project budgets and to send an enquiry form straight to the studio.
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
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" className="rounded-full"><Link to="/search">Browse all studios</Link></Button>
          <Button variant="ghost" className="rounded-full" onClick={() => { setResults(null); setStep(0); }}>Start over</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Step {step + 1} of {TOTAL_STEPS}</p>
        <div className="mx-auto mt-3 flex max-w-md gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
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
            <h1 className="font-display text-3xl md:text-4xl">What do you need designed?</h1>
            <p className="mt-2 text-muted-foreground">Pick the closest description of your project.</p>
            <div className="mt-6 space-y-3">
              {PRIORITY_OPTS.map((opt) => (
                <OptionRow key={opt.id} selected={priority === opt.id} label={opt.label} desc={opt.desc} onClick={() => setPriority(opt.id)} />
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Which spaces are involved?</h1>
            <p className="mt-2 text-muted-foreground">Choose as many as apply — or skip if you're not sure yet.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {ROOM_OPTS.map((opt) => (
                <OptionRow key={opt.id} multi selected={concerns.includes(opt.id)} label={opt.label} onClick={() => toggle(concerns, setConcerns, opt.id)} />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">What kind of project is it?</h1>
            <p className="mt-2 text-muted-foreground">This tells us how much construction is involved.</p>
            <div className="mt-6 space-y-3">
              {PROJECT_TYPES.map((opt) => (
                <OptionRow key={opt.slug} selected={projectType === opt.slug} label={opt.label} desc={opt.desc} onClick={() => setProjectType(opt.slug)} />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Which styles appeal to you?</h1>
            <p className="mt-2 text-muted-foreground">Pick one or more — we'll rank studios whose work matches.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {STYLES.map((opt) => (
                <OptionRow key={opt.slug} multi selected={styles.includes(opt.slug)} label={opt.label} onClick={() => toggle(styles, setStyles, opt.slug)} />
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Where is your project?</h1>
            <p className="mt-2 text-muted-foreground">We'll prioritise studios working in your area.</p>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button
                onClick={() => setCitySlug("any")}
                className={`rounded-xl border p-3 text-sm transition ${citySlug === "any" ? "border-brand bg-brand/5 font-medium" : "border-border bg-card hover:border-brand/60"}`}
              >
                Anywhere / virtual
              </button>
              {CITIES.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setCitySlug(c.slug)}
                  className={`rounded-xl border p-3 text-sm transition ${citySlug === c.slug ? "border-brand bg-brand/5 font-medium" : "border-border bg-card hover:border-brand/60"}`}
                >
                  {c.name}, {c.state}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">What's your budget range?</h1>
            <p className="mt-2 text-muted-foreground">Design fees plus furnishings and construction, all in. This only sorts results.</p>
            <div className="mt-6 space-y-3">
              {BUDGET_BANDS.map((opt) => (
                <OptionRow key={opt.slug} selected={budget === opt.slug} label={opt.label} onClick={() => setBudget(opt.slug)} />
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">When would you like to start?</h1>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {TIMING_OPTS.map((opt) => (
                <OptionRow key={opt.id} selected={timing === opt.id} label={opt.label} onClick={() => setTiming(opt.id)} />
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Any preferences?</h1>
            <p className="mt-2 text-muted-foreground">Optional — these fine-tune which studios rank highest.</p>
            <div className="mt-6 space-y-3">
              {PREFERENCE_OPTS.map((opt) => (
                <OptionRow key={opt.id} multi selected={preferences.includes(opt.id)} label={opt.label} onClick={() => toggle(preferences, setPreferences, opt.id)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <BadgeCheck className="h-3.5 w-3.5 text-brand" /> We never sell your details. You choose who to contact.
        </p>
        {step < TOTAL_STEPS - 1 ? (
          <Button disabled={!canNext} onClick={() => setStep(step + 1)} className="rounded-full px-8">
            Continue
          </Button>
        ) : (
          <Button disabled={submitting} onClick={submit} className="rounded-full px-8">
            <Sparkles className="mr-2 h-4 w-4" />
            {submitting ? "Finding…" : "Show matches"}
          </Button>
        )}
      </div>
    </div>
  );
}
