import { createFileRoute, Link } from "@tanstack/react-router";
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

type ProviderRow = { place_id: string; name: string; website: string | null; articles: unknown };

function articleCount(a: unknown): number {
  return Array.isArray(a) ? a.length : 0;
}

function AdminArticles() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setEmail(data.session?.user.email ?? null);
      setReady(true);
    });
  }, []);
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => getMyRoles(),
    enabled: authed,
  });

  const scrape = useServerFn(scrapeProviderArticles);
  const list = useServerFn(listProvidersForArticleScrape);
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-scrape-list"],
    queryFn: () => list(),
    enabled: !!roles?.isAdmin,
  });

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  async function scrapeSet(rows: ProviderRow[]) {
    if (!rows.length) return;
    if (!confirm(`Firecrawl will be called for ${rows.length} providers. Continue?`)) return;
    setRunning(true);
    setProgress({ done: 0, total: rows.length });
    for (let i = 0; i < rows.length; i++) {
      const p = rows[i];
      try {
        const res = await scrape({ data: { placeId: p.place_id } });
        if (res.ok) toast.success(`${p.name}: ${res.articles.length} articles`);
        else toast.info(`${p.name}: skipped (${res.reason})`);
      } catch (e) {
        toast.error(`${p.name}: ${e instanceof Error ? e.message : "failed"}`);
      }
      setProgress({ done: i + 1, total: rows.length });
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "failed");
    }
  }

  if (!ready) return <Shell>Loading…</Shell>;
  if (!authed) {
    return (
      <Shell>
        <h1 className="font-display text-3xl">Sign in required</h1>
        <p className="mt-2 text-sm text-muted-foreground">You need an admin account to view this page.</p>
        <Button asChild className="mt-6"><Link to="/login">Sign in</Link></Button>
      </Shell>
    );
  }
  if (rolesLoading) return <Shell>Checking permissions…</Shell>;
  if (!roles?.isAdmin) {
    return (
      <Shell>
        <h1 className="font-display text-3xl">Not an admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You're signed in as <span className="font-medium">{email}</span> but this account doesn't have admin access.
        </p>
        <Button asChild variant="outline" className="mt-6"><Link to="/dashboard">Back to dashboard</Link></Button>
      </Shell>
    );
  }

  const providers = (data?.providers ?? []) as ProviderRow[];
  const withArticles = providers.filter((p) => articleCount(p.articles) > 0);
  const withoutArticles = providers.filter((p) => articleCount(p.articles) === 0);

  return (
    <Shell wide>
      <h1 className="font-display text-3xl">Scrape provider articles</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Uses Firecrawl to find up to 3 blog/article URLs per studio website. Consumes Firecrawl credits.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Studios" value={providers.length} />
        <Stat label="With articles" value={withArticles.length} />
        <Stat label="Missing" value={withoutArticles.length} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={() => scrapeSet(withoutArticles)} disabled={running || isLoading || !withoutArticles.length}>
          {running ? `Scraping ${progress.done}/${progress.total}…` : `Scrape missing (${withoutArticles.length})`}
        </Button>
        <Button variant="outline" onClick={() => scrapeSet(providers)} disabled={running || isLoading || !providers.length}>
          Re-scrape all ({providers.length})
        </Button>
        <Button variant="ghost" onClick={() => refetch()} disabled={running}>Reload</Button>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading providers…</p>
      ) : providers.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No studios with websites yet.
        </p>
      ) : (
        <div className="mt-8 space-y-2">
          {providers.map((p) => {
            const count = articleCount(p.articles);
            return (
              <div key={p.place_id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.website ?? "no website"} · {count} article{count === 1 ? "" : "s"}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => scrapeSingle(p.place_id, p.name)} disabled={running}>
                  {count > 0 ? "Re-scrape" : "Scrape"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={`mx-auto ${wide ? "max-w-5xl" : "max-w-2xl"} px-4 py-16`}>{children}</div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  );
}
