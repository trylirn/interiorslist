import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getOverview, getLiveFeed, getCityAnalytics, getCityDetail,
  getProviderAnalytics, getProviderDetail, getUserJourneys, getJourneyDetail,
} from "@/lib/analytics.functions";
import { ArrowLeft, Eye, MousePointerClick, Phone, Globe, MapPin, Search, Smartphone } from "lucide-react";

type Range = "today" | "yesterday" | "7d" | "30d" | "this_month" | "last_month";

const RANGE_LABELS: { value: Range; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
];

const PIE_COLORS = ["hsl(var(--brand))", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];

function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {RANGE_LABELS.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={`rounded-full border px-3 py-1 text-xs transition ${
            value === r.value
              ? "border-brand bg-brand text-brand-foreground"
              : "border-border bg-card hover:border-brand/50"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: React.ReactNode; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function pct(n: number) { return `${(n * 100).toFixed(1)}%`; }
function num(n: number) { return n.toLocaleString(); }

export function AnalyticsDashboard() {
  const [range, setRange] = useState<Range>("7d");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Analytics</h2>
          <p className="text-sm text-muted-foreground">User behavior across the directory.</p>
        </div>
        <RangePicker value={range} onChange={setRange} />
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="journeys">User Journeys</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6"><OverviewPanel range={range} /></TabsContent>
        <TabsContent value="cities" className="mt-6"><CitiesPanel range={range} /></TabsContent>
        <TabsContent value="providers" className="mt-6"><ProvidersPanel range={range} /></TabsContent>
        <TabsContent value="journeys" className="mt-6"><JourneysPanel range={range} /></TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewPanel({ range }: { range: Range }) {
  const { data, isLoading } = useQuery({
    queryKey: ["ovw", range],
    queryFn: () => getOverview({ data: { range } }),
  });
  const { data: feed } = useQuery({
    queryKey: ["live-feed"],
    queryFn: () => getLiveFeed(),
    refetchInterval: 10_000,
  });

  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;

  const t = data.totals;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Searches" value={num(t.searches)} icon={<Search className="h-4 w-4" />} />
        <StatCard label="Impressions" value={num(t.impressions)} icon={<Eye className="h-4 w-4" />} />
        <StatCard label="Listing Clicks" value={num(t.listing_clicks)} icon={<MousePointerClick className="h-4 w-4" />} />
        <StatCard label="Lead Actions" value={num(t.lead_actions)} sub={`${num(t.unique_leads)} unique people`} icon={<Phone className="h-4 w-4" />} />
        <StatCard label="Click Rate" value={pct(t.click_rate)} sub="clicks / impressions" />
        <StatCard label="Mobile Users" value={pct(t.mobile_share)} sub={`${num(t.sessions)} sessions`} icon={<Smartphone className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Top cities by demand" subtitle="Searches + clicks">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.topCities} layout="vertical" margin={{ left: 60 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
              <ChartTooltip />
              <Bar dataKey="demand" fill="hsl(var(--brand))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Top providers by clicks">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.topProvidersByClicks} layout="vertical" margin={{ left: 60 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
              <ChartTooltip />
              <Bar dataKey="count" fill="hsl(var(--brand))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="How users discover">
          <DonutChart data={[
            { name: "Search", value: data.discovery.search },
            { name: "Browse", value: data.discovery.browse },
            { name: "Direct", value: data.discovery.direct },
          ]} />
        </ChartCard>
        <ChartCard title="Lead actions breakdown">
          <DonutChart data={[
            { name: "Phone", value: data.leadBreakdown.phone },
            { name: "Website", value: data.leadBreakdown.website },
            { name: "Directions", value: data.leadBreakdown.directions },
          ]} />
        </ChartCard>
        <ChartCard title="Activity over time">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.timeseries}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="impressions" stroke="#8b5cf6" dot={false} />
              <Line type="monotone" dataKey="clicks" stroke="hsl(var(--brand))" dot={false} />
              <Line type="monotone" dataKey="leads" stroke="#10b981" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h3 className="font-display text-lg">Live action feed</h3>
            <p className="text-xs text-muted-foreground">Real-time user journeys · refreshes every 10s</p>
          </div>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <ul className="divide-y divide-border">
          {(feed?.events ?? []).slice(0, 30).map((e) => (
            <li key={e.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span>{formatEvent(e)}</span>
              <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}</span>
            </li>
          ))}
          {(!feed || feed.events.length === 0) && (
            <li className="p-8 text-center text-sm text-muted-foreground">Waiting for events…</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function formatEvent(e: any): React.ReactNode {
  const v = <span className="text-muted-foreground">visitor</span>;
  const providerLink = e.provider ? (
    <Link to="/provider/$slug" params={{ slug: e.provider.slug }} className="font-medium text-brand hover:underline">{e.provider.name}</Link>
  ) : null;
  switch (e.event_type) {
    case "search":
      return <>{v} searched <span className="font-medium">"{e.query || ""}"</span>{e.city_slug ? ` in ${e.city_slug}` : ""}</>;
    case "impression":
      return <>{v} saw {providerLink}</>;
    case "listing_click":
      return <>{v} clicked {providerLink}</>;
    case "lead_action":
      return <>{v} <span className="font-semibold text-emerald-600">{leadLabel(e.lead_type)}</span> {providerLink}</>;
    case "page_view":
      return <>{v} viewed a page{e.city_slug ? ` in ${e.city_slug}` : ""}</>;
    default:
      return <>{v} {e.event_type}</>;
  }
}
function leadLabel(t: string | null) {
  if (t === "phone") return "called";
  if (t === "website") return "visited website of";
  if (t === "directions") return "got directions to";
  return "engaged with";
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3">
        <h3 className="font-display text-lg">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No data</div>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <ChartTooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// -------- Cities

function CitiesPanel({ range }: { range: Range }) {
  const [drill, setDrill] = useState<{ slug: string; name: string } | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["city-analytics", range],
    queryFn: () => getCityAnalytics({ data: { range } }),
  });
  if (drill) return <CityDetail range={range} citySlug={drill.slug} cityName={drill.name} onBack={() => setDrill(null)} />;
  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;
  const byImp = [...data.cities].sort((a, b) => b.impressions - a.impressions).slice(0, 10);
  const byLead = [...data.cities].sort((a, b) => b.lead_actions - a.lead_actions).slice(0, 10);
  const bySearch = [...data.cities].sort((a, b) => b.searches - a.searches).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Top by impressions">
          <RankList rows={byImp} field="impressions" />
        </ChartCard>
        <ChartCard title="Top searched cities">
          <RankList rows={bySearch} field="searches" />
        </ChartCard>
        <ChartCard title="Top by lead actions">
          <RankList rows={byLead} field="lead_actions" />
        </ChartCard>
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-display text-lg">City activity — click any row for details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">City</th>
                <th className="p-3 text-right">Impressions</th>
                <th className="p-3 text-right">Searches</th>
                <th className="p-3 text-right">Clicks</th>
                <th className="p-3 text-right">CTR</th>
                <th className="p-3 text-right">Leads</th>
                <th className="p-3 text-right">Unique</th>
              </tr>
            </thead>
            <tbody>
              {data.cities.map((c) => (
                <tr key={c.slug} onClick={() => setDrill({ slug: c.slug, name: c.name })} className="cursor-pointer border-t border-border hover:bg-secondary/40">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-right">{num(c.impressions)}</td>
                  <td className="p-3 text-right">{num(c.searches)}</td>
                  <td className="p-3 text-right">{num(c.clicks)}</td>
                  <td className="p-3 text-right">{pct(c.ctr)}</td>
                  <td className="p-3 text-right">{num(c.lead_actions)}</td>
                  <td className="p-3 text-right">{num(c.unique_visitors)}</td>
                </tr>
              ))}
              {data.cities.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No city data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RankList<T extends { slug?: string; name: string }>({ rows, field }: { rows: T[]; field: keyof T }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No data.</p>;
  return (
    <ul className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={(r.slug ?? r.name) + i} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-secondary/40">
          <span className="flex items-center gap-2 truncate"><span className="w-5 text-xs text-muted-foreground">{i + 1}</span> <span className="truncate">{r.name}</span></span>
          <span className="font-medium">{num((r[field] as unknown as number) ?? 0)}</span>
        </li>
      ))}
    </ul>
  );
}

function CityDetail({ range, citySlug, cityName, onBack }: { range: Range; citySlug: string; cityName: string; onBack: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["city-detail", range, citySlug],
    queryFn: () => getCityDetail({ data: { range, citySlug } }),
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" />Back to cities</Button>
        <h3 className="font-display text-2xl">{cityName}</h3>
      </div>
      {isLoading || !data ? <p className="text-muted-foreground">Loading…</p> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <StatCard label="Impressions" value={num(data.totals.impression)} />
            <StatCard label="Searches" value={num(data.totals.search)} />
            <StatCard label="Clicks" value={num(data.totals.listing_click)} />
            <StatCard label="Lead actions" value={num(data.totals.lead_action)} sub={`${data.leads.phone} calls · ${data.leads.website} web · ${data.leads.directions} dir`} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Activity over time">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.timeseries}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip />
                  <Line type="monotone" dataKey="impressions" stroke="#8b5cf6" dot={false} />
                  <Line type="monotone" dataKey="clicks" stroke="hsl(var(--brand))" dot={false} />
                  <Line type="monotone" dataKey="leads" stroke="#10b981" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Top searched queries">
              {data.topQueries.length === 0 ? <p className="text-sm text-muted-foreground">No search queries yet.</p> : (
                <ul className="space-y-1">
                  {data.topQueries.map((q) => (
                    <li key={q.q} className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-secondary/40">
                      <span className="truncate">"{q.q}"</span>
                      <span className="text-muted-foreground">{q.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </ChartCard>
          </div>
          <div className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border p-4"><h3 className="font-display text-lg">Top providers in {cityName}</h3></div>
            <ProvidersTable rows={data.topProviders} />
          </div>
        </>
      )}
    </div>
  );
}

// -------- Providers

function ProvidersPanel({ range }: { range: Range }) {
  const [drill, setDrill] = useState<{ placeId: string; name: string } | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["prov-analytics", range],
    queryFn: () => getProviderAnalytics({ data: { range } }),
  });
  if (drill) return <ProviderDetailPanel range={range} placeId={drill.placeId} name={drill.name} onBack={() => setDrill(null)} />;
  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;
  const byLeads = [...data.providers].sort((a, b) => b.leads - a.leads).slice(0, 10);
  const byImp = [...data.providers].sort((a, b) => b.impressions - a.impressions).slice(0, 10);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Top providers by lead actions"><RankList rows={byLeads} field="leads" /></ChartCard>
        <ChartCard title="Top providers by impressions"><RankList rows={byImp} field="impressions" /></ChartCard>
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4"><h3 className="font-display text-lg">Providers activity — click any row for details</h3></div>
        <ProvidersTable
          rows={data.providers}
          onRowClick={(p) => setDrill({ placeId: p.place_id, name: p.name })}
        />
      </div>
    </div>
  );
}

function ProvidersTable({ rows, onRowClick }: { rows: any[]; onRowClick?: (p: any) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="p-3">Provider</th>
            <th className="p-3">City</th>
            <th className="p-3 text-right">Impressions</th>
            <th className="p-3 text-right">Clicks</th>
            <th className="p-3 text-right">CTR</th>
            <th className="p-3 text-right">Leads</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.place_id} onClick={() => onRowClick?.(p)} className={`border-t border-border ${onRowClick ? "cursor-pointer hover:bg-secondary/40" : ""}`}>
              <td className="p-3 font-medium">{p.name}</td>
              <td className="p-3">{p.city}</td>
              <td className="p-3 text-right">{num(p.impressions)}</td>
              <td className="p-3 text-right">{num(p.clicks)}</td>
              <td className="p-3 text-right">{pct(p.ctr ?? 0)}</td>
              <td className="p-3 text-right">{num(p.leads)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No provider data yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ProviderDetailPanel({ range, placeId, name, onBack }: { range: Range; placeId: string; name: string; onBack: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["prov-detail", range, placeId],
    queryFn: () => getProviderDetail({ data: { range, placeId } }),
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" />Back to providers</Button>
        <h3 className="font-display text-2xl">{name}</h3>
      </div>
      {isLoading || !data ? <p className="text-muted-foreground">Loading…</p> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <StatCard label="Impressions" value={num(data.totals.impression)} />
            <StatCard label="Clicks" value={num(data.totals.listing_click)} />
            <StatCard label="Lead actions" value={num(data.totals.lead_action)} sub={`${num(data.unique_visitors)} unique visitors`} />
            <StatCard label="Lead mix" value={`${data.leads.phone}/${data.leads.website}/${data.leads.directions}`} sub="phone / web / directions" />
          </div>
          <ChartCard title="Activity over time">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.timeseries}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="impressions" stroke="#8b5cf6" />
                <Line type="monotone" dataKey="clicks" stroke="hsl(var(--brand))" />
                <Line type="monotone" dataKey="leads" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </div>
  );
}

// -------- User Journeys

function JourneysPanel({ range }: { range: Range }) {
  const [entry, setEntry] = useState<"all" | "search" | "browse" | "direct">("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["journeys", range, entry, page],
    queryFn: () => getUserJourneys({ data: { range, entry, page } }),
  });
  if (selected) return <JourneyDetailPanel sessionId={selected} onBack={() => setSelected(null)} />;
  const totals = data?.journeys ?? [];
  const counts = countsByEntry(totals);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-xl">User Journey Explorer</h3>
        <p className="text-sm text-muted-foreground">See exactly how users search, compare, and choose a provider.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="uppercase tracking-widest text-muted-foreground">Entry method:</span>
          {[
            { v: "all", l: `All (${data?.total ?? 0})` },
            { v: "search", l: `Search (${counts.search})` },
            { v: "browse", l: `Browse (${counts.browse})` },
            { v: "direct", l: `Direct (${counts.direct})` },
          ].map((o) => (
            <button
              key={o.v}
              onClick={() => { setEntry(o.v as any); setPage(0); }}
              className={`rounded-full border px-3 py-1 ${entry === o.v ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card hover:border-brand/50"}`}
            >{o.l}</button>
          ))}
        </div>
      </div>

      {isLoading || !data ? <p className="text-muted-foreground">Loading…</p> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.journeys.map((j) => (
              <button
                key={j.id}
                onClick={() => setSelected(j.id)}
                className="rounded-2xl border border-border bg-card p-4 text-left transition hover:border-brand hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${entryStyle(j.entry_method)}`}>{j.entry_method}</span>
                  <span className="text-[11px] text-muted-foreground">{j.steps} step{j.steps === 1 ? "" : "s"} · {Math.max(1, Math.round(j.duration_ms / 60000))} min</span>
                </div>
                <p className="mt-3 font-display text-lg">{j.city_slug ?? "Unknown"}</p>
                {j.winner ? (
                  <p className="mt-1 flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">Winner:</span>
                    <span className="font-medium text-brand truncate">{j.winner.name}</span>
                    <WinnerBadge lead={j.winner_lead} />
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">No provider selected</p>
                )}
                <p className="mt-3 text-[11px] text-muted-foreground">{new Date(j.started_at).toLocaleString()}</p>
              </button>
            ))}
            {data.journeys.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                No sessions yet in this range.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 text-sm">
            <span className="text-muted-foreground">
              Showing {data.journeys.length === 0 ? 0 : page * data.pageSize + 1}–{page * data.pageSize + data.journeys.length} of {data.total} sessions
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * data.pageSize >= data.total} onClick={() => setPage(page + 1)}>Next →</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function countsByEntry(rows: { entry_method: string }[]) {
  return rows.reduce(
    (acc, r) => { (acc as any)[r.entry_method] = ((acc as any)[r.entry_method] ?? 0) + 1; return acc; },
    { search: 0, browse: 0, direct: 0 } as { search: number; browse: number; direct: number },
  );
}
function entryStyle(m: string) {
  if (m === "search") return "bg-orange-100 text-orange-700";
  if (m === "browse") return "bg-brand/10 text-brand";
  return "bg-secondary text-secondary-foreground";
}
function WinnerBadge({ lead }: { lead: string | null }) {
  if (!lead) return null;
  const style =
    lead === "phone" ? "bg-emerald-50 text-emerald-700" :
    lead === "website" ? "bg-sky-50 text-sky-700" :
    lead === "directions" ? "bg-emerald-50 text-emerald-700" :
    "bg-secondary";
  const label = lead === "click" ? "click" : lead;
  return <span className={`ml-1 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${style}`}>{label}</span>;
}

function JourneyDetailPanel({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["journey", sessionId],
    queryFn: () => getJourneyDetail({ data: { sessionId } }),
  });
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" />Back to journeys</Button>
      {isLoading || !data ? <p className="text-muted-foreground">Loading…</p> : (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-2xl">Session in {data.session?.city_slug ?? "unknown"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.events.length} step{data.events.length === 1 ? "" : "s"} ·
            {" "}Entry: {data.session?.entry_method ?? "—"} ·
            {" "}{data.session?.is_mobile ? "Mobile" : "Desktop"} ·
            {" "}{data.session?.started_at ? new Date(data.session.started_at).toLocaleString() : ""}
          </p>
          <ol className="relative mt-6 space-y-1 border-l border-border pl-6">
            {data.events.map((e) => (
              <li key={e.id} className="relative py-2.5">
                <span className="absolute -left-[27px] top-3 flex h-3 w-3 items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-brand" />
                </span>
                <div className="flex items-start justify-between rounded-lg bg-secondary/30 px-4 py-2.5">
                  <span className="text-sm">{stepIcon(e.event_type, e.lead_type)} {stepLabel(e)}</span>
                  <span className="ml-4 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleTimeString()}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function stepIcon(t: string, lead: string | null) {
  if (t === "search") return "🔍";
  if (t === "impression") return "👁";
  if (t === "listing_click") return "👆";
  if (t === "lead_action") {
    if (lead === "phone") return "📞";
    if (lead === "website") return "🌐";
    if (lead === "directions") return "📍";
  }
  if (t === "page_view") return "📄";
  return "•";
}
function stepLabel(e: any): React.ReactNode {
  const p = e.provider ? <Link to="/provider/$slug" params={{ slug: e.provider.slug }} className="font-medium text-brand hover:underline">{e.provider.name}</Link> : null;
  switch (e.event_type) {
    case "search": return <>Searched <span className="font-medium">"{e.query || ""}"</span>{e.city_slug ? ` in ${e.city_slug}` : ""}</>;
    case "impression": return <>Saw {p}</>;
    case "listing_click": return <>Clicked {p}</>;
    case "lead_action": return <><span className="font-semibold text-emerald-700">{leadLabel(e.lead_type)}</span> {p}</>;
    case "page_view": return <>Viewed <span className="text-muted-foreground">{e.path}</span></>;
    default: return e.event_type;
  }
}
