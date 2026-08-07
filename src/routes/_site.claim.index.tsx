import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ShieldCheck } from "lucide-react";
import { searchProviders } from "@/lib/providers.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_site/claim/")({
  head: () => ({
    meta: [
      { title: "Claim Your Studio Profile | Interiors List" },
      { name: "description", content: "Claim your design studio listing in under a minute. Paste your listing link or search by business name — no account required." },
      { property: "og:title", content: "Claim Your Studio Profile | Interiors List" },
      { property: "og:description", content: "Take control of your listing: photos, services, FAQs and leads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClaimEntry,
});

function slugFromUrl(value: string): string | null {
  const m = value.trim().match(/\/provider\/([a-z0-9-]+)/i);
  return m ? m[1]! : null;
}

function ClaimEntry() {
  const [url, setUrl] = useState("");
  const [q, setQ] = useState("");
  const urlSlug = slugFromUrl(url);

  const { data, isFetching } = useQuery({
    queryKey: ["claim-search", q],
    queryFn: () => searchProviders({ data: { q, limit: 12 } }),
    enabled: q.trim().length >= 2,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">For businesses</p>
      <h1 className="mt-3 font-display text-4xl">Claim your profile</h1>
      <p className="mt-3 text-muted-foreground">
        Find your studio below. No account needed — just tell us who you are and we'll take it from there.
      </p>

      <div className="mt-10 rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-lg">Paste your listing link</h2>
        <div className="mt-3 flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://interiorslist.com/provider/your-studio"
            maxLength={300}
          />
          <Button asChild disabled={!urlSlug} className="shrink-0">
            {urlSlug ? <Link to="/claim/$slug" params={{ slug: urlSlug }}>Continue</Link> : <span>Continue</span>}
          </Button>
        </div>
        {url.trim().length > 8 && !urlSlug && (
          <p className="mt-2 text-xs text-brand">That doesn't look like a listing link — try searching by name instead.</p>
        )}
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-lg">Or search by name</h2>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. Studio Haus, Austin"
            maxLength={120}
          />
        </div>
        <div className="mt-4 space-y-2">
          {isFetching && <p className="text-sm text-muted-foreground">Searching…</p>}
          {data?.providers.map((p) => (
            <Link
              key={p.place_id}
              to="/claim/$slug"
              params={{ slug: p.slug }}
              className="flex items-center justify-between rounded-xl border border-border p-3 hover:border-brand"
            >
              <span className="text-sm font-medium">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.city}</span>
            </Link>
          ))}
          {q.trim().length >= 2 && !isFetching && !data?.providers.length && (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Can't find your business? <Link to="/submit" className="text-brand underline">Add it to the directory</Link>.
            </p>
          )}
        </div>
      </div>

      <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <span>Someone from our team reviews every claim and reaches out within a few minutes.</span>
      </p>
    </div>
  );
}
