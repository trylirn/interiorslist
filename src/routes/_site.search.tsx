import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchProviders } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

export const Route = createFileRoute("/_site/search")({
  validateSearch: z.object({ q: z.string().optional(), city: z.string().optional() }),
  head: () => ({ meta: [
    { title: "Search Texas Aesthetic Injectors | Texas Aesthetics" },
    { name: "description", content: "Search Botox, filler, and medspa injectors across every major Texas city." },
  ] }),
  component: SearchPage,
});

function SearchPage() {
  const { q: initialQ = "" } = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(initialQ);
  const search = useServerFn(searchProviders);
  const { data, isFetching } = useQuery({
    queryKey: ["search", initialQ],
    queryFn: () => search({ data: { q: initialQ } }),
    enabled: initialQ.length > 0,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-display text-4xl">Search</h1>
      <form onSubmit={(e) => { e.preventDefault(); navigate({ to: "/search", search: { q } }); }} className="mt-4 flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Clinic, injector, or treatment…" className="h-12" />
        <Button type="submit" size="lg">Search</Button>
      </form>
      <div className="mt-8">
        {!initialQ && <p className="text-muted-foreground">Start typing to find an injector.</p>}
        {isFetching && <p className="text-muted-foreground">Searching…</p>}
        {data && data.providers.length === 0 && <p className="text-muted-foreground">No matches for "{initialQ}".</p>}
        {data && data.providers.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.providers.map((p) => <ProviderCard key={p.place_id} {...p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
