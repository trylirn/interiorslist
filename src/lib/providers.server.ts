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
