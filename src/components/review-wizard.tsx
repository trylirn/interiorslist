import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Star, Check, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { searchProviders } from "@/lib/providers.functions";
import { submitReview } from "@/lib/contact.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Picked = { place_id: string; slug: string; name: string; city: string | null };

const STEPS = ["Find the studio", "Your project", "Ratings & disclosures", "About you"];

const CLIENT_TYPES = [
  "Homeowner — first project",
  "Homeowner — returning client",
  "Developer / builder",
  "Referred by another designer",
  "Commercial / hospitality client",
];

const RELATIONSHIP_OPTIONS = [
  "No personal or professional relationship",
  "I know a staff member personally",
  "I work (or worked) with this business",
  "I am a competitor in the industry",
];

const BENEFIT_OPTIONS = [
  "No — I received nothing for this review",
  "I received a discount or free service",
  "I was paid or compensated",
];

const SUBRATINGS = [
  { key: "communication", label: "Communication" },
  { key: "results", label: "Design results" },
  { key: "cleanliness", label: "Project management" },
  { key: "value", label: "Value for money" },
] as const;

const MIN_TEXT = 40;

export function ReviewWizard({ initialProvider }: { initialProvider?: Picked }) {
  const navigate = useNavigate();
  const send = useServerFn(submitReview);
  const [step, setStep] = useState(initialProvider ? 2 : 1);
  const [picked, setPicked] = useState<Picked | null>(initialProvider ?? null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const [clientType, setClientType] = useState("");
  const [isCurrentClient, setIsCurrentClient] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [decisionFactors, setDecisionFactors] = useState("");
  const [text, setText] = useState("");

  const [overall, setOverall] = useState(0);
  const [subs, setSubs] = useState<Record<string, number>>({});
  const [relationship, setRelationship] = useState("");
  const [benefit, setBenefit] = useState("");

  const [author, setAuthor] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail((e) => e || data.user!.email!);
    });
  }, []);

  const { data: results, isFetching } = useQuery({
    queryKey: ["review-search", q],
    queryFn: () => searchProviders({ data: { q, limit: 12 } }),
    enabled: step === 1 && q.trim().length >= 2,
  });

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 26 }, (_, i) => String(now - i));
  }, []);

  const canNext =
    step === 1
      ? !!picked
      : step === 2
        ? clientType !== "" && isCurrentClient !== "" && text.trim().length >= MIN_TEXT
        : step === 3
          ? overall > 0 && relationship !== "" && benefit !== ""
          : author.trim().length > 0 && /.+@.+\..+/.test(email);

  async function submit() {
    if (!picked || !canNext) return;
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        toast.error("Please sign in to publish your review");
        navigate({ to: "/login", search: { next: `/review/${picked.slug}` } as never });
        return;
      }
      await send({
        data: {
          placeId: picked.place_id,
          authorName: author.trim(),
          email: email.trim(),
          rating: overall,
          text: text.trim(),
          clientType,
          isCurrentClient,
          startYear: startYear ? Number(startYear) : null,
          endYear: endYear ? Number(endYear) : null,
          decisionFactors,
          ratingCommunication: subs["communication"] ?? null,
          ratingResults: subs["results"] ?? null,
          ratingCleanliness: subs["cleanliness"] ?? null,
          ratingValue: subs["value"] ?? null,
          relationshipDisclosure: relationship,
          benefitDisclosure: benefit,
        },
      });
      setDone(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't post your review");
    } finally {
      setBusy(false);
    }
  }

  if (done && picked) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
          <Check className="h-7 w-7 text-brand" />
        </div>
        <h1 className="mt-6 font-display text-3xl">Thanks for your review</h1>
        <p className="mt-3 text-muted-foreground">
          Your experience with {picked.name} is now live and helps other people choose with confidence.
        </p>
        <div className="mt-8 flex justify-center gap-2">
          <Button asChild variant="outline">
            <Link to="/provider/$slug" params={{ slug: picked.slug }}>View the listing</Link>
          </Button>
          <Button asChild><Link to="/">Home</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">Write a review</p>
      <h1 className="mt-3 font-display text-4xl">Share your experience</h1>

      <ol className="mt-8 flex items-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const complete = n < step;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  complete
                    ? "bg-brand text-brand-foreground"
                    : active
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                {complete ? <Check className="h-4 w-4" /> : n}
              </span>
              <span className={`hidden text-xs sm:block ${active ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
              {n < STEPS.length && <span className="h-px flex-1 bg-border" />}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 rounded-3xl border border-border bg-card p-6">
        {step === 1 && (
          <div>
            <h2 className="font-display text-xl">Find the studio</h2>
            <p className="mt-1 text-sm text-muted-foreground">Search by business name or city.</p>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g. Studio Haus, Austin"
                maxLength={120}
              />
            </div>
            {picked && (
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-brand/30 bg-brand/5 p-4">
                <div>
                  <p className="font-medium">{picked.name}</p>
                  <p className="text-xs text-muted-foreground">{picked.city}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setPicked(null)}>Change</Button>
              </div>
            )}
            {!picked && (
              <div className="mt-4 space-y-2">
                {isFetching && <p className="text-sm text-muted-foreground">Searching…</p>}
                {results?.providers.map((p) => (
                  <button
                    key={p.place_id}
                    type="button"
                    onClick={() => setPicked({ place_id: p.place_id, slug: p.slug, name: p.name, city: p.city })}
                    className="flex w-full items-center justify-between rounded-xl border border-border p-3 text-left hover:border-brand"
                  >
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.city}</span>
                  </button>
                ))}
                {q.trim().length >= 2 && !isFetching && !results?.providers.length && (
                  <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No match yet. <Link to="/submit" className="text-brand underline">Add this studio</Link> and review it once it's live.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl">Your project</h2>
            <div className="space-y-1.5">
              <Label>What kind of client were you? <span className="text-brand">*</span></Label>
              <Select value={clientType} onValueChange={setClientType}>
                <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                <SelectContent>
                  {CLIENT_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Are you currently a client? <span className="text-brand">*</span></Label>
              <Select value={isCurrentClient} onValueChange={setIsCurrentClient}>
                <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No, not anymore">No, not anymore</SelectItem>
                  <SelectItem value="One-time visit">One-time visit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Started going</Label>
                <Select value={startYear} onValueChange={setStartYear}>
                  <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Last visit</Label>
                <Select value={endYear} onValueChange={setEndYear}>
                  <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>What led you to choose them?</Label>
              <Textarea
                value={decisionFactors}
                onChange={(e) => setDecisionFactors(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Pricing, reviews, a referral, location, specific room or project type…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Describe your experience <span className="text-brand">*</span></Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                maxLength={4000}
                placeholder="The rooms or project you worked on, how the studio communicated, results, and anything future clients should know."
              />
              <p className={`text-xs ${text.trim().length >= MIN_TEXT ? "text-muted-foreground" : "text-brand"}`}>
                {text.trim().length}/{MIN_TEXT} characters minimum
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl">Ratings & disclosures</h2>
            <div>
              <Label>Overall rating <span className="text-brand">*</span></Label>
              <Stars value={overall} onChange={setOverall} big />
            </div>
            <div className="space-y-4">
              {SUBRATINGS.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-4">
                  <span className="text-sm">{s.label}</span>
                  <Stars value={subs[s.key] ?? 0} onChange={(v) => setSubs({ ...subs, [s.key]: v })} />
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Any relationship with this business? <span className="text-brand">*</span></Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Did you receive anything for this review? <span className="text-brand">*</span></Label>
              <Select value={benefit} onValueChange={setBenefit}>
                <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                <SelectContent>
                  {BENEFIT_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl">About you</h2>
            <div className="space-y-1.5">
              <Label>Display name <span className="text-brand">*</span></Label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={120} placeholder="Jane D." />
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-brand">*</span></Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} placeholder="you@example.com" />
              <p className="text-xs text-muted-foreground">Kept private — never shown with your review.</p>
            </div>
            {picked && (
              <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm">
                Reviewing <span className="font-medium">{picked.name}</span> · {overall} star{overall === 1 ? "" : "s"}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || busy}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="rounded-full px-6">
            Continue
          </Button>
        ) : (
          <Button onClick={submit} disabled={!canNext || busy} className="rounded-full px-6">
            {busy ? "Publishing…" : "Publish review"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Stars({ value, onChange, big }: { value: number; onChange: (n: number) => void; big?: boolean }) {
  return (
    <div className="mt-2 flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star${n === 1 ? "" : "s"}`}>
          <Star className={`${big ? "h-8 w-8" : "h-5 w-5"} ${n <= value ? "fill-rating text-rating" : "text-border"}`} />
        </button>
      ))}
    </div>
  );
}
