import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { urlSet, type SitemapEntry } from "@/lib/sitemap-xml";

export const Route = createFileRoute("/sitemap-blog.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const entries: SitemapEntry[] = [];
        try {
          const { data, error } = await supabaseAdmin
            .from("blog_posts")
            .select("slug, updated_at, published_at")
            .eq("published", true)
            .order("published_at", { ascending: false, nullsFirst: false })
            .limit(5000);
          if (error) throw error;
          for (const p of data ?? []) {
            if (!p.slug) continue;
            const stamp = p.updated_at ?? p.published_at;
            entries.push({
              path: `/blog/${p.slug}`,
              lastmod: stamp ? new Date(stamp).toISOString().slice(0, 10) : undefined,
              changefreq: "monthly",
              priority: "0.5",
            });
          }
        } catch {
          // serve whatever was collected
        }
        return urlSet(entries);
      },
    },
  },
});
