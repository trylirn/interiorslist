import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CITIES } from "@/lib/cities";
import { Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "Designing our whole home",
  "A kitchen renovation",
  "Furnishing a new living room",
  "A primary bedroom refresh",
  "An office or retail fit-out",
  "Virtual e-design help",
];

export function LookingForHero() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState<string>("any");
  const navigate = useNavigate();

  function go(value?: string) {
    const text = (value ?? q).trim();
    if (!text) return;
    const search: Record<string, string> = { q: text };
    if (city && city !== "any") search.city = city;
    navigate({ to: "/match", search: search as never });
  }

  return (
    <section className="border-y border-border/60 bg-gradient-to-br from-brand/5 via-background to-background">
      <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
        <div className="text-center">
          <p className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand"><Sparkles className="h-3 w-3" /> AI matching</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">I am looking for help with…</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Describe your project in your own words. Our assistant asks a few follow-up questions, then shortlists studios that fit.</p>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <form
            onSubmit={(e) => { e.preventDefault(); go(); }}
            className="grid gap-4 md:grid-cols-[1.6fr_1fr]"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your project</label>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g. redoing our 1920s kitchen and dining room"
                className="h-12"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">City (optional)</label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value="any">Anywhere / virtual</SelectItem>
                  {CITIES.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}, {c.state}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => { setQ(s); go(s); }} className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-brand hover:text-foreground">
                  {s}
                </button>
              ))}
            </div>
            <Button type="submit" disabled={!q.trim()} size="lg" className="mt-2 h-12 w-full rounded-full md:col-span-2 md:w-auto md:px-10">
              Start matching →
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
