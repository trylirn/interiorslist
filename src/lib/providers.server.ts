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
 * Tiny in-memory TTL cache for aggregate reads (city/state counts, directory
 * totals). These are identical for every visitor and only change when the
 * directory is edited, so re-running full scans on every page view is pure
 * database cost. Worker memory is per-instance and short lived — that is fine,
 * a miss simply falls through to the query.
 */
const memo = new Map<string, { at: number; value: unknown }>();
const DEFAULT_TTL_MS = 10 * 60 * 1000;

export async function cachedAggregate<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const hit = memo.get(key);
  const now = Date.now();
  if (hit && now - hit.at < ttlMs) return hit.value as T;
  const value = await loader();
  memo.set(key, { at: now, value });
  return value;
}
