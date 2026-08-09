import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

// Loose typed handle for our new tables (types are regenerated later).

const RangeSchema = z.object({
  range: z.enum(["today", "yesterday", "7d", "30d", "this_month", "last_month", "custom"]).default("7d"),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
type RangeInput = z.infer<typeof RangeSchema>;

function resolveRange(r: RangeInput): { from: string; to: string } {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  let from: Date; let to: Date;
  switch (r.range) {
    case "today":
      from = startOfDay(now); to = now; break;
    case "yesterday":
      to = startOfDay(now);
      from = new Date(to.getTime() - 86400_000);
      break;
    case "7d":
      from = new Date(now.getTime() - 7 * 86400_000); to = now; break;
    case "30d":
      from = new Date(now.getTime() - 30 * 86400_000); to = now; break;
    case "this_month":
      from = startOfMonth(now); to = now; break;
    case "last_month":
      to = startOfMonth(now);
      from = new Date(to.getFullYear(), to.getMonth() - 1, 1);
      break;
    case "custom":
      from = r.from ? new Date(r.from) : new Date(now.getTime() - 7 * 86400_000);
      to = r.to ? new Date(r.to) : now;
      break;
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

async function fetchEvents(from: string, to: string, extra?: (q: any) => any) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as unknown as { from: (t: string) => any };
  let q = db.from("analytics_events").select("*").gte("created_at", from).lte("created_at", to);
  if (extra) q = extra(q);
  const { data } = await q.limit(20000);
  return (data ?? []) as any[];
}

async function fetchSessions(from: string, to: string) {
  const { data } = await db
    .from("analytics_sessions")
    .select("*")
    .gte("started_at", from)
    .lte("started_at", to)
    .limit(20000);
  return (data ?? []) as any[];
}

async function providerNameMap(ids: string[]): Promise<Map<string, { name: string; city: string; slug: string }>> {
  const uniq = Array.from(new Set(ids.filter(Boolean)));
  if (uniq.length === 0) return new Map();
  const { data } = await supabaseAdmin
    .from("providers")
    .select("place_id, name, city, slug")
    .in("place_id", uniq);
  return new Map((data ?? []).map((p: any) => [p.place_id, { name: p.name, city: p.city, slug: p.slug }]));
}

export const getOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => RangeSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { from, to } = resolveRange(data);
    const [events, sessions] = await Promise.all([fetchEvents(from, to), fetchSessions(from, to)]);

    const counts = { search: 0, impression: 0, listing_click: 0, lead_action: 0 };
    const leadBreakdown = { phone: 0, website: 0, directions: 0 };
    const leadVisitors = new Set<string>();
    const cityCounts = new Map<string, { search: number; impression: number; listing_click: number; lead_action: number }>();
    const providerClicks = new Map<string, number>();
    const providerLeads = new Map<string, number>();
    const byDay = new Map<string, { day: string; searches: number; impressions: number; clicks: number; leads: number }>();

    for (const e of events) {
      const t = e.event_type as keyof typeof counts;
      if (t in counts) counts[t]++;
      if (e.event_type === "lead_action") {
        leadVisitors.add(e.visitor_id);
        if (e.lead_type && e.lead_type in leadBreakdown) leadBreakdown[e.lead_type as keyof typeof leadBreakdown]++;
      }
      if (e.city_slug) {
        const c = cityCounts.get(e.city_slug) ?? { search: 0, impression: 0, listing_click: 0, lead_action: 0 };
        if (t in c) c[t]++;
        cityCounts.set(e.city_slug, c);
      }
      if (e.provider_place_id) {
        if (e.event_type === "listing_click") providerClicks.set(e.provider_place_id, (providerClicks.get(e.provider_place_id) ?? 0) + 1);
        if (e.event_type === "lead_action") providerLeads.set(e.provider_place_id, (providerLeads.get(e.provider_place_id) ?? 0) + 1);
      }
      const day = String(e.created_at).slice(0, 10);
      const d = byDay.get(day) ?? { day, searches: 0, impressions: 0, clicks: 0, leads: 0 };
      if (e.event_type === "search") d.searches++;
      else if (e.event_type === "impression") d.impressions++;
      else if (e.event_type === "listing_click") d.clicks++;
      else if (e.event_type === "lead_action") d.leads++;
      byDay.set(day, d);
    }

    const mobileSessions = sessions.filter((s) => s.is_mobile).length;
    const discovery = { search: 0, browse: 0, direct: 0 };
    for (const s of sessions) {
      const m = (s.entry_method as keyof typeof discovery) ?? "direct";
      if (m in discovery) discovery[m]++;
    }

    const topProviderIds = new Set<string>();
    const topClickList = Array.from(providerClicks.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const topLeadList = Array.from(providerLeads.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    for (const [id] of topClickList) topProviderIds.add(id);
    for (const [id] of topLeadList) topProviderIds.add(id);
    const names = await providerNameMap(Array.from(topProviderIds));

    // City display names
    const citySlugs = Array.from(cityCounts.keys());
    const cityNames = new Map<string, string>();
    if (citySlugs.length > 0) {
      const { data: rows } = await supabaseAdmin.from("providers").select("city_slug, city").in("city_slug", citySlugs);
      for (const r of rows ?? []) if (!cityNames.has(r.city_slug)) cityNames.set(r.city_slug, r.city);
    }
    const topCities = Array.from(cityCounts.entries())
      .map(([slug, c]) => ({ slug, name: cityNames.get(slug) ?? slug, ...c, demand: c.search + c.listing_click }))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 10);

    return {
      totals: {
        searches: counts.search,
        impressions: counts.impression,
        listing_clicks: counts.listing_click,
        lead_actions: counts.lead_action,
        unique_leads: leadVisitors.size,
        click_rate: counts.impression > 0 ? counts.listing_click / counts.impression : 0,
        mobile_share: sessions.length > 0 ? mobileSessions / sessions.length : 0,
        sessions: sessions.length,
      },
      leadBreakdown,
      discovery,
      topCities,
      topProvidersByClicks: topClickList.map(([id, count]) => ({ place_id: id, count, ...(names.get(id) ?? { name: id, city: "", slug: "" }) })),
      topProvidersByLeads: topLeadList.map(([id, count]) => ({ place_id: id, count, ...(names.get(id) ?? { name: id, city: "", slug: "" }) })),
      timeseries: Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day)),
    };
  });

/**
 * Live feed, summarised per visitor session.
 * One row per session — impressions collapse into a "viewed N studios" count
 * so a single visitor browsing a results page no longer floods the feed.
 */
export const getLiveFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data } = await db
      .from("analytics_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(600);
    const events = (data ?? []) as any[];

    type Row = {
      session_id: string;
      last_at: string;
      first_at: string;
      entry: "search" | "browse" | "direct";
      query: string | null;
      city_slug: string | null;
      path: string | null;
      views: number;
      clicks: number;
      leads: number;
      steps: number;
      last_provider_id: string | null;
      last_action: { type: "lead" | "click" | "view"; lead_type: string | null } | null;
    };

    const bySession = new Map<string, Row>();
    // events arrive newest-first
    for (const e of events) {
      const sid = e.session_id as string;
      let r = bySession.get(sid);
      if (!r) {
        if (bySession.size >= 25) continue;
        r = {
          session_id: sid,
          last_at: e.created_at,
          first_at: e.created_at,
          entry: "direct",
          query: null,
          city_slug: null,
          path: e.path ?? null,
          views: 0,
          clicks: 0,
          leads: 0,
          steps: 0,
          last_provider_id: null,
          last_action: null,
        };
        bySession.set(sid, r);
      }
      r.first_at = e.created_at;
      if (e.city_slug && !r.city_slug) r.city_slug = e.city_slug;
      if (e.query && !r.query) r.query = e.query;

      if (e.event_type === "impression") {
        r.views += 1;
      } else if (e.event_type === "listing_click") {
        r.clicks += 1;
        r.steps += 1;
      } else if (e.event_type === "lead_action") {
        r.leads += 1;
        r.steps += 1;
      } else if (e.event_type === "search") {
        r.steps += 1;
      }

      // strongest / most recent action wins (we iterate newest-first)
      if (!r.last_action) {
        if (e.event_type === "lead_action") r.last_action = { type: "lead", lead_type: e.lead_type ?? null };
        else if (e.event_type === "listing_click") r.last_action = { type: "click", lead_type: null };
        else if (e.event_type === "impression") r.last_action = { type: "view", lead_type: null };
      }
      if (!r.last_provider_id && e.provider_place_id) r.last_provider_id = e.provider_place_id;
    }

    const rows = Array.from(bySession.values());
    for (const r of rows) {
      r.entry = r.query ? "search" : r.views > 0 || r.clicks > 0 || r.leads > 0 ? "browse" : "direct";
    }
    const names = await providerNameMap(rows.map((r) => r.last_provider_id).filter(Boolean) as string[]);

    return {
      sessions: rows
        .sort((a, b) => b.last_at.localeCompare(a.last_at))
        .map((r) => ({
          session_id: r.session_id,
          last_at: r.last_at,
          entry: r.entry,
          query: r.query,
          city_slug: r.city_slug,
          path: r.path,
          views: r.views,
          clicks: r.clicks,
          leads: r.leads,
          steps: r.steps,
          last_action: r.last_action,
          provider: r.last_provider_id ? names.get(r.last_provider_id) ?? null : null,
        })),
    };
  });


export const getCityAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => RangeSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { from, to } = resolveRange(data);
    const events = await fetchEvents(from, to);
    const byCity = new Map<string, { impression: number; search: number; listing_click: number; lead_action: number; visitors: Set<string> }>();
    for (const e of events) {
      if (!e.city_slug) continue;
      const c = byCity.get(e.city_slug) ?? { impression: 0, search: 0, listing_click: 0, lead_action: 0, visitors: new Set() };
      const t = e.event_type as keyof Omit<typeof c, "visitors">;
      if (t in c) (c as any)[t]++;
      c.visitors.add(e.visitor_id);
      byCity.set(e.city_slug, c);
    }
    const slugs = Array.from(byCity.keys());
    const cityNames = new Map<string, string>();
    if (slugs.length > 0) {
      const { data: rows } = await supabaseAdmin.from("providers").select("city_slug, city").in("city_slug", slugs);
      for (const r of rows ?? []) if (!cityNames.has(r.city_slug)) cityNames.set(r.city_slug, r.city);
    }
    const rows = Array.from(byCity.entries()).map(([slug, c]) => ({
      slug,
      name: cityNames.get(slug) ?? slug,
      impressions: c.impression,
      searches: c.search,
      clicks: c.listing_click,
      lead_actions: c.lead_action,
      unique_visitors: c.visitors.size,
      ctr: c.impression > 0 ? c.listing_click / c.impression : 0,
    }));
    return {
      cities: rows.sort((a, b) => b.impressions + b.clicks - (a.impressions + a.clicks)),
    };
  });

export const getCityDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => RangeSchema.extend({ citySlug: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { from, to } = resolveRange(data);
    const events = await fetchEvents(from, to, (q) => q.eq("city_slug", data.citySlug));
    const totals = { impression: 0, search: 0, listing_click: 0, lead_action: 0 };
    const leads = { phone: 0, website: 0, directions: 0 };
    const providerCounts = new Map<string, { impressions: number; clicks: number; leads: number }>();
    const queries = new Map<string, number>();
    const byDay = new Map<string, { day: string; impressions: number; clicks: number; leads: number }>();
    for (const e of events) {
      const t = e.event_type as keyof typeof totals;
      if (t in totals) totals[t]++;
      if (e.event_type === "lead_action" && e.lead_type && e.lead_type in leads) leads[e.lead_type as keyof typeof leads]++;
      if (e.provider_place_id) {
        const p = providerCounts.get(e.provider_place_id) ?? { impressions: 0, clicks: 0, leads: 0 };
        if (e.event_type === "impression") p.impressions++;
        if (e.event_type === "listing_click") p.clicks++;
        if (e.event_type === "lead_action") p.leads++;
        providerCounts.set(e.provider_place_id, p);
      }
      if (e.event_type === "search" && e.query) queries.set(e.query, (queries.get(e.query) ?? 0) + 1);
      const day = String(e.created_at).slice(0, 10);
      const d = byDay.get(day) ?? { day, impressions: 0, clicks: 0, leads: 0 };
      if (e.event_type === "impression") d.impressions++;
      if (e.event_type === "listing_click") d.clicks++;
      if (e.event_type === "lead_action") d.leads++;
      byDay.set(day, d);
    }
    const names = await providerNameMap(Array.from(providerCounts.keys()));
    return {
      totals,
      leads,
      topProviders: Array.from(providerCounts.entries())
        .map(([id, c]) => ({ place_id: id, ...c, ...(names.get(id) ?? { name: id, slug: "", city: "" }) }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 20),
      topQueries: Array.from(queries.entries()).map(([q, count]) => ({ q, count })).sort((a, b) => b.count - a.count).slice(0, 15),
      timeseries: Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day)),
    };
  });

export const getProviderAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => RangeSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { from, to } = resolveRange(data);
    const events = await fetchEvents(from, to);
    const map = new Map<string, { impressions: number; clicks: number; leads: number }>();
    for (const e of events) {
      if (!e.provider_place_id) continue;
      const p = map.get(e.provider_place_id) ?? { impressions: 0, clicks: 0, leads: 0 };
      if (e.event_type === "impression") p.impressions++;
      if (e.event_type === "listing_click") p.clicks++;
      if (e.event_type === "lead_action") p.leads++;
      map.set(e.provider_place_id, p);
    }
    const names = await providerNameMap(Array.from(map.keys()));
    const rows = Array.from(map.entries()).map(([id, c]) => ({
      place_id: id,
      ...c,
      ctr: c.impressions > 0 ? c.clicks / c.impressions : 0,
      ...(names.get(id) ?? { name: id, slug: "", city: "" }),
    }));
    return {
      providers: rows.sort((a, b) => b.leads + b.clicks - (a.leads + a.clicks)),
    };
  });

export const getProviderDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => RangeSchema.extend({ placeId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { from, to } = resolveRange(data);
    const events = await fetchEvents(from, to, (q) => q.eq("provider_place_id", data.placeId));
    const totals = { impression: 0, listing_click: 0, lead_action: 0 };
    const leads = { phone: 0, website: 0, directions: 0 };
    const byDay = new Map<string, { day: string; impressions: number; clicks: number; leads: number }>();
    const visitors = new Set<string>();
    for (const e of events) {
      const t = e.event_type as keyof typeof totals;
      if (t in totals) totals[t]++;
      if (e.event_type === "lead_action" && e.lead_type && e.lead_type in leads) leads[e.lead_type as keyof typeof leads]++;
      visitors.add(e.visitor_id);
      const day = String(e.created_at).slice(0, 10);
      const d = byDay.get(day) ?? { day, impressions: 0, clicks: 0, leads: 0 };
      if (e.event_type === "impression") d.impressions++;
      if (e.event_type === "listing_click") d.clicks++;
      if (e.event_type === "lead_action") d.leads++;
      byDay.set(day, d);
    }
    const names = await providerNameMap([data.placeId]);
    return {
      totals,
      leads,
      unique_visitors: visitors.size,
      provider: names.get(data.placeId) ?? null,
      timeseries: Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day)),
    };
  });

export const getUserJourneys = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    RangeSchema.extend({
      entry: z.enum(["all", "search", "browse", "direct"]).default("all"),
      page: z.number().int().min(0).max(200).default(0),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { from, to } = resolveRange(data);
    let sq = db
      .from("analytics_sessions")
      .select("*")
      .gte("started_at", from)
      .lte("started_at", to)
      .order("started_at", { ascending: false });
    if (data.entry !== "all") sq = sq.eq("entry_method", data.entry);
    const pageSize = 12;
    const { data: sessions } = await sq.range(data.page * pageSize, data.page * pageSize + pageSize - 1);
    const sess = (sessions ?? []) as any[];
    const sessIds = sess.map((s) => s.id);
    let eventMap = new Map<string, any[]>();
    if (sessIds.length > 0) {
      const { data: evs } = await db.from("analytics_events").select("*").in("session_id", sessIds).order("created_at", { ascending: true });
      for (const e of (evs ?? []) as any[]) {
        const list = eventMap.get(e.session_id) ?? [];
        list.push(e);
        eventMap.set(e.session_id, list);
      }
    }
    const winnerIds: string[] = [];
    for (const s of sess) {
      const evs = eventMap.get(s.id) ?? [];
      const lead = [...evs].reverse().find((e) => e.event_type === "lead_action");
      const click = [...evs].reverse().find((e) => e.event_type === "listing_click");
      const winner = lead?.provider_place_id ?? click?.provider_place_id ?? null;
      if (winner) winnerIds.push(winner);
      s._winner = winner;
      s._winnerLead = lead?.lead_type ?? (click ? "click" : null);
      s._steps = evs.filter((e) => e.event_type !== "impression").length;
      s._durationMs = evs.length > 0 ? new Date(evs[evs.length - 1].created_at).getTime() - new Date(s.started_at).getTime() : 0;
    }
    const names = await providerNameMap(winnerIds);
    // total count
    let cq = db.from("analytics_sessions").select("*", { count: "exact", head: true }).gte("started_at", from).lte("started_at", to);
    if (data.entry !== "all") cq = cq.eq("entry_method", data.entry);
    const { count } = await cq;
    return {
      total: count ?? sess.length,
      pageSize,
      page: data.page,
      journeys: sess.map((s) => ({
        id: s.id,
        started_at: s.started_at,
        entry_method: s.entry_method,
        city_slug: s.city_slug,
        steps: s._steps,
        duration_ms: s._durationMs,
        is_mobile: s.is_mobile,
        winner: s._winner ? names.get(s._winner) ?? null : null,
        winner_place_id: s._winner,
        winner_lead: s._winnerLead,
      })),
    };
  });

export const getJourneyDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: session } = await db.from("analytics_sessions").select("*").eq("id", data.sessionId).maybeSingle();
    const { data: events } = await db.from("analytics_events").select("*").eq("session_id", data.sessionId).order("created_at", { ascending: true });
    const evs = (events ?? []) as any[];
    const ids = evs.map((e) => e.provider_place_id).filter(Boolean) as string[];
    const names = await providerNameMap(ids);
    return {
      session,
      events: evs.map((e) => ({
        id: e.id,
        created_at: e.created_at,
        event_type: e.event_type,
        lead_type: e.lead_type,
        query: e.query,
        city_slug: e.city_slug,
        path: e.path,
        provider: e.provider_place_id ? names.get(e.provider_place_id) ?? null : null,
      })),
    };
  });
