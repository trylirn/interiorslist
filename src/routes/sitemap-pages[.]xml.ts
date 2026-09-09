import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { urlSet, type SitemapEntry } from "@/lib/sitemap-xml";
import { SERVICES, STYLES } from "@/lib/cities";
import { COST_TOPICS } from "@/lib/cost-content";
import { US_STATES } from "@/lib/cost-model";

export const Route = createFileRoute("/sitemap-pages.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/search", changefreq: "weekly", priority: "0.7" },
          { path: "/match", changefreq: "weekly", priority: "0.7" },
          { path: "/how-it-works", changefreq: "monthly", priority: "0.5" },
          { path: "/faq", changefreq: "monthly", priority: "0.6" },
          { path: "/for-business", changefreq: "monthly", priority: "0.6" },
          { path: "/submit", changefreq: "monthly", priority: "0.5" },
          { path: "/contact", changefreq: "monthly", priority: "0.4" },
          { path: "/privacy", changefreq: "yearly", priority: "0.2" },
          { path: "/terms", changefreq: "yearly", priority: "0.2" },
          { path: "/compare", changefreq: "monthly", priority: "0.4" },
          { path: "/blog", changefreq: "weekly", priority: "0.7" },
          { path: "/review", changefreq: "monthly", priority: "0.4" },
        ];
        for (const s of SERVICES) entries.push({ path: `/service/${s.slug}`, changefreq: "weekly", priority: "0.7" });
        for (const k of STYLES) entries.push({ path: `/style/${k.slug}`, changefreq: "weekly", priority: "0.6" });
        entries.push(
          { path: "/tools", changefreq: "monthly", priority: "0.7" },
          { path: "/tools/budget-estimator", changefreq: "monthly", priority: "0.8" },
          { path: "/tools/color-palette", changefreq: "monthly", priority: "0.6" },
          { path: "/cost-estimator", changefreq: "weekly", priority: "0.8" },
        );
        for (const t of COST_TOPICS) entries.push({ path: `/cost-estimator/${t.slug}`, changefreq: "monthly", priority: "0.7" });
        for (const s of US_STATES) entries.push({ path: `/cost-estimator/state/${s.slug}`, changefreq: "monthly", priority: "0.6" });
        return urlSet(entries);
      },
    },
  },
});
