import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callerIsAdmin } from "@/lib/caller-role";
import { fail } from "@/lib/errors";

type Candidate = { text: string; author: string | null };

function decode(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&apos;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&[a-z]+;/gi, " ");
}

function strip(html: string): string {
  return decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/** Pull likely testimonial blocks out of a page's HTML. Best-effort, never throws on odd markup. */
function extractCandidates(html: string): Candidate[] {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");

  const found: Candidate[] = [];
  const push = (text: string, author: string | null) => {
    const t = text.trim().replace(/^["“”']+|["“”']+$/g, "").trim();
    if (t.length < 40 || t.length > 1200) return;
    if (found.some((f) => f.text === t)) return;
    found.push({ text: t, author: author && author.length <= 80 ? author : null });
  };

  // <blockquote> ... </blockquote> with optional <cite> / <figcaption>
  for (const m of body.matchAll(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi)) {
    const inner = m[1] ?? "";
    const cite = inner.match(/<(?:cite|figcaption)[^>]*>([\s\S]*?)<\/(?:cite|figcaption)>/i);
    push(strip(inner.replace(/<(?:cite|figcaption)[\s\S]*?<\/(?:cite|figcaption)>/gi, " ")), cite ? strip(cite[1] ?? "") : null);
  }

  // Elements whose class/id mentions testimonial or review
  for (const m of body.matchAll(
    /<(div|section|article|li|p)[^>]*(?:class|id)="[^"]*(testimonial|review|quote)[^"]*"[^>]*>([\s\S]{0,2000}?)<\/\1>/gi,
  )) {
    push(strip(m[3] ?? ""), null);
  }

  // Curly-quoted sentences anywhere on the page
  if (found.length === 0) {
    for (const m of strip(body).matchAll(/[“"]([^“”"]{60,600})[”"]/g)) push(m[1] ?? "", null);
  }

  return found.slice(0, 20);
}

export const fetchWebsiteReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ placeId: z.string().min(1).max(200), url: z.string().url().max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const admin = await callerIsAdmin(supabase as never, userId);
    const { data: owned } = await supabase
      .from("providers")
      .select("place_id, claimed_by")
      .eq("place_id", data.placeId)
      .maybeSingle();
    if (!owned) throw new Error("Studio not found");
    if (!admin && owned.claimed_by !== userId) throw new Error("You do not manage this studio");

    const { enforceRateLimit } = await import("@/lib/rate-limit.server");
    await enforceRateLimit(`website-reviews:${data.placeId}`, { max: 10, windowMinutes: 60 });

    const target = new URL(data.url);
    if (target.protocol !== "https:" && target.protocol !== "http:") throw new Error("Please use a normal web address.");

    let html = "";
    try {
      const res = await fetch(target.toString(), {
        headers: { "User-Agent": "IntearriorBot/1.0 (+https://intearior.com)", Accept: "text/html" },
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      html = (await res.text()).slice(0, 1_500_000);
    } catch (e) {
      console.error("website review fetch failed", e);
      throw new Error("We couldn't open that page. Check the address and that the page is public.");
    }

    const candidates = extractCandidates(html);
    if (!candidates.length) {
      throw new Error("We couldn't find any testimonials on that page. Try the exact page where your reviews are shown.");
    }
    return { candidates, source: target.toString() };
  });

export const saveWebsiteReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        placeId: z.string().min(1).max(200),
        sourceUrl: z.string().url().max(500),
        reviews: z
          .array(z.object({ text: z.string().min(20).max(2000), author: z.string().max(120).nullable() }))
          .min(1)
          .max(20),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const admin = await callerIsAdmin(supabase as never, userId);
    const { data: owned } = await supabase
      .from("providers")
      .select("place_id, claimed_by")
      .eq("place_id", data.placeId)
      .maybeSingle();
    if (!owned) throw new Error("Studio not found");
    if (!admin && owned.claimed_by !== userId) throw new Error("You do not manage this studio");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let saved = 0;
    for (const r of data.reviews) {
      const externalId = `${new URL(data.sourceUrl).hostname}-${r.text.slice(0, 60)}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 200);
      const { error } = await supabaseAdmin.from("reviews").upsert(
        {
          provider_place_id: data.placeId,
          source: "website",
          external_id: externalId,
          author_name: r.author ?? "Studio client",
          text: r.text,
          relative_time: null,
          published_at: new Date().toISOString(),
        },
        { onConflict: "provider_place_id,source,external_id" },
      );
      if (error) fail(error);
      saved += 1;
    }
    return { saved };
  });
