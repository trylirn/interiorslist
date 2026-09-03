import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { urlSet, type SitemapEntry } from "@/lib/sitemap-xml";

export const Route = createFileRoute("/sitemap-studios.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const entries: SitemapEntry[] = [];
        const pageSize = 1000;
        try {
          for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await supabaseAdmin
              .from("providers")
              .select("slug, updated_at")
              .eq("published", true)
              .order("slug")
              .range(offset, offset + pageSize - 1);
            if (error) throw error;
            for (const p of data ?? []) {
              if (!p.slug) continue;
              entries.push({
                path: `/provider/${p.slug}`,
                lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
                changefreq: "weekly",
                priority: "0.6",
              });
            }
            if (!data || data.length < pageSize) break;
          }
        } catch {
          // serve whatever was collected
        }
        return urlSet(entries);
      },
    },
  },
});
