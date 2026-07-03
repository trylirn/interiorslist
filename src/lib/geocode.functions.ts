import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

// Geocode a provider's address via the Lovable Google Maps connector and
// cache the result on the providers row. Idempotent: no-op if already set
// or if the provider lacks an address.
export const geocodeProviderIfNeeded = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { data: row } = await supabaseAdmin
      .from("providers")
      .select("place_id, address, city, latitude, longitude")
      .eq("place_id", data.placeId)
      .maybeSingle();
    if (!row) return { ok: false, reason: "not_found" };
    if (row.latitude != null && row.longitude != null) return { ok: true, cached: true };
    if (!row.address) return { ok: false, reason: "no_address" };

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return { ok: false, reason: "missing_credentials" };
    }

    const address = `${row.address}${row.city ? `, ${row.city}, TX` : ""}`;
    const url = `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
      },
    });
    if (!res.ok) return { ok: false, reason: `gateway_${res.status}` };
    const body = (await res.json()) as {
      status: string;
      results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }>;
    };
    const loc = body.results?.[0]?.geometry?.location;
    if (body.status !== "OK" || !loc) return { ok: false, reason: `geocode_${body.status}` };

    await supabaseAdmin
      .from("providers")
      .update({ latitude: loc.lat, longitude: loc.lng })
      .eq("place_id", row.place_id);

    return { ok: true, lat: loc.lat, lng: loc.lng };
  });
