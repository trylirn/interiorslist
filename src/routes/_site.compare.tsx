import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCompareStore } from "@/stores/compare-store";
import { getProvidersByIds } from "@/lib/compare.functions";
import { BUDGET_BANDS } from "@/lib/cities";
import { Button } from "@/components/ui/button";
import { BadgeCheck, ExternalLink, MapPin, Star } from "lucide-react";

export const Route = createFileRoute("/_site/compare")({
  head: () => ({
    meta: [
      { title: "Compare Studios | Intearior" },
      { name: "description", content: "Compare verified design studios side-by-side." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ComparePage,
});

type Provider = Awaited<ReturnType<typeof getProvidersByIds>>["providers"][number];

function ComparePage() {
  const { items, remove } = useCompareStore();
  const [data, setData] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) { setData([]); setLoading(false); return; }
    setLoading(true);
    getProvidersByIds({ data: { ids: items.map((i) => i.place_id) } })
      .then((r) => setData(r.providers))
      .finally(() => setLoading(false));
  }, [items]);

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-16"><p className="text-muted-foreground">Loading…</p></div>;
  if (!data.length) return (
    <div className="mx-auto max-w-md py-24 text-center px-4">
      <h1 className="font-display text-3xl">Nothing to compare</h1>
      <p className="mt-2 text-sm text-muted-foreground">Add up to 3 studios from search or city pages.</p>
      <Button asChild className="mt-6"><Link to="/search">Find studios</Link></Button>
    </div>
  );

  const rows: Array<{ label: string; render: (p: Provider) => React.ReactNode }> = [
    { label: "City", render: (p) => <span>{p.city}</span> },
    { label: "Branch", render: (p) => p.branch_label ?? "—" },
    { label: "Rating", render: (p) => p.rating ? <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-rating text-rating" />{p.rating} <span className="text-xs text-muted-foreground">({p.review_count ?? 0})</span></span> : "—" },
    { label: "Verified", render: (p) => p.is_verified ? <BadgeCheck className="h-4 w-4 text-brand" /> : "—" },
    { label: "Claimed", render: (p) => p.is_claimed ? "Yes" : "No" },
    { label: "Designers", render: (p) => <span className="text-sm">{p.specialists ?? "—"}</span> },
    { label: "Credentials", render: (p) => <span className="text-sm">{p.credentials ?? "—"}</span> },
    { label: "Services", render: (p) => p.services?.length ? (
      <div className="flex flex-wrap gap-1">
        {p.services.slice(0, 10).map((s: string) => <span key={s} className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize">{s.replace(/-/g, " ")}</span>)}
      </div>
    ) : "—" },
    { label: "Typical job cost", render: (p) => (p as any).typical_project_budget ? (BUDGET_BANDS.find((b) => b.slug === (p as any).typical_project_budget)?.label ?? (p as any).typical_project_budget) : "—" },
    { label: "Style focus", render: (p) => p.skin_types?.length ? p.skin_types.join(", ") : "—" },
    { label: "Notes", render: (p) => p.recovery_tags?.length ? p.recovery_tags.join(", ") : "—" },
    { label: "Address", render: (p) => <span className="text-sm">{p.address ?? "—"}</span> },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 pb-32">
      <h1 className="font-display text-4xl">Compare</h1>
      <p className="mt-2 text-sm text-muted-foreground">Side-by-side comparison of your selected studios.</p>

      {/* Mobile: one card per studio */}
      <div className="mt-8 space-y-6 md:hidden">
        {data.map((p) => (
          <div key={p.place_id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div className="min-w-0">
                <Link to="/provider/$slug" params={{ slug: p.slug }} className="font-display text-lg hover:text-brand break-words">{p.name}</Link>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" />{p.city}</p>
              </div>
              <button onClick={() => remove(p.place_id)} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">Remove</button>
            </div>
            <dl className="divide-y divide-border">
              {rows.map((r) => (
                <div key={r.label} className="p-4">
                  <dt className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">{r.label}</dt>
                  <dd className="mt-1 break-words text-sm">{r.render(p)}</dd>
                </div>
              ))}
            </dl>
            <div className="p-4">
              <Button asChild size="sm" className="w-full rounded-full"><Link to="/provider/$slug" params={{ slug: p.slug }}>View profile</Link></Button>
            </div>
          </div>
        ))}
      </div>

      {/* Tablet and up: side-by-side table */}
      <div className="mt-8 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[700px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-36 min-w-[9rem] border-r border-border bg-background"></th>
              {data.map((p) => (
                <th key={p.place_id} className="border-b border-border p-3 text-left align-top">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link to="/provider/$slug" params={{ slug: p.slug }} className="font-display text-lg hover:text-brand">{p.name}</Link>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" />{p.city}</p>
                    </div>
                    <button onClick={() => remove(p.place_id)} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">Remove</button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.label}>
                <td className={`sticky left-0 z-10 w-36 min-w-[9rem] border-b border-r border-border p-3 align-top text-xs font-semibold uppercase tracking-wider text-muted-foreground ${i % 2 === 1 ? "bg-secondary" : "bg-background"}`}>{r.label}</td>
                {data.map((p) => (
                  <td key={p.place_id} className={`border-b border-border p-3 align-top ${i % 2 === 1 ? "bg-secondary/30" : ""}`}>{r.render(p)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="sticky left-0 z-10 w-36 min-w-[9rem] border-r border-border bg-background p-3"></td>
              {data.map((p) => (
                <td key={p.place_id} className="p-3">
                  <Button asChild size="sm" className="w-full rounded-full"><Link to="/provider/$slug" params={{ slug: p.slug }}>View profile</Link></Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

