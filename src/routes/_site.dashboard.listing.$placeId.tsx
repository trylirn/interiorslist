import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyListing, updateMyListing } from "@/lib/owner.functions";
import { listProviderFaqs, upsertProviderFaq, deleteProviderFaq, getListingMetrics } from "@/lib/brand-extra.functions";
import { SERVICES } from "@/lib/cities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, MessageSquare, Star, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/dashboard/listing/$placeId")({
  head: () => ({ meta: [{ title: "Manage listing | Texas Aesthetics" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ManageListing,
});

function ManageListing() {
  const { placeId } = Route.useParams();
  const { data, isLoading } = useQuery({ queryKey: ["my-listing", placeId], queryFn: () => getMyListing({ data: { placeId } }) });

  if (isLoading) return <div className="mx-auto max-w-3xl px-4 py-16"><p className="text-muted-foreground">Loading…</p></div>;
  if (!data?.listing) return (
    <div className="mx-auto max-w-md py-24 text-center px-4">
      <h1 className="font-display text-3xl">Not found</h1>
      <p className="mt-3 text-muted-foreground">This listing doesn't exist or isn't claimed by you.</p>
      <Button asChild className="mt-6"><Link to="/dashboard">Back to dashboard</Link></Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-brand">← Back to dashboard</Link>
      <h1 className="mt-3 font-display text-4xl">{data.listing.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{data.listing.city}, TX</p>

      <Tabs defaultValue="info" className="mt-8">
        <TabsList>
          <TabsTrigger value="info">Listing info</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-6"><InfoEditor placeId={placeId} listing={data.listing} /></TabsContent>
        <TabsContent value="faqs" className="mt-6"><FaqEditor placeId={placeId} /></TabsContent>
        <TabsContent value="metrics" className="mt-6"><MetricsPanel placeId={placeId} /></TabsContent>
      </Tabs>
    </div>
  );
}

function InfoEditor({ placeId, listing }: { placeId: string; listing: Record<string, unknown> }) {
  const navigate = useNavigate();
  const update = useServerFn(updateMyListing);
  const qc = useQueryClient();
  const [form, setForm] = useState({
    specialists: (listing.specialists as string) ?? "",
    notes: (listing.notes as string) ?? "",
    website: (listing.website as string) ?? "",
    phone: (listing.phone as string) ?? "",
    hero_photo_url: (listing.hero_photo_url as string) ?? "",
    branch_label: (listing.branch_label as string) ?? "",
    email_forward_to: (listing.email_forward_to as string) ?? "",
    services: ((listing.services as string[]) ?? []),
    gallery_urls: ((listing.gallery_urls as string[]) ?? []),
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function toggleService(slug: string) {
    setForm((f) => ({ ...f, services: f.services.includes(slug) ? f.services.filter((s) => s !== slug) : [...f.services, slug] }));
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (form.gallery_urls.length + files.length > 20) {
      toast.error("Maximum 20 photos per listing");
      return;
    }
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image`); continue; }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is over 5 MB`); continue; }
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${placeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("provider-photos").upload(path, file);
      if (error) { toast.error(error.message); continue; }
      const { data: pub } = supabase.storage.from("provider-photos").getPublicUrl(path);
      newUrls.push(pub.publicUrl);
    }
    if (newUrls.length) {
      setForm((f) => ({ ...f, gallery_urls: [...f.gallery_urls, ...newUrls] }));
      toast.success(`${newUrls.length} photo${newUrls.length === 1 ? "" : "s"} uploaded — save to publish`);
    }
    setUploading(false);
  }

  function removePhoto(url: string) {
    setForm((f) => ({ ...f, gallery_urls: f.gallery_urls.filter((u) => u !== url) }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await update({ data: { placeId, ...form } });
      toast.success("Listing updated");
      qc.invalidateQueries({ queryKey: ["my-listing", placeId] });
      navigate({ to: "/dashboard" });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={onSave} className="space-y-5">
      <div className="space-y-1.5"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
      <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div className="space-y-1.5">
        <Label>Forward new leads to this email</Label>
        <Input type="email" value={form.email_forward_to} onChange={(e) => setForm({ ...form, email_forward_to: e.target.value })} placeholder="leads@yourmedspa.com" />
        <p className="text-[11px] text-muted-foreground">Optional. We'll mirror dashboard leads to this address (requires email setup).</p>
      </div>
      <div className="space-y-1.5"><Label>Hero photo URL</Label><Input value={form.hero_photo_url} onChange={(e) => setForm({ ...form, hero_photo_url: e.target.value })} placeholder="https://…" /></div>
      <div className="space-y-1.5"><Label>Branch label</Label><Input value={form.branch_label} onChange={(e) => setForm({ ...form, branch_label: e.target.value })} placeholder="Uptown, North, etc." /></div>
      <div className="space-y-1.5"><Label>Specialists</Label><Textarea rows={3} value={form.specialists} onChange={(e) => setForm({ ...form, specialists: e.target.value })} placeholder="Dr. Jane Doe, MD; Jamie Smith, APRN" /></div>
      <div className="space-y-1.5"><Label>About / notes</Label><Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

      <div className="space-y-2">
        <Label>Photo gallery</Label>
        {form.gallery_urls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {form.gallery_urls.map((url) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removePhoto(url)} className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 transition group-hover:opacity-100" aria-label="Remove">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-6 text-sm hover:border-brand">
          <Upload className="h-4 w-4" />
          <span>{uploading ? "Uploading…" : "Upload photos (up to 20, max 5 MB each)"}</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
        </label>
      </div>

      <div className="space-y-2">
        <Label>Services offered</Label>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => {
            const active = form.services.includes(s.slug);
            return (
              <button type="button" key={s.slug} onClick={() => toggleService(s.slug)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card hover:border-brand"}`}>
                {s.name}
              </button>
            );
          })}
        </div>
      </div>

      <Button type="submit" disabled={saving || uploading} className="w-full h-11">{saving ? "Saving…" : "Save changes"}</Button>
    </form>
  );
}

function FaqEditor({ placeId }: { placeId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["faqs", placeId], queryFn: () => listProviderFaqs({ data: { placeId } }) });
  const upsert = useServerFn(upsertProviderFaq);
  const del = useServerFn(deleteProviderFaq);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");

  async function add() {
    if (q.trim().length < 3 || a.trim().length < 3) return;
    try { await upsert({ data: { placeId, question: q.trim(), answer: a.trim() } }); setQ(""); setA(""); qc.invalidateQueries({ queryKey: ["faqs", placeId] }); toast.success("FAQ added"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  async function remove(id: string) {
    try { await del({ data: { id, placeId } }); qc.invalidateQueries({ queryKey: ["faqs", placeId] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-display text-lg">Add a question</h3>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Question (e.g. Do you offer free consultations?)" maxLength={300} />
        <Textarea value={a} onChange={(e) => setA(e.target.value)} placeholder="Answer" rows={3} maxLength={2000} />
        <Button onClick={add} size="sm">Add FAQ</Button>
      </div>
      <div className="space-y-3">
        {(data?.faqs ?? []).map((f) => (
          <div key={f.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium">{f.question}</p>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{f.answer}</p>
              </div>
              <button onClick={() => remove(f.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {!data?.faqs.length && <p className="text-sm text-muted-foreground">No FAQs yet.</p>}
      </div>
    </div>
  );
}

function MetricsPanel({ placeId }: { placeId: string }) {
  const { data, isLoading } = useQuery({ queryKey: ["listing-metrics", placeId], queryFn: () => getListingMetrics({ data: { placeId } }) });
  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;
  const tiles = [
    { icon: Eye, label: "Profile views (30d)", value: data.views30d },
    { icon: MessageSquare, label: "Leads (30d)", value: data.leads30d },
    { icon: Star, label: "Reviews total", value: data.reviewsTotal },
    { icon: Star, label: "Rating", value: data.rating ?? "—" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-2xl border border-border bg-card p-5">
          <t.icon className="h-5 w-5 text-brand" />
          <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">{t.label}</p>
          <p className="mt-1 font-display text-3xl">{t.value}</p>
        </div>
      ))}
    </div>
  );
}
