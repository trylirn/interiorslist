import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAllBlogPosts, upsertBlogPost, deleteBlogPost } from "@/lib/blog.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, Trash2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  category: string | null;
  tags: string[] | null;
  author_name: string | null;
  body_md: string;
  published: boolean;
  published_at: string | null;
};

const EMPTY = {
  id: undefined as string | undefined,
  title: "",
  slug: "",
  excerpt: "",
  cover_url: "",
  category: "",
  tags: "",
  author_name: "",
  body_md: "",
  published: false,
};

export function BlogAdmin() {
  const qc = useQueryClient();
  const list = useServerFn(listAllBlogPosts);
  const save = useServerFn(upsertBlogPost);
  const remove = useServerFn(deleteBlogPost);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-blog"], queryFn: () => list({}) });
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadCover(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("blog-images").upload(path, file);
      if (upErr) throw new Error(upErr.message);
      const { data: signed, error: sErr } = await supabase.storage
        .from("blog-images")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (sErr || !signed) throw new Error(sErr?.message ?? "Could not create image link");
      setForm((f) => (f ? { ...f, cover_url: signed.signedUrl } : f));
      toast.success("Cover uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!form) return;
    if (form.title.trim().length < 2) return toast.error("Add a title");
    if (!form.body_md.trim()) return toast.error("Add the article body");
    setBusy(true);
    try {
      await save({
        data: {
          ...(form.id ? { id: form.id } : {}),
          title: form.title.trim(),
          slug: form.slug.trim() || undefined,
          excerpt: form.excerpt.trim() || undefined,
          cover_url: form.cover_url.trim() || undefined,
          category: form.category.trim() || undefined,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 20),
          author_name: form.author_name.trim() || undefined,
          body_md: form.body_md,
          published: form.published,
        },
      });
      toast.success(form.published ? "Post published" : "Draft saved");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
      qc.invalidateQueries({ queryKey: ["blog-posts"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function destroy(p: Post) {
    if (!confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
    try {
      await remove({ data: { id: p.id } });
      toast.success("Post deleted");
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
      qc.invalidateQueries({ queryKey: ["blog-posts"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (error) return <p className="text-sm text-destructive">You don't have access to the blog editor.</p>;

  if (form) {
    return (
      <div className="max-w-3xl space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl">{form.id ? "Edit post" : "New post"}</h3>
          <Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
        </div>

        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="6 questions to ask before hiring an interior designer" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Slug (optional)</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated from title" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Hiring" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Excerpt</Label>
          <Textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="One or two sentences shown on cards and in search results." />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Author name</Label>
            <Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} placeholder="Intearior Team" />
          </div>
          <div className="space-y-1.5">
            <Label>Tags (comma separated)</Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="hiring, budget, modern" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cover image</Label>
          {form.cover_url && <img src={form.cover_url} alt="" className="h-40 w-full rounded-xl border border-border object-cover" />}
          <div className="flex gap-2">
            <Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://… or upload" />
            <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl border border-dashed border-border px-4 text-sm hover:border-brand">
              <Upload className="h-4 w-4" />{uploading ? "Uploading…" : "Upload"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadCover(e.target.files?.[0])} />
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Body (markdown)</Label>
          <Textarea rows={18} className="font-mono text-sm" value={form.body_md} onChange={(e) => setForm({ ...form, body_md: e.target.value })} placeholder={"## A heading\n\nA paragraph with **bold**, *italic* and [links](https://example.com).\n\n- bullet one\n- bullet two"} />
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border p-4">
          <div>
            <Label>Published</Label>
            <p className="text-[11px] text-muted-foreground">Drafts are hidden from the public blog.</p>
          </div>
          <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
        </div>

        <Button onClick={submit} disabled={busy || uploading} className="h-11 w-full">{busy ? "Saving…" : "Save post"}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl">Blog posts</h3>
        <Button onClick={() => setForm({ ...EMPTY })} className="gap-2"><Plus className="h-4 w-4" /> New post</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (data?.posts ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No posts yet.</p>
      ) : (
        <ul className="space-y-2">
          {(data!.posts as Post[]).map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              {p.cover_url && <img src={p.cover_url} alt="" className="h-12 w-16 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  /blog/{p.slug} · {p.published ? "Published" : "Draft"}{p.category ? ` · ${p.category}` : ""}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  setForm({
                    id: p.id,
                    title: p.title,
                    slug: p.slug,
                    excerpt: p.excerpt ?? "",
                    cover_url: p.cover_url ?? "",
                    category: p.category ?? "",
                    tags: (p.tags ?? []).join(", "),
                    author_name: p.author_name ?? "",
                    body_md: p.body_md ?? "",
                    published: p.published,
                  })
                }
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <button onClick={() => destroy(p)} className="text-muted-foreground hover:text-destructive" aria-label={`Delete ${p.title}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
