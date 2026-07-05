import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TEXAS_CITIES, SERVICES, CONCERNS } from "@/lib/cities";

const BASE_URL = "https://texas-beauty-glow.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/search", changefreq: "weekly", priority: "0.7" },
          { path: "/match", changefreq: "weekly", priority: "0.7" },
          { path: "/how-it-works", changefreq: "monthly", priority: "0.5" },
          { path: "/for-business", changefreq: "monthly", priority: "0.6" },
          { path: "/safety", changefreq: "monthly", priority: "0.5" },
          { path: "/credentials", changefreq: "monthly", priority: "0.5" },
          { path: "/submit", changefreq: "monthly", priority: "0.5" },
          { path: "/about", changefreq: "monthly", priority: "0.5" },
          { path: "/contact", changefreq: "monthly", priority: "0.4" },
          { path: "/privacy", changefreq: "yearly", priority: "0.2" },
          { path: "/terms", changefreq: "yearly", priority: "0.2" },
          { path: "/compare", changefreq: "monthly", priority: "0.4" },
        ];


        for (const c of TEXAS_CITIES) {
          entries.push({ path: `/tx/${c.slug}`, changefreq: "weekly", priority: "0.8" });
          entries.push({ path: `/best/${c.slug}`, changefreq: "weekly", priority: "0.7" });
        }
        for (const s of SERVICES) entries.push({ path: `/treatment/${s.slug}`, changefreq: "weekly", priority: "0.7" });
        for (const k of CONCERNS) entries.push({ path: `/concern/${k.slug}`, changefreq: "weekly", priority: "0.6" });
        // Treatment × city permutations for local-intent SEO (top 8 services × all cities)
        const topServices = SERVICES.slice(0, 8);
        for (const c of TEXAS_CITIES) {
          for (const s of topServices) {
            entries.push({ path: `/treatment/${s.slug}?city=${c.slug}`, changefreq: "weekly", priority: "0.6" });
          }
        }

        try {
          const { data: providers } = await supabaseAdmin.from("providers").select("slug, updated_at").limit(5000);
          for (const p of providers ?? []) {
            if (!p.slug) continue;
            entries.push({
              path: `/provider/${p.slug}`,
              lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
              changefreq: "weekly", priority: "0.6",
            });
          }
          const { data: brands } = await supabaseAdmin.from("brands").select("slug, updated_at").limit(500);
          for (const b of brands ?? []) {
            if (!b.slug) continue;
            entries.push({ path: `/brand/${b.slug}`, changefreq: "weekly", priority: "0.6" });
          }
        } catch {
          // sitemap still serves static entries if DB fetch fails
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
