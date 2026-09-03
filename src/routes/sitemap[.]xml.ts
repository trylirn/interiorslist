import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { sitemapIndex } from "@/lib/sitemap-xml";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        sitemapIndex([
          "/sitemap-pages.xml",
          "/sitemap-locations.xml",
          "/sitemap-studios.xml",
          "/sitemap-blog.xml",
        ]),
    },
  },
});
