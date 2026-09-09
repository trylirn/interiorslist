import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fail } from "@/lib/errors";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdmin } from "@/lib/caller-role";

export type CostContext = {
  studioCount: number;
  verifiedCount: number;
  citiesCovered: number;
  reportedBudgets: string[];
  sampleSize: number;
  topCities: { slug: string; name: string; state: string; count: number }[];
};

/**
 * Directory-derived context for the cost pages: how many studios we list in a
 * region, how many of them publish a typical project budget, and which cities
 * carry the most coverage. Sample sizes are always surfaced in the UI so the
 * numbers can't be mistaken for a quote.
 */
export const getCostContext = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ state: z.string().length(2).optional() }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("providers")
      .select("city, city_slug, state, is_verified, typical_project_budget")
      .eq("published", true);
    if (data.state) q = q.eq("state", data.state.toUpperCase());
    const { data: rows, error } = await q;
    if (error) fail(error);

    const cities = new Map<string, { slug: string; name: string; state: string; count: number }>();
    const budgets: string[] = [];
    let verified = 0;
    for (const r of rows ?? []) {
      if (r.is_verified) verified += 1;
      const b = (r.typical_project_budget ?? "").trim();
      if (b && !/^(contact|inquire)/i.test(b)) budgets.push(b);
      if (!r.city_slug) continue;
      const cur =
        cities.get(r.city_slug) ??
        { slug: r.city_slug, name: r.city ?? r.city_slug, state: (r.state ?? "").toUpperCase(), count: 0 };
      cur.count += 1;
      cities.set(r.city_slug, cur);
    }

    const ctx: CostContext = {
      studioCount: rows?.length ?? 0,
      verifiedCount: verified,
      citiesCovered: cities.size,
      reportedBudgets: Array.from(new Set(budgets)).slice(0, 12),
      sampleSize: budgets.length,
      topCities: Array.from(cities.values()).sort((a, b) => b.count - a.count).slice(0, 12),
    };
    return ctx;
  });

/** Studios in a state, for the "who does this work near you" block on cost pages. */
export const listStudiosForCost = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ state: z.string().length(2).optional(), limit: z.number().min(1).max(24).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("providers")
      .select("place_id, slug, name, city, state, is_verified, services, typical_project_budget, logo_url")
      .eq("published", true);
    if (data.state) q = q.eq("state", data.state.toUpperCase());
    const { data: rows, error } = await q
      .order("is_verified", { ascending: false })
      .order("name")
      .limit(data.limit ?? 12);
    if (error) fail(error);
    return { studios: rows ?? [] };
  });

/** Admin-only: which tool combinations people actually use, and whether a page exists. */
export const getToolDemand = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
  await requireAdmin(context.userId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: rows, error } = await supabaseAdmin
    .from("tool_usage")
    .select("tool, room_type, scope, state_code, style_slug, budget_band, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) fail(error);

  const byTool = new Map<string, number>();
  const byCombo = new Map<string, { room: string; scope: string; state: string; count: number }>();
  const byState = new Map<string, number>();
  const byStyle = new Map<string, number>();
  for (const r of rows ?? []) {
    byTool.set(r.tool, (byTool.get(r.tool) ?? 0) + 1);
    if (r.state_code) byState.set(r.state_code, (byState.get(r.state_code) ?? 0) + 1);
    if (r.style_slug) byStyle.set(r.style_slug, (byStyle.get(r.style_slug) ?? 0) + 1);
    if (r.room_type && r.scope) {
      const key = `${r.room_type}|${r.scope}|${r.state_code ?? "-"}`;
      const cur =
        byCombo.get(key) ?? { room: r.room_type, scope: r.scope, state: r.state_code ?? "—", count: 0 };
      cur.count += 1;
      byCombo.set(key, cur);
    }
  }
  const sortDesc = (m: Map<string, number>) =>
    Array.from(m.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);

  return {
    total: rows?.length ?? 0,
    byTool: sortDesc(byTool),
    byState: sortDesc(byState).slice(0, 20),
    byStyle: sortDesc(byStyle).slice(0, 20),
    combos: Array.from(byCombo.values()).sort((a, b) => b.count - a.count).slice(0, 40),
  };
});
