import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BodySchema = z.object({
  tool: z.enum(["budget-estimator", "room-planner", "color-palette"]),
  room_type: z.string().max(60).optional(),
  scope: z.string().max(60).optional(),
  state_code: z.string().max(2).optional(),
  style_slug: z.string().max(60).optional(),
  budget_band: z.string().max(60).optional(),
});

const BOT_UA =
  /bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|lighthouse|pingdom|monitor|scrape|curl|wget|python-requests|axios|node-fetch/i;
const INTERNAL_HOST = /(lovableproject\.com|lovable\.dev|^https?:\/\/localhost|id-preview--|-dev\.lovable\.app)/i;

export const Route = createFileRoute("/api/public/tool-usage")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const ua = request.headers.get("user-agent") ?? "";
          if (!ua || BOT_UA.test(ua)) return new Response(null, { status: 204 });
          const origin = request.headers.get("origin") ?? "";
          const referer = request.headers.get("referer") ?? "";
          if (INTERNAL_HOST.test(origin) || INTERNAL_HOST.test(referer))
            return new Response(null, { status: 204 });

          let body: unknown;
          try {
            body = await request.json();
          } catch {
            return new Response("bad json", { status: 400 });
          }
          const parsed = BodySchema.safeParse(body);
          if (!parsed.success) return new Response("invalid", { status: 400 });

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await (supabaseAdmin as unknown as {
            from: (t: string) => { insert: (rows: unknown) => Promise<unknown> };
          })
            .from("tool_usage")
            .insert({
              tool: parsed.data.tool,
              room_type: parsed.data.room_type ?? null,
              scope: parsed.data.scope ?? null,
              state_code: parsed.data.state_code ?? null,
              style_slug: parsed.data.style_slug ?? null,
              budget_band: parsed.data.budget_band ?? null,
            });

          return new Response(null, { status: 204 });
        } catch (err) {
          console.error("[api/public/tool-usage] failed", err);
          return new Response(null, { status: 204 });
        }
      },
    },
  },
});
