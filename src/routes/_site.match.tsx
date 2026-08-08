import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ProviderCard } from "@/components/provider-card";
import { ConsultationForm } from "@/components/consultation-form";
import { CITIES, STYLES, PROJECT_TYPES, BUDGET_BANDS } from "@/lib/cities";
import { CONSULT_IMAGE } from "@/lib/style-images";
import { getMatches } from "@/lib/match.functions";
import { BadgeCheck, Check, ChevronLeft, Sparkles } from "lucide-react";

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

const ALL_ROOMS = [
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

/** Rooms shown depend on what the person said they need designed. */
function roomsFor(priority: string) {
  switch (priority) {
    case "kitchen-bath":
      return ALL_ROOMS.filter((r) => ["kitchen", "bathroom", "storage", "lighting", "paint-color"].includes(r.id));
    case "living-spaces":
      return ALL_ROOMS.filter((r) => ["living-room", "dining-room", "bedroom", "window-treatments", "lighting", "paint-color"].includes(r.id));
    case "workspace":
      return ALL_ROOMS.filter((r) => ["home-office", "storage", "lighting", "paint-color"].includes(r.id));
    case "furnishing":
      return ALL_ROOMS.filter((r) => !["storage"].includes(r.id));
    default:
      return ALL_ROOMS;
  }
}

const PROPERTY_OPTS = [
  { id: "house", label: "House", desc: "Detached, townhouse or duplex" },
  { id: "apartment", label: "Apartment or condo", desc: "Building rules may apply" },
  { id: "new-construction", label: "New construction", desc: "Still being built" },
  { id: "rental", label: "Rental", desc: "Renter-friendly, reversible work" },
];

const BUILD_OPTS = [
  { id: "manages-build", label: "Yes — manage contractors for me", desc: "The studio runs the build and the trades" },
  { id: "own-contractor", label: "No — I already have a contractor", desc: "Design and drawings only" },
  { id: "undecided", label: "Not sure yet", desc: "Show me studios that can do either" },
];

const TIMING_OPTS = [
  { id: "asap", label: "As soon as possible" },
  { id: "1-3-months", label: "In 1–3 months" },
  { id: "3-6-months", label: "In 3–6 months" },
  { id: "planning", label: "Just planning" },
];

const TIMING_LABEL: Record<string, string> = {
  asap: "As soon as possible",
  "1-3-months": "1–3 months",
  "3-6-months": "3–6 months",
  planning: "Just exploring",
};

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

type StepId = "priority" | "rooms" | "projectType" | "property" | "build" | "styles" | "city" | "budget" | "timing";

export const Route = createFileRoute("/_site/match")({
  validateSearch: z.object({ priority: z.string().optional(), city: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Get Matched with an Interior Designer | Intearior" },
      { name: "description", content: "Answer a few adaptive questions about your space, style, budget and timeline and we'll shortlist interior design studios that fit your project." },
      { property: "og:title", content: "Get Matched with an Interior Designer" },
      { property: "og:description", content: "Tell us about your project and we'll shortlist design studios that fit." },
      { property: "og:url", content: "/match" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Get Matched with an Interior Designer" },
      { name: "twitter:description", content: "Tell us about your project and we'll shortlist design studios that fit." },
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
  const [priority, setPriority] = useState(initialPriority ?? "");
  const [rooms, setRooms] = useState<string[]>([]);
  const [projectType, setProjectType] = useState("");
  const [property, setProperty] = useState("");
  const [build, setBuild] = useState("");
  const [styles, setStyles] = useState<string[]>([]);
  const [citySlug, setCitySlug] = useState(initialCity ?? "any");
  const [budget, setBudget] = useState("");
  const [timing, setTiming] = useState("");
  const [index, setIndex] = useState(initialPriority ? 1 : 0);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Awaited<ReturnType<typeof getMatches>>["matches"] | null>(null);
  const [selected, setSelected] = useState<{ placeId: string; name: string } | null>(null);
  const fetchMatches = useServerFn(getMatches);

  // Project type is implied for some answers, so we never ask it twice.
  const impliedProjectType =
    priority === "furnishing" ? "furnishing-only" : priority === "commercial" ? "commercial-fitout" : "";
  const effectiveProjectType = impliedProjectType || projectType;

  /** The question sequence rebuilds itself from the answers so far. */
  const steps = useMemo<StepId[]>(() => {
    const s: StepId[] = ["priority"];
    if (!priority) return s;
    if (priority !== "full-home" && priority !== "exploring") s.push("rooms");
    if (!impliedProjectType) s.push("projectType");
    if (priority !== "commercial" && effectiveProjectType !== "commercial-fitout") s.push("property");
    if (["new-build", "full-renovation"].includes(effectiveProjectType)) s.push("build");
    s.push("styles", "city", "budget", "timing");
    return s;
  }, [priority, impliedProjectType, effectiveProjectType]);

  const total = steps.length;
  const stepIndex = Math.min(index, total - 1);
  const step = steps[stepIndex]!;
  const isLast = stepIndex === total - 1;

  const projectOptions = PROJECT_TYPES.filter((p) => {
    if (p.slug === "commercial-fitout") return priority === "exploring";
    if (p.slug === "furnishing-only") return ["living-spaces", "furnishing", "virtual", "exploring"].includes(priority);
    if (p.slug === "new-build") return priority !== "virtual";
    return true;
  });

  function toggle(list: string[], set: (v: string[]) => void, id: string) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  const canNext =
    step === "priority" ? !!priority :
    step === "projectType" ? !!projectType :
    step === "property" ? !!property :
    step === "build" ? !!build :
    step === "city" ? !!citySlug :
    step === "budget" ? !!budget :
    step === "timing" ? !!timing :
    true;

  async function submit() {
    setSubmitting(true);
    try {
      // Preferences are inferred from the answers rather than asked separately.
      const preferences: string[] = [];
      if (build === "manages-build") preferences.push("manages-build");
      if (priority === "virtual" || citySlug === "any") preferences.push("remote-ok");
      if (property === "rental") preferences.push("boutique");
      const res = await fetchMatches({
        data: { priority, concerns: rooms, citySlug, budget, timing, preferences, styles, projectType: effectiveProjectType },
      });
      setResults(res.matches);
      setSelected(res.matches[0] ? { placeId: res.matches[0].place_id, name: res.matches[0].name } : null);
    } finally {
      setSubmitting(false);
    }
  }

  function restart() {
    setResults(null);
    setSelected(null);
    setIndex(0);
  }

  if (results) {
    if (results.length === 0) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="font-display text-4xl">No matches yet</h1>
          <p className="mt-3 text-muted-foreground">Try widening your city or budget answers.</p>
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
        <button onClick={() => setResults(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
          <ChevronLeft className="h-4 w-4" /> Refine your answers
        </button>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">Your matches</h1>
        <p className="mt-3 text-muted-foreground">
          {results.length} {results.length === 1 ? "studio" : "studios"} in {cityName} for{" "}
          <span className="font-medium text-foreground">{PRIORITY_OPTS.find((o) => o.id === priority)?.label ?? priority}</span>.
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
              <p className="mt-2 text-sm text-muted-foreground">We've pre-filled your quiz answers — add your details and we'll pass it straight to the studio.</p>
              <div className="mt-6">
                <ConsultationForm
                  key={selected.placeId}
                  placeId={selected.placeId}
                  studioName={selected.name}
                  compact
                  defaults={{
                    service: PRIORITY_SERVICE[priority] ?? "",
                    projectType: effectiveProjectType,
                    budget,
                    style: styles[0] ?? "",
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Step {stepIndex + 1} of {total}</p>
        <div className="mx-auto mt-3 flex max-w-md gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-brand" : "bg-border"}`} />
          ))}
        </div>
      </div>

      {stepIndex > 0 && (
        <button onClick={() => setIndex(stepIndex - 1)} className="mt-8 flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
      )}

      <div className="mt-6">
        {step === "priority" && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">What do you need designed?</h1>
            <p className="mt-2 text-muted-foreground">Pick the closest description — the rest of the questions adapt to your answer.</p>
            <div className="mt-6 space-y-3">
              {PRIORITY_OPTS.map((opt) => (
                <OptionRow
                  key={opt.id}
                  selected={priority === opt.id}
                  label={opt.label}
                  desc={opt.desc}
                  onClick={() => { setPriority(opt.id); setRooms([]); setProjectType(""); setBuild(""); }}
                />
              ))}
            </div>
          </div>
        )}

        {step === "rooms" && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Which spaces are involved?</h1>
            <p className="mt-2 text-muted-foreground">Choose as many as apply — or continue if you're not sure yet.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {roomsFor(priority).map((opt) => (
                <OptionRow key={opt.id} multi selected={rooms.includes(opt.id)} label={opt.label} onClick={() => toggle(rooms, setRooms, opt.id)} />
              ))}
            </div>
          </div>
        )}

        {step === "projectType" && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">How much building work is involved?</h1>
            <p className="mt-2 text-muted-foreground">This decides whether you need a studio that can run a construction project.</p>
            <div className="mt-6 space-y-3">
              {projectOptions.map((opt) => (
                <OptionRow key={opt.slug} selected={projectType === opt.slug} label={opt.label} desc={opt.desc} onClick={() => { setProjectType(opt.slug); setBuild(""); }} />
              ))}
            </div>
          </div>
        )}

        {step === "property" && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">What kind of property is it?</h1>
            <p className="mt-2 text-muted-foreground">Condo boards, rentals and new builds each need different experience.</p>
            <div className="mt-6 space-y-3">
              {PROPERTY_OPTS.map((opt) => (
                <OptionRow key={opt.id} selected={property === opt.id} label={opt.label} desc={opt.desc} onClick={() => setProperty(opt.id)} />
              ))}
            </div>
          </div>
        )}

        {step === "build" && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Should the studio manage the build?</h1>
            <p className="mt-2 text-muted-foreground">You picked {PROJECT_TYPES.find((p) => p.slug === effectiveProjectType)?.label.toLowerCase()}, so trades will be involved.</p>
            <div className="mt-6 space-y-3">
              {BUILD_OPTS.map((opt) => (
                <OptionRow key={opt.id} selected={build === opt.id} label={opt.label} desc={opt.desc} onClick={() => setBuild(opt.id)} />
              ))}
            </div>
          </div>
        )}

        {step === "styles" && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Which styles appeal to you?</h1>
            <p className="mt-2 text-muted-foreground">Pick one or more — we'll rank studios whose portfolios match.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {STYLES.map((opt) => (
                <OptionRow key={opt.slug} multi selected={styles.includes(opt.slug)} label={opt.label} onClick={() => toggle(styles, setStyles, opt.slug)} />
              ))}
            </div>
          </div>
        )}

        {step === "city" && (
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

        {step === "budget" && (
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

        {step === "timing" && (
          <div>
            <h1 className="font-display text-3xl md:text-4xl">When would you like to start?</h1>
            <p className="mt-2 text-muted-foreground">Studios book up — {TIMING_LABEL[timing] ?? "your timing"} helps us show who has capacity.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {TIMING_OPTS.map((opt) => (
                <OptionRow key={opt.id} selected={timing === opt.id} label={opt.label} onClick={() => setTiming(opt.id)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <BadgeCheck className="h-3.5 w-3.5 text-brand" /> We never sell your details. You choose who to contact.
        </p>
        {!isLast ? (
          <Button disabled={!canNext} onClick={() => setIndex(stepIndex + 1)} className="rounded-full px-8">
            Continue
          </Button>
        ) : (
          <Button disabled={submitting || !canNext} onClick={submit} className="rounded-full px-8">
            <Sparkles className="mr-2 h-4 w-4" />
            {submitting ? "Finding…" : "Show matches"}
          </Button>
        )}
      </div>
    </div>
  );
}
