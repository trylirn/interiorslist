export const BASE_URL = "https://interiorslist.lovable.app";

export interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export function xmlResponse(xml: string) {
  return new Response(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
  });
}

export function urlSet(entries: SitemapEntry[]) {
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
  return xmlResponse(
    [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      ...urls,
      `</urlset>`,
    ].join("\n"),
  );
}

export function sitemapIndex(paths: string[]) {
  return xmlResponse(
    [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      ...paths.map((p) => `  <sitemap>\n    <loc>${BASE_URL}${p}</loc>\n  </sitemap>`),
      `</sitemapindex>`,
    ].join("\n"),
  );
}
