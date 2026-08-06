import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CITIES } from "@/lib/cities";
import { Sparkles } from "lucide-react";

const PRIORITIES = [
  { slug: "full-home", label: "Full-home design" },
  { slug: "kitchen-bath", label: "Kitchen or bathroom" },
  { slug: "living-spaces", label: "Living, dining or bedroom" },
  { slug: "workspace", label: "Home office or workspace" },
  { slug: "commercial", label: "Commercial, retail or hospitality" },
  { slug: "furnishing", label: "Furniture & styling only" },
  { slug: "virtual", label: "Virtual / e-design" },
  { slug: "exploring", label: "Just exploring" },
];

export function LookingForHero() {
  const [priority, setPriority] = useState<string>("");
  const [city, setCity] = useState<string>("any");
  const navigate = useNavigate();

  function go() {
    if (!priority) return;
    const search: Record<string, string> = { priority };
    if (city && city !== "any") search.city = city;
    navigate({ to: "/match", search: search as never });
  }

  return (
    <section className="border-y border-border/60 bg-gradient-to-br from-brand/5 via-background to-background">
      <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
        <div className="text-center">
          <p className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand"><Sparkles className="h-3 w-3" /> Personal recommendations</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">I am looking for help with…</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Tell us about your project and we'll shortlist design studios that fit your scope, style and budget.</p>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Project</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-12"><SelectValue placeholder="Choose what you need designed…" /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p.slug} value={p.slug}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
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
          </div>
          <Button onClick={go} disabled={!priority} size="lg" className="mt-6 h-12 w-full rounded-full md:w-auto md:px-10">
            See recommendations →
          </Button>
        </div>
      </div>
    </section>
  );
}
