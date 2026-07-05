import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles } from "@/lib/role.functions";
import { listProvidersForArticleScrape, scrapeProviderArticles } from "@/lib/articles.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/admin/articles")({
  head: () => ({ meta: [{ title: "Admin · Scrape articles" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminArticles,
});

function AdminArticles() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setAuthed(!!data.session); setReady(true); });
  }, []);
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => getMyRoles(), enabled: authed });

  const scrape = useServerFn(scrapeProviderArticles);
  const list = useServerFn(listProvidersForArticleScrape);
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-scrape-list"],
    queryFn: () => list(),
    enabled: !!roles?.isAdmin,
  });

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  async function scrapeAll() {
    if (!data) return;
    if (!confirm(`This will call Firecrawl for ${data.providers.length} providers and consume credits. Continue?`)) return;
    setRunning(true);
    setProgress({ done: 0, total: data.providers.length });
    for (let i = 0; i < data.providers.length; i++) {
      const p = data.providers[i];
      try {
        const res = await scrape({ data: { placeId: p.place_id } });
        if (res.ok) toast.success(`${p.name}: ${res.articles.length} articles`);
        else toast.info(`${p.name}: skipped (${res.reason})`);
      } catch (e: any) {
        toast.error(`${p.name}: ${e?.message ?? "failed"}`);
      }
      setProgress({ done: i + 1, total: data.providers.length });
    }
    setRunning(false);
    refetch();
  }

  async function scrapeSingle(placeId: string, name: string) {
    try {
      const res = await scrape({ data: { placeId } });
      if (res.ok) toast.success(`${name}: ${res.articles.length} articles`);
      else toast.info(`${name}: skipped (${res.reason})`);
      refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "failed");
    }
  }

  if (!ready) return <div className="mx-auto max-w-4xl px-4 py-16 text-muted-foreground">Loading…</div>;
  if (!authed) return <div className="mx-auto max-w-4xl px-4 py-16"><p>Please sign in.</p></div>;
  if (!roles?.isAdmin) return <div className="mx-auto max-w-4xl px-4 py-16"><p>Forbidden.</p></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-3xl">Scrape provider articles</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Uses Firecrawl to find up to 3 blog/article URLs from each provider's website. Consumes Firecrawl credits.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={scrapeAll} disabled={running || isLoading || !data}>{running ? `Scraping ${progress.done}/${progress.total}…` : `Scrape all (${data?.providers.length ?? 0})`}</Button>
        <Button variant="outline" onClick={() => refetch()} disabled={running}>Reload</Button>
      </div>

      <div className="mt-8 space-y-2">
        {(data?.providers ?? []).map((p: any) => (
          <div key={p.place_id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">{p.website} · {Array.isArray(p.articles) ? p.articles.length : 0} articles</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => scrapeSingle(p.place_id, p.name)} disabled={running}>Scrape</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
