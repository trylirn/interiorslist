import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Public projection — never expose author_id or draft rows.
const PUBLIC_COLS =
  "slug, title, excerpt, cover_url, category, tags, author_name, published_at, updated_at";

const ADMIN_COLS =
  "id, slug, title, excerpt, cover_url, category, tags, author_name, body_md, published, published_at, created_at, updated_at";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 90);
}

async function requireAdmin(context: { supabase: any; userId: string }) {
  const [{ data: isAdmin }, { data: isSuper }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
  ]);
  if (!isAdmin && !isSuper) throw new Error("Forbidden");
}

/** Published posts for the public blog index. */
export const listBlogPosts = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({ category: z.string().max(60).optional(), limit: z.number().int().min(1).max(60).optional() })
      .optional()
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("blog_posts").select(PUBLIC_COLS).eq("published", true);
    if (data?.category) q = q.eq("category", data.category);
    const { data: rows, error } = await q
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(data?.limit ?? 30);
    if (error) throw new Error(error.message);
    const posts = rows ?? [];
    const categories = Array.from(new Set(posts.map((p: any) => p.category).filter(Boolean))) as string[];
    return { posts, categories };
  });

/** A single published post plus up to 3 related posts. */
export const getBlogPost = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .select(`${PUBLIC_COLS}, body_md`)
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!post) return { post: null, related: [] };

    const { data: rest } = await supabaseAdmin
      .from("blog_posts")
      .select(PUBLIC_COLS)
      .eq("published", true)
      .neq("slug", data.slug)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(20);

    const tags = new Set(((post as any).tags ?? []) as string[]);
    const scored = (rest ?? [])
      .map((r: any) => ({
        row: r,
        score:
          (r.category && r.category === (post as any).category ? 2 : 0) +
          ((r.tags ?? []) as string[]).filter((t) => tags.has(t)).length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.row);

    return { post, related: scored };
  });

/** Related reading shown at the bottom of a studio profile. */
export const listRelatedPostsForProvider = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        tags: z.array(z.string().max(80)).max(20).optional(),
        limit: z.number().int().min(1).max(6).optional(),
      })
      .optional()
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("blog_posts")
      .select(PUBLIC_COLS)
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(24);
    const wanted = new Set((data?.tags ?? []).map((t) => t.toLowerCase()));
    const scored = (rows ?? [])
      .map((r: any) => ({
        row: r,
        score:
          ((r.tags ?? []) as string[]).filter((t) => wanted.has(String(t).toLowerCase())).length +
          (r.category && wanted.has(String(r.category).toLowerCase()) ? 1 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, data?.limit ?? 3)
      .map((s) => s.row);
    return { posts: scored };
  });

/* -------------------------------------------------------------- admin --- */

export const listAllBlogPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as never);
    const { data, error } = await context.supabase
      .from("blog_posts")
      .select(ADMIN_COLS)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { posts: data ?? [] };
  });

export const upsertBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().min(2).max(200),
        slug: z.string().max(120).optional(),
        excerpt: z.string().max(500).optional(),
        cover_url: z.string().max(2000).optional(),
        category: z.string().max(60).optional(),
        tags: z.array(z.string().min(1).max(60)).max(20).optional(),
        author_name: z.string().max(120).optional(),
        body_md: z.string().max(120000),
        published: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const slug = slugify(data.slug || data.title);
    if (!slug) throw new Error("Invalid slug");
    const row = {
      slug,
      title: data.title,
      excerpt: data.excerpt ?? null,
      cover_url: data.cover_url || null,
      category: data.category || null,
      tags: data.tags ?? [],
      author_name: data.author_name || null,
      author_id: context.userId,
      body_md: data.body_md,
      published: data.published,
      published_at: data.published ? new Date().toISOString() : null,
    };

    if (data.id) {
      const { published_at, ...patch } = row;
      const { data: existing } = await context.supabase
        .from("blog_posts")
        .select("published, published_at")
        .eq("id", data.id)
        .maybeSingle();
      const keepDate =
        existing?.published && data.published ? existing.published_at : data.published ? new Date().toISOString() : null;
      const { error } = await context.supabase
        .from("blog_posts")
        .update({ ...patch, published_at: keepDate })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, slug };
    }

    const { error } = await context.supabase.from("blog_posts").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true, slug };
  });

export const deleteBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const { error } = await context.supabase.from("blog_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
