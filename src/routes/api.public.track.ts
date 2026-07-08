import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const EventSchema = z.object({
  event_type: z.enum(["page_view", "search", "impression", "listing_click", "lead_action"]),
  lead_type: z.enum(["phone", "website", "directions"]).optional(),
  provider_place_id: z.string().max(200).optional(),
  city_slug: z.string().max(80).optional(),
  query: z.string().max(200).optional(),
  path: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const BodySchema = z.object({
  visitor_id: z.string().uuid(),
  session_id: z.string().uuid(),
  session_new: z.boolean().optional(),
  entry_path: z.string().max(500).optional(),
  entry_method: z.enum(["direct", "search", "browse"]).optional(),
  referrer: z.string().max(500).optional(),
  user_agent: z.string().max(500).optional(),
  is_mobile: z.boolean().optional(),
  events: z.array(EventSchema).max(50),
});

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          let body: unknown;
          try {
            body = await request.json();
          } catch {
            return new Response("bad json", { status: 400 });
          }
          const parsed = BodySchema.safeParse(body);
          if (!parsed.success) return new Response("invalid", { status: 400 });
          const b = parsed.data;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          // Cast: table types are regenerated after schema pushes.
          const admin = supabaseAdmin as unknown as {
            from: (t: string) => {
              upsert: (row: unknown, opts?: { onConflict?: string }) => Promise<unknown>;
              update: (row: unknown) => { eq: (k: string, v: string) => { is: (k: string, v: null) => Promise<unknown> } };
              insert: (rows: unknown) => Promise<unknown>;
            };
          };

          const sessionRow: Record<string, unknown> = {
            id: b.session_id,
            visitor_id: b.visitor_id,
            last_seen_at: new Date().toISOString(),
            is_mobile: !!b.is_mobile,
          };
          if (b.session_new) {
            sessionRow.started_at = new Date().toISOString();
            sessionRow.entry_path = b.entry_path ?? null;
            sessionRow.entry_method = b.entry_method ?? "direct";
            sessionRow.referrer = b.referrer ?? null;
            sessionRow.user_agent = b.user_agent ?? null;
          }
          await admin.from("analytics_sessions").upsert(sessionRow, { onConflict: "id" });

          const firstCity = b.events.find((e) => e.city_slug)?.city_slug;
          if (firstCity) {
            await admin
              .from("analytics_sessions")
              .update({ city_slug: firstCity })
              .eq("id", b.session_id)
              .is("city_slug", null);
          }

          if (b.events.length > 0) {
            const rows = b.events.map((e) => ({
              session_id: b.session_id,
              visitor_id: b.visitor_id,
              event_type: e.event_type,
              lead_type: e.lead_type ?? null,
              provider_place_id: e.provider_place_id ?? null,
              city_slug: e.city_slug ?? null,
              query: e.query ?? null,
              path: e.path ?? null,
              metadata: e.metadata ?? null,
            }));
            await admin.from("analytics_events").insert(rows);
          }

          return new Response("ok", { status: 204 });
        } catch (err) {
          console.error("[api/public/track] failed", err);
          // Tracking is fire-and-forget; never surface a 500 that could break navigation.
          return new Response(JSON.stringify({ error: "TRACKING_FAILED", fallback: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
