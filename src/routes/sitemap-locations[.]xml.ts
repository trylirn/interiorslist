import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { urlSet, type SitemapEntry } from "@/lib/sitemap-xml";
import { CITIES } from "@/lib/cities";

export const Route = createFileRoute("/sitemap-locations.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const entries: SitemapEntry[] = [];

        try {
          const { data: geo } = await supabaseAdmin
            .from("providers")
            .select("city_slug, state")
            .eq("published", true)
            .limit(5000);
          const seenCity = new Set<string>();
          const seenState = new Set<string>();
          for (const g of geo ?? []) {
            const st = (g.state ?? "").toLowerCase();
            if (st && !seenState.has(st)) {
              seenState.add(st);
              entries.push({ path: `/designers/${st}`, changefreq: "weekly", priority: "0.7" });
            }
            if (g.city_slug && st && !seenCity.has(g.city_slug)) {
              seenCity.add(g.city_slug);
              entries.push({ path: `/designers/${st}/${g.city_slug}`, changefreq: "weekly", priority: "0.8" });
            }
          }
        } catch {
          // fall back to the curated city list below
        }

        for (const c of CITIES) {
          entries.push({ path: `/best/${c.state.toLowerCase()}/${c.slug}`, changefreq: "weekly", priority: "0.7" });
        }

        return urlSet(entries);
      },
    },
  },
});
