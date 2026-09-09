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
  return decode(
    html
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

const BLOCK_CLASS = /(testimonial|tmls|review|quote|feedback|praise|kudos)/i;
const AUTHOR_CLASS = /(name|author|cite|client|byline|customer)/i;
const NOISE_CLASS = /(rating|stars|arrow|image|avatar|photo|icon|position|date|meta)/i;

/** Find the inner HTML of the element whose opening tag starts at `start`, honouring nesting. */
function innerHtml(html: string, tag: string, start: number): { inner: string; end: number } | null {
  const open = html.indexOf(">", start);
  if (open === -1) return null;
  if (html[open - 1] === "/") return { inner: "", end: open + 1 };
  const re = new RegExp(`<(/?)${tag}\\b`, "gi");
  re.lastIndex = open + 1;
  let depth = 1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) {
      const close = html.indexOf(">", m.index);
      return { inner: html.slice(open + 1, m.index), end: close === -1 ? m.index : close + 1 };
    }
    if (m.index - open > 200_000) break;
  }
  return null;
}

/** Pull likely testimonial blocks out of a page's HTML. Best-effort, never throws on odd markup. */
function extractCandidates(html: string): Candidate[] {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(nav|header|footer|form|svg)[\s\S]*?<\/\1>/gi, " ");

  const found: Candidate[] = [];
  const push = (text: string, author: string | null) => {
    const t = text.trim().replace(/^["“”']+|["“”']+$/g, "").trim();
    if (t.length < 40 || t.length > 2000) return;
    if (found.some((f) => f.text === t)) return;
    const a = author ? author.replace(/\s+/g, " ").trim() : null;
    found.push({ text: t, author: a && a.length >= 2 && a.length <= 80 ? a : null });
  };

  const fromBlock = (inner: string) => {
    // Prefer a dedicated text child if the block has one; otherwise use the whole block
    // minus author/rating chrome.
    let textPart = inner;
    const textChild = inner.match(
      /<(div|p|span|blockquote)[^>]*(?:class|id)=["'][^"']*(?:text|content|body|message|quote|desc)[^"']*["'][^>]*>/i,
    );
    if (textChild?.index !== undefined) {
      const got = innerHtml(inner, textChild[1] ?? "div", textChild.index);
      if (got && strip(got.inner).length >= 40) textPart = got.inner;
    }

    let author: string | null = null;
    for (const am of inner.matchAll(
      /<(div|span|p|cite|h[1-6]|figcaption|strong|b)[^>]*(?:class|id)=["']([^"']*)["'][^>]*>([\s\S]{0,300}?)<\/\1>/gi,
    )) {
      const cls = am[2] ?? "";
      if (!AUTHOR_CLASS.test(cls) || NOISE_CLASS.test(cls)) continue;
      const val = strip(am[3] ?? "");
      if (val && val.length <= 80) {
        author = val;
        break;
      }
    }
    if (!author) {
      const cite = inner.match(/<(?:cite|figcaption)[^>]*>([\s\S]{0,200}?)<\/(?:cite|figcaption)>/i);
      if (cite) author = strip(cite[1] ?? "") || null;
    }

    // Remove author/rating chrome from the text if we used the whole block.
    if (textPart === inner) {
      textPart = textPart.replace(
        /<(div|span|p|cite|figcaption)[^>]*(?:class|id)=["'][^"']*(?:name|author|cite|rating|stars|position|date)[^"']*["'][^>]*>[\s\S]{0,300}?<\/\1>/gi,
        " ",
      );
    }
    push(strip(textPart), author);
  };

  // Blocks whose class/id hints at a testimonial, walked with nesting awareness.
  const openTag = /<(div|section|article|li|figure|blockquote)\b[^>]*?(?:class|id)=["']([^"']*)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = openTag.exec(body))) {
    const cls = m[2] ?? "";
    if (!BLOCK_CLASS.test(cls)) continue;
    const got = innerHtml(body, m[1] ?? "div", m.index);
    if (!got) continue;
    fromBlock(got.inner);
  }

  // Plain blockquotes anywhere.
  for (const bq of body.matchAll(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi)) fromBlock(bq[1] ?? "");

  // Curly-quoted sentences anywhere on the page.
  if (found.length === 0) {
    for (const q of strip(body).matchAll(/[“"]([^“”"]{60,600})[”"]/g)) push(q[1] ?? "", null);
  }

  // Long paragraphs as a last resort.
  if (found.length === 0) {
    for (const p of body.matchAll(/<p[^>]*>([\s\S]{80,1500}?)<\/p>/gi)) push(strip(p[1] ?? ""), null);
  }

  // Drop wrapper blocks that simply contain other candidates' text.
  const leaves = found.filter((f) => !found.some((o) => o !== f && f.text.includes(o.text)));
  return (leaves.length ? leaves : found).slice(0, 30);

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
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 IntearriorBot/1.0 (+https://intearior.com)",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },

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
