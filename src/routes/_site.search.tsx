import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchProviders } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CITIES, SERVICES, STYLES } from "@/lib/cities";
import { Search, X } from "lucide-react";

export const Route = createFileRoute("/_site/search")({
  validateSearch: z.object({
    q: z.string().optional(),
    city: z.string().optional(),
    service: z.string().optional(),
    style: z.string().optional(),
    sort: z.enum(["verified", "name", "rating"]).optional(),
  }),
  head: () => ({
    meta: [
      { title: "Find a Studio — Nationwide Interior Designers | Interiors List" },
      { name: "description", content: "Browse and search verified interior design studios across every major U.S. city." },
      { property: "og:title", content: "Find a Studio — Nationwide Interior Designers" },
      { property: "og:url", content: "/search" },
    ],
    links: [{ rel: "canonical", href: "/search" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q: qParam = "", city, service, style, sort } = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(qParam);
  useEffect(() => { setQ(qParam); }, [qParam]);

  const search = useServerFn(searchProviders);
  const { data, isFetching } = useQuery({
    queryKey: ["search", qParam, city, service, sort],
    queryFn: () => search({ data: { q: qParam || undefined, city, service, sort } }),
  });

  useEffect(() => {
    if (qParam || city) {
      import("@/lib/analytics").then(({ trackSearch }) => trackSearch(qParam || "", city));
    }
  }, [qParam, city]);

  const providers = useMemo(() => {
    const rows = data?.providers ?? [];
    if (!style) return rows;
    return rows.filter((p) => Array.isArray((p as { styles?: string[] }).styles) && (p as { styles?: string[] }).styles!.includes(style));
  }, [data, style]);

  const hasFilter = !!(qParam || city || service || style || sort);
  const cityVal = city ?? "any";
  const serviceVal = service ?? "any";
  const styleVal = style ?? "any";
  const sortVal = sort ?? "verified";

  function applyParam(patch: Record<string, string | undefined>) {
    const next: Record<string, string> = {};
    const base = { q: qParam || undefined, city, service, style, sort, ...patch };
    for (const [k, v] of Object.entries(base)) if (v) next[k] = v;
    navigate({ to: "/search", search: next as never });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-display text-4xl md:text-5xl">Find a Studio</h1>
      <p className="mt-2 text-muted-foreground">Browse every verified design studio, or filter to find the perfect match.</p>

      <form
        onSubmit={(e) => { e.preventDefault(); applyParam({ q: q || undefined }); }}
        className="mt-6 flex gap-2"
      >
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Studio, designer, city, or service…" className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0" />
        </div>
        <Button type="submit" size="lg" className="rounded-full px-6">Search</Button>
      </form>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">City</label>
          <Select value={cityVal} onValueChange={(v) => applyParam({ city: v === "any" ? undefined : v })}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="any">Any city</SelectItem>
              {CITIES.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Service</label>
          <Select value={serviceVal} onValueChange={(v) => applyParam({ service: v === "any" ? undefined : v })}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="any">Any service</SelectItem>
              {SERVICES.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Style</label>
          <Select value={styleVal} onValueChange={(v) => applyParam({ style: v === "any" ? undefined : v })}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="any">Any style</SelectItem>
              {STYLES.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Sort by</label>
          <Select value={sortVal} onValueChange={(v) => applyParam({ sort: v as "verified" | "name" | "rating" })}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="verified">Verified first</SelectItem>
              <SelectItem value="rating">Highest rated</SelectItem>
              <SelectItem value="name">Name (A–Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isFetching ? "Loading…" : `${providers.length} studio${providers.length === 1 ? "" : "s"}`}
          {hasFilter && " match your filters"}
        </p>
        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={() => { setQ(""); navigate({ to: "/search", search: {} as never }); }}>
            <X className="mr-1 h-3.5 w-3.5" /> Reset filters
          </Button>
        )}
      </div>

      <div className="mt-6">
        {providers.length === 0 && !isFetching && (
          <p className="rounded-2xl border border-dashed border-border bg-secondary/30 px-6 py-12 text-center text-muted-foreground">
            No studios match those filters. Try a different city, service, or style.
          </p>
        )}
        {providers.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => <ProviderCard key={p.place_id} {...p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
