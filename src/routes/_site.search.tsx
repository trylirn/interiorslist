import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchProviders } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { TEXAS_CITIES, SERVICES } from "@/lib/cities";

export const Route = createFileRoute("/_site/search")({
  validateSearch: z.object({ q: z.string().optional(), city: z.string().optional(), service: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Search Texas Aesthetic Injectors | Texas Aesthetics" },
      { name: "description", content: "Search Botox, filler, and medspa injectors across every major Texas city." },
      { property: "og:title", content: "Search Texas Aesthetic Injectors" },
      { property: "og:url", content: "/search" },
    ],
    links: [{ rel: "canonical", href: "/search" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q: initialQ = "", city, service } = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(initialQ);
  const search = useServerFn(searchProviders);
  const { data, isFetching } = useQuery({
    queryKey: ["search", initialQ, city, service],
    queryFn: () => search({ data: { q: initialQ || "med", city, service } }),
    enabled: (initialQ?.length ?? 0) > 0 || !!city || !!service,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-display text-4xl">Search</h1>
      <form onSubmit={(e) => { e.preventDefault(); navigate({ to: "/search", search: { q, city, service } }); }} className="mt-4 flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Clinic, injector, or city…" className="h-12" />
        <Button type="submit" size="lg">Search</Button>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="text-xs font-semibold uppercase text-muted-foreground self-center mr-2">City:</span>
        <button onClick={() => navigate({ to: "/search", search: { q: initialQ, service } })} className={`rounded-full border px-3 py-1 text-xs ${!city ? "border-brand bg-brand text-brand-foreground" : "border-border"}`}>Any</button>
        {TEXAS_CITIES.map((c) => (
          <button key={c.slug} onClick={() => navigate({ to: "/search", search: { q: initialQ, city: c.slug, service } })} className={`rounded-full border px-3 py-1 text-xs ${city === c.slug ? "border-brand bg-brand text-brand-foreground" : "border-border"}`}>{c.name}</button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs font-semibold uppercase text-muted-foreground self-center mr-2">Treatment:</span>
        <button onClick={() => navigate({ to: "/search", search: { q: initialQ, city } })} className={`rounded-full border px-3 py-1 text-xs ${!service ? "border-brand bg-brand text-brand-foreground" : "border-border"}`}>Any</button>
        {SERVICES.map((s) => (
          <button key={s.slug} onClick={() => navigate({ to: "/search", search: { q: initialQ, city, service: s.slug } })} className={`rounded-full border px-3 py-1 text-xs ${service === s.slug ? "border-brand bg-brand text-brand-foreground" : "border-border"}`}>{s.name}</button>
        ))}
      </div>

      <div className="mt-8">
        {isFetching && <p className="text-muted-foreground">Searching…</p>}
        {data && data.providers.length === 0 && <p className="text-muted-foreground">No matches found.</p>}
        {data && data.providers.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.providers.map((p) => <ProviderCard key={p.place_id} {...p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
