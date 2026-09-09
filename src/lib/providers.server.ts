import { fail } from "@/lib/errors";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Fetch every published row for the given columns, paging past PostgREST's
 * 1000-row cap. Used by aggregate counts (states, cities) so totals match search.
 */
export async function fetchAllPublished<T = Record<string, unknown>>(
  columns: string,
  filter?: (q: any) => any,
): Promise<T[]> {
  const pageSize = 1000;
  const out: T[] = [];
  for (let from = 0; from < 20000; from += pageSize) {
    let q = supabaseAdmin.from("providers").select(columns).eq("published", true);
    if (filter) q = filter(q);
    const { data, error } = await q.range(from, from + pageSize - 1);
    if (error) fail(error);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < pageSize) break;
  }
  return out;
}

/**
 * In-process TTL cache for the directory-wide aggregate scans (city/state
 * counts, totals). These run on nearly every page render and were the top
 * database load; the underlying data changes rarely.
 */
const aggregateCache = new Map<string, { at: number; value: unknown }>();
const AGGREGATE_TTL_MS = 10 * 60_000;

export async function cachedAggregate<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = aggregateCache.get(key);
  if (hit && Date.now() - hit.at < AGGREGATE_TTL_MS) return hit.value as T;
  const value = await load();
  aggregateCache.set(key, { at: Date.now(), value });
  return value;
}
