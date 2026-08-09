import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) return null;
  const url = `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(address)}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
      },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      status: string;
      results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }>;
    };
    const loc = body.results?.[0]?.geometry?.location;
    if (body.status !== "OK" || !loc) return null;
    return loc;
  } catch {
    return null;
  }
}

/**
 * Best-effort geocode for a single provider. Safe to call from server code
 * paths where the caller does not want to await success.
 */
export async function ensureProviderCoords(placeId: string): Promise<{ lat: number; lng: number } | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("providers")
    .select("place_id, address, city, latitude, longitude")
    .eq("place_id", placeId)
    .maybeSingle();
  if (!row) return null;
  if (row.latitude != null && row.longitude != null) {
    return { lat: row.latitude as number, lng: row.longitude as number };
  }
  if (!row.address) return null;
  const loc = await geocodeAddress(row.address as string);
  if (!loc) return null;
  await supabaseAdmin
    .from("providers")
    .update({ latitude: loc.lat, longitude: loc.lng })
    .eq("place_id", row.place_id);
  return loc;
}

export const geocodeProviderIfNeeded = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const loc = await ensureProviderCoords(data.placeId);
    if (!loc) return { ok: false as const };
    return { ok: true as const, lat: loc.lat, lng: loc.lng };
  });

/**
 * Admin-only: geocode providers that are missing coordinates. Throttled and
 * stops early after repeated errors.
 */
export const geocodeAllMissing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ limit: z.number().int().min(1).max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: role } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!role) throw new Error("Forbidden");

    const { data: rows } = await supabaseAdmin
      .from("providers")
      .select("place_id, address, city")
      .is("latitude", null)
      .not("address", "is", null)
      .limit(data.limit ?? 200);

    let ok = 0;
    let failed = 0;
    let consecutiveErrors = 0;
    for (const row of rows ?? []) {
      const loc = await geocodeAddress(row.address as string);
      if (loc) {
        await supabaseAdmin
          .from("providers")
          .update({ latitude: loc.lat, longitude: loc.lng })
          .eq("place_id", row.place_id);
        ok += 1;
        consecutiveErrors = 0;
      } else {
        failed += 1;
        consecutiveErrors += 1;
        if (consecutiveErrors >= 5) break;
      }
      // ~5 rps throttle
      await new Promise((r) => setTimeout(r, 220));
    }
    return { ok, failed, total: (rows ?? []).length };
  });

export const countMissingCoords = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: role } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!role) throw new Error("Forbidden");
    const { count } = await supabaseAdmin
      .from("providers")
      .select("place_id", { count: "exact", head: true })
      .is("latitude", null)
      .not("address", "is", null);
    return { missing: count ?? 0 };
  });
