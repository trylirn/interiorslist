import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { purgeAnalytics } from "@/lib/admin.functions";
import { setInternalTraffic } from "@/lib/analytics";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  XAxis, YAxis, CartesianGrid, AreaChart, Area, BarChart, Bar, Cell,
  PieChart, Pie, LabelList,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getOverview, getLiveFeed, getCityAnalytics, getCityDetail,
  getProviderAnalytics, getProviderDetail, getUserJourneys, getJourneyDetail,
} from "@/lib/analytics.functions";
import {
  ArrowLeft, ArrowRight, Eye, MousePointerClick, Phone, Globe, MapPin,
  Search as SearchIcon, Smartphone, Zap, X, Compass, Trash2,
} from "lucide-react";

type Range = "today" | "yesterday" | "7d" | "30d" | "this_month" | "last_month";

const RANGE_LABELS: { value: Range; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
];

const PALETTE = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];
const PIE_COLORS = PALETTE;

// Bar colors per section — semantic hues that stay legible in both themes.
const BAR_COLORS = {
  brand: "hsl(var(--chart-1))",
  sky: "hsl(var(--chart-2))",
  amber: "hsl(var(--chart-3))",
  emerald: "hsl(var(--chart-4))",
  violet: "hsl(var(--chart-5))",
  olive: "hsl(var(--chart-2))",
} as const;

const SERIES_CONFIG = {
  impressions: { label: "Impressions", color: "hsl(var(--chart-5))" },
  clicks: { label: "Clicks", color: "hsl(var(--chart-1))" },
  leads: { label: "Leads", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

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

// ---------- Horizontal bar list (Recharts) ----------

type HBarRow = { key: string; label: string; sub?: string; value: number; onClick?: () => void };

function HBarList({ rows, color = BAR_COLORS.brand, emptyLabel = "No data yet." }: {
  rows: HBarRow[];
  color?: string;
  max?: number;
  emptyLabel?: string;
}) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  const config: ChartConfig = { value: { label: "Value", color } };
  const height = Math.max(140, rows.length * 38);
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 40, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={150}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel formatter={(v, _n, item: any) => (
            <span className="text-xs">{num(Number(v))}{item?.payload?.sub ? ` · ${item.payload.sub}` : ""}</span>
          )} />}
        />
        <Bar
          dataKey="value"
          fill={color}
          radius={4}
          onClick={(d: any) => d?.payload?.onClick?.()}
          className={rows.some((r) => r.onClick) ? "cursor-pointer" : ""}
        >
          <LabelList dataKey="value" position="right" className="fill-muted-foreground" fontSize={11} formatter={(v: number) => num(v)} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );

}

// ---------- Dashboard shell ----------

export function AnalyticsDashboard() {
  const [range, setRange] = useState<Range>("7d");
  const purge = useServerFn(purgeAnalytics);
  const [purging, setPurging] = useState(false);
  const qc = useQueryClient();

  // Admins never count as visitors — mark this browser as internal.
  useEffect(() => { setInternalTraffic(true); }, []);

  async function runPurge() {
    if (!window.confirm("Delete ALL recorded analytics sessions and events? This cannot be undone.")) return;
    setPurging(true);
    try {
      await purge({ data: { confirm: "PURGE" } });
      toast.success("Analytics data cleared");
      qc.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to clear analytics");
    } finally { setPurging(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Real public visitors only — editor previews, bots and admin sessions are excluded.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RangePicker value={range} onChange={setRange} />
          <Button size="sm" variant="outline" onClick={runPurge} disabled={purging}>
            <Trash2 className="mr-2 h-3.5 w-3.5" />{purging ? "Clearing…" : "Clear test data"}
          </Button>
        </div>
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

// ---------- Overview ----------

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

  const topCitiesRows: HBarRow[] = data.topCities.slice(0, 8).map((c) => ({
    key: c.slug,
    label: c.name,
    sub: `${num(c.search)} searches · ${num(c.listing_click)} clicks`,
    value: c.demand,
  }));
  const topProviderClicksRows: HBarRow[] = data.topProvidersByClicks.slice(0, 8).map((p) => {
    const impression = 0; // not returned per-provider here; approximate CTR from total.
    void impression;
    return {
      key: p.place_id,
      label: p.name,
      sub: `${num(p.count)} clicks${p.city ? ` · ${p.city}` : ""}`,
      value: p.count,
    };
  });
  const topProviderLeadsRows: HBarRow[] = data.topProvidersByLeads.slice(0, 8).map((p) => ({
    key: p.place_id,
    label: p.name,
    sub: `${num(p.count)} leads${p.city ? ` · ${p.city}` : ""}`,
    value: p.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Searches" value={num(t.searches)} icon={<SearchIcon className="h-4 w-4" />} />
        <StatCard label="Impressions" value={num(t.impressions)} icon={<Eye className="h-4 w-4" />} />
        <StatCard label="Listing Clicks" value={num(t.listing_clicks)} icon={<MousePointerClick className="h-4 w-4" />} />
        <StatCard label="Lead Actions" value={num(t.lead_actions)} sub={`${num(t.unique_leads)} unique people`} icon={<Phone className="h-4 w-4" />} />
        <StatCard label="Click Rate" value={pct(t.click_rate)} sub="clicks / impressions" />
        <StatCard label="Mobile Users" value={pct(t.mobile_share)} sub={`${num(t.sessions)} sessions`} icon={<Smartphone className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Top Cities by Demand" subtitle="Where your traffic is concentrated">
          <HBarList rows={topCitiesRows} color={BAR_COLORS.brand} />
        </ChartCard>
        <ChartCard title="Top Providers by Clicks" subtitle="Which listings visitors choose most">
          <HBarList rows={topProviderClicksRows} color={BAR_COLORS.sky} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Top Providers by Leads" subtitle="Highest customer acquisition intent">
          <HBarList rows={topProviderLeadsRows} color={BAR_COLORS.emerald} />
        </ChartCard>
        <ChartCard title="How Users Discover" subtitle="Entry channel mix">
          <DonutChart data={[
            { name: "Search", value: data.discovery.search },
            { name: "Browse", value: data.discovery.browse },
            { name: "Direct", value: data.discovery.direct },
          ]} />
        </ChartCard>
        <ChartCard title="Lead Actions Breakdown" subtitle="What acquisition looks like">
          <DonutChart data={[
            { name: "Phone", value: data.leadBreakdown.phone },
            { name: "Website", value: data.leadBreakdown.website },
            { name: "Directions", value: data.leadBreakdown.directions },
          ]} />
        </ChartCard>
      </div>

      <ChartCard title="Activity Over Time" subtitle="Impressions, clicks and leads by day">
        <TimeseriesChart data={data.timeseries} height={240} />
      </ChartCard>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="font-display text-lg">Live Activity Feed</h3>
              <p className="text-xs text-muted-foreground">Real-time user journeys · refreshes every 10s</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-600">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live
          </span>
        </div>
        <ul className="divide-y divide-border">
          {(feed?.events ?? []).slice(0, 30).map((e, i) => (
            <JourneyRow key={e.id} event={e} zebra={i % 2 === 1} />
          ))}
          {(!feed || feed.events.length === 0) && (
            <li className="p-10 text-center text-sm text-muted-foreground">Waiting for events…</li>
          )}
        </ul>
      </div>
    </div>
  );
}

// ---------- Journey row ----------

type FeedEvent = {
  id: number | string;
  created_at: string;
  event_type: string;
  lead_type: string | null;
  query: string | null;
  city_slug: string | null;
  visitor_id?: string;
  provider: { name: string; slug: string; city: string } | null;
};

function entryChipFor(e: FeedEvent): { label: string; className: string } {
  if (e.event_type === "search" || e.query) return { label: "SEARCH", className: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" };
  if (e.event_type === "impression" || e.event_type === "listing_click") return { label: "BROWSE", className: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300" };
  return { label: "DIRECT", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" };
}

function actionChipFor(e: FeedEvent): { label: string; icon: React.ReactNode; className: string } | null {
  if (e.event_type === "lead_action") {
    if (e.lead_type === "directions") return { label: "DIRECTIONS", icon: <MapPin className="h-3 w-3" />, className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" };
    if (e.lead_type === "website") return { label: "WEBSITE", icon: <Globe className="h-3 w-3" />, className: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300" };
    if (e.lead_type === "phone") return { label: "PHONE", icon: <Phone className="h-3 w-3" />, className: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300" };
  }
  if (e.event_type === "listing_click") return { label: "CLICK", icon: <MousePointerClick className="h-3 w-3" />, className: "bg-secondary text-secondary-foreground" };
  if (e.event_type === "impression") return { label: "VIEW", icon: <Eye className="h-3 w-3" />, className: "bg-secondary text-secondary-foreground" };
  return null;
}

function Arrow() {
  return <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />;
}

function JourneyRow({ event, zebra }: { event: FeedEvent; zebra: boolean }) {
  const entry = entryChipFor(event);
  const action = actionChipFor(event);
  const segments: React.ReactNode[] = [];

  segments.push(
    <span key="entry" className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${entry.className}`}>
      {entry.label}
    </span>,
  );

  if (event.query) {
    segments.push(<Arrow key="a1" />);
    segments.push(<span key="q" className="truncate text-sm font-medium">"{event.query}"</span>);
  }

  if (event.city_slug) {
    segments.push(<Arrow key="a2" />);
    segments.push(<span key="city" className="truncate text-sm font-semibold text-foreground">{prettifyCity(event.city_slug)}</span>);
  }

  if (event.provider) {
    segments.push(<Arrow key="a3" />);
    segments.push(
      <Link key="prov" to="/provider/$slug" params={{ slug: event.provider.slug }} className="truncate text-sm text-muted-foreground hover:text-brand hover:underline">
        {event.provider.name}
      </Link>,
    );
  }

  if (action) {
    segments.push(<Arrow key="a4" />);
    segments.push(
      <span key="act" className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${action.className}`}>
        {action.icon}
        {action.label}
      </span>,
    );
  }

  return (
    <li className={`flex items-center gap-3 px-5 py-3 ${zebra ? "bg-secondary/20" : ""}`}>
      <span className="w-20 shrink-0 text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(event.created_at), { addSuffix: false })} ago
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {segments}
      </div>
    </li>
  );
}

function prettifyCity(slug: string) {
  return slug.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") + ", TX";
}

// ---------- Chart card + donut ----------

function ChartCard({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="font-display text-lg font-normal">{title}</CardTitle>
          {subtitle && <CardDescription className="text-xs">{subtitle}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function TimeseriesChart({ data, height = 240, legend = true }: { data: any[]; height?: number; legend?: boolean }) {
  return (
    <ChartContainer config={SERIES_CONFIG} className="aspect-auto w-full" style={{ height }}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {(["impressions", "clicks", "leads"] as const).map((k) => (
            <linearGradient key={k} id={`fill-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={`var(--color-${k})`} stopOpacity={0.35} />
              <stop offset="95%" stopColor={`var(--color-${k})`} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        {legend && <ChartLegend content={<ChartLegendContent />} />}
        {(["impressions", "clicks", "leads"] as const).map((k) => (
          <Area key={k} type="monotone" dataKey={k} stroke={`var(--color-${k})`} fill={`url(#fill-${k})`} strokeWidth={2} />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}

function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No data</div>;
  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.name, { label: d.name, color: PALETTE[i % PALETTE.length] }]),
  );
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height: 220 }}>
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}


// ---------- Search bar ----------

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full max-w-xs">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ---------- Cities ----------

function CitiesPanel({ range }: { range: Range }) {
  const [drill, setDrill] = useState<{ slug: string; name: string } | null>(null);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["city-analytics", range],
    queryFn: () => getCityAnalytics({ data: { range } }),
  });
  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.cities;
    return data.cities.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [data, search]);

  if (drill) return <CityDetail range={range} citySlug={drill.slug} cityName={drill.name} onBack={() => setDrill(null)} />;
  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;
  const byImp = [...data.cities].sort((a, b) => b.impressions - a.impressions).slice(0, 8);
  const byLead = [...data.cities].sort((a, b) => b.lead_actions - a.lead_actions).slice(0, 8);
  const bySearch = [...data.cities].sort((a, b) => b.searches - a.searches).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Top by Impressions" subtitle="Where listings surface most">
          <HBarList
            color={BAR_COLORS.violet}
            rows={byImp.map((c) => ({ key: c.slug, label: c.name, sub: `${num(c.impressions)} impressions`, value: c.impressions, onClick: () => setDrill({ slug: c.slug, name: c.name }) }))}
          />
        </ChartCard>
        <ChartCard title="Top Searched Cities" subtitle="Highest search demand">
          <HBarList
            color={BAR_COLORS.amber}
            rows={bySearch.map((c) => ({ key: c.slug, label: c.name, sub: `${num(c.searches)} searches`, value: c.searches, onClick: () => setDrill({ slug: c.slug, name: c.name }) }))}
          />
        </ChartCard>
        <ChartCard title="Top by Lead Actions" subtitle="Cities driving acquisition">
          <HBarList
            color={BAR_COLORS.emerald}
            rows={byLead.map((c) => ({ key: c.slug, label: c.name, sub: `${num(c.lead_actions)} leads`, value: c.lead_actions, onClick: () => setDrill({ slug: c.slug, name: c.name }) }))}
          />
        </ChartCard>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div>
            <h3 className="font-display text-lg">City Activity</h3>
            <p className="text-xs text-muted-foreground">
              {search ? `${filtered.length} of ${data.cities.length} cities` : `${data.cities.length} cities · click any row for details`}
            </p>
          </div>
          <SearchBar value={search} onChange={setSearch} placeholder="Search cities…" />
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>City</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Searches</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Unique</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.slug} onClick={() => setDrill({ slug: c.slug, name: c.name })} className="cursor-pointer">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-right">{num(c.impressions)}</TableCell>
                  <TableCell className="text-right">{num(c.searches)}</TableCell>
                  <TableCell className="text-right">{num(c.clicks)}</TableCell>
                  <TableCell className="text-right">{pct(c.ctr)}</TableCell>
                  <TableCell className="text-right">{num(c.lead_actions)}</TableCell>
                  <TableCell className="text-right">{num(c.unique_visitors)}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="p-8 text-center text-muted-foreground">
                  {search ? `No cities match "${search}".` : "No city data yet."}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
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
              <TimeseriesChart data={data.timeseries} height={220} legend={false} />
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
            <div className="border-b border-border p-5"><h3 className="font-display text-lg">Top providers in {cityName}</h3></div>
            <ProvidersTable rows={data.topProviders} />
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Providers ----------

function ProvidersPanel({ range }: { range: Range }) {
  const [drill, setDrill] = useState<{ placeId: string; name: string } | null>(null);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["prov-analytics", range],
    queryFn: () => getProviderAnalytics({ data: { range } }),
  });
  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.providers;
    return data.providers.filter((p) => p.name.toLowerCase().includes(q) || (p.city ?? "").toLowerCase().includes(q));
  }, [data, search]);

  if (drill) return <ProviderDetailPanel range={range} placeId={drill.placeId} name={drill.name} onBack={() => setDrill(null)} />;
  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;
  const byLeads = [...data.providers].sort((a, b) => b.leads - a.leads).slice(0, 8);
  const byImp = [...data.providers].sort((a, b) => b.impressions - a.impressions).slice(0, 8);
  const byCtr = [...data.providers].filter((p) => p.impressions >= 3).sort((a, b) => b.ctr - a.ctr).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Top by Lead Actions" subtitle="Providers driving real intent">
          <HBarList
            color={BAR_COLORS.emerald}
            rows={byLeads.map((p) => ({ key: p.place_id, label: p.name, sub: `${num(p.leads)} leads${p.city ? ` · ${p.city}` : ""}`, value: p.leads, onClick: () => setDrill({ placeId: p.place_id, name: p.name }) }))}
          />
        </ChartCard>
        <ChartCard title="Top by Impressions" subtitle="Most surfaced listings">
          <HBarList
            color={BAR_COLORS.sky}
            rows={byImp.map((p) => ({ key: p.place_id, label: p.name, sub: `${num(p.impressions)} views${p.city ? ` · ${p.city}` : ""}`, value: p.impressions, onClick: () => setDrill({ placeId: p.place_id, name: p.name }) }))}
          />
        </ChartCard>
        <ChartCard title="Top by CTR" subtitle="Best click-through (≥3 impressions)">
          <HBarList
            color={BAR_COLORS.olive}
            rows={byCtr.map((p) => ({ key: p.place_id, label: p.name, sub: `${pct(p.ctr)} · ${num(p.clicks)} clicks`, value: p.ctr, onClick: () => setDrill({ placeId: p.place_id, name: p.name }) }))}
          />
        </ChartCard>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div>
            <h3 className="font-display text-lg">Providers Activity</h3>
            <p className="text-xs text-muted-foreground">
              {search ? `${filtered.length} of ${data.providers.length} providers` : `${data.providers.length} providers · click any row for details`}
            </p>
          </div>
          <SearchBar value={search} onChange={setSearch} placeholder="Search providers or city…" />
        </div>
        <ProvidersTable
          rows={filtered}
          onRowClick={(p) => setDrill({ placeId: p.place_id, name: p.name })}
          emptyLabel={search ? `No providers match "${search}".` : "No provider data yet."}
        />
      </div>
    </div>
  );
}

function ProvidersTable({ rows, onRowClick, emptyLabel = "No provider data yet." }: { rows: any[]; onRowClick?: (p: any) => void; emptyLabel?: string }) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>City</TableHead>
            <TableHead className="text-right">Impressions</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">Leads</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.place_id} onClick={() => onRowClick?.(p)} className={onRowClick ? "cursor-pointer" : ""}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.city}</TableCell>
              <TableCell className="text-right">{num(p.impressions)}</TableCell>
              <TableCell className="text-right">{num(p.clicks)}</TableCell>
              <TableCell className="text-right">{pct(p.ctr ?? 0)}</TableCell>
              <TableCell className="text-right">{num(p.leads)}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={6} className="p-8 text-center text-muted-foreground">{emptyLabel}</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
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
            <TimeseriesChart data={data.timeseries} height={260} />
          </ChartCard>
        </>
      )}
    </div>
  );
}

// ---------- User Journeys ----------

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
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-brand" />
          <h3 className="font-display text-xl">User Journey Explorer</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">See exactly how users search, compare, and choose a provider.</p>
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
  if (m === "search") return "bg-amber-100 text-amber-800";
  if (m === "browse") return "bg-sky-100 text-sky-800";
  return "bg-emerald-100 text-emerald-800";
}
function WinnerBadge({ lead }: { lead: string | null }) {
  if (!lead) return null;
  const style =
    lead === "phone" ? "bg-rose-100 text-rose-700" :
    lead === "website" ? "bg-sky-100 text-sky-700" :
    lead === "directions" ? "bg-emerald-100 text-emerald-700" :
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
function leadLabel(t: string | null) {
  if (t === "phone") return "called";
  if (t === "website") return "visited website of";
  if (t === "directions") return "got directions to";
  return "engaged with";
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
