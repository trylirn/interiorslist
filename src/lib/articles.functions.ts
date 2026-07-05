import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Article = { title: string; url: string; scraped_at: string };

async function scrapeOne(website: string): Promise<Article[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not configured");
  const { default: Firecrawl } = await import("@mendable/firecrawl-js");
  const fc = new Firecrawl({ apiKey });

  let links: string[] = [];
  try {
    const mapRes: any = await fc.map(website, { search: "blog article news post guide tips", limit: 30 });
    links = (mapRes?.links ?? mapRes?.data?.links ?? []) as string[];
  } catch {
    return [];
  }

  const articleRe = /\/(blog|article|articles|news|post|posts|guide|guides|tips|resources|learn)\//i;
  const candidates = links
    .filter((u) => typeof u === "string" && articleRe.test(u))
    .filter((u, i, a) => a.indexOf(u) === i)
    .slice(0, 3);

  const now = new Date().toISOString();
  const items: Article[] = [];
  for (const url of candidates) {
    let title = "";
    try {
      const scr: any = await fc.scrape(url, { formats: ["markdown"], onlyMainContent: true });
      title = (scr?.metadata?.title ?? scr?.data?.metadata?.title ?? "").toString().trim();
      if (!title) {
        const md: string = (scr?.markdown ?? scr?.data?.markdown ?? "").toString();
        const m = md.match(/^#\s+(.+)$/m);
        if (m) title = m[1].trim();
      }
    } catch {
      // ignore per-url failure
    }
    if (!title) {
      const slug = url.replace(/\/$/, "").split("/").pop() ?? "";
      title = slug.replace(/[-_]+/g, " ").replace(/\.(html?|php|aspx?)$/i, "").replace(/\b\w/g, (m) => m.toUpperCase()) || "Read article";
    }
    items.push({ title: title.slice(0, 200), url, scraped_at: now });
  }
  return items;
}

export const scrapeProviderArticles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ placeId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    // admin gate
    const { data: role } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!role) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin
      .from("providers")
      .select("place_id, name, website")
      .eq("place_id", data.placeId)
      .maybeSingle();
    if (!p) return { ok: false, articles: [], reason: "not_found" as const };
    if (!p.website) return { ok: false, articles: [], reason: "no_website" as const };

    const articles = await scrapeOne(p.website);
    await supabaseAdmin.from("providers").update({ articles: articles as any }).eq("place_id", p.place_id);
    return { ok: true, articles, reason: null };
  });

export const listProvidersForArticleScrape = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!role) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("providers")
      .select("place_id, name, website, articles")
      .not("website", "is", null)
      .order("name");
    return { providers: data ?? [] };
  });
