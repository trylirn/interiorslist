import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { Eye, MessageSquare, Star, Trash2, Upload, X, Video, FileText, Award } from "lucide-react";
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
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="info">About & info</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="docs">Certificates & files</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-6"><InfoEditor placeId={placeId} listing={data.listing} /></TabsContent>
        <TabsContent value="media" className="mt-6"><MediaEditor placeId={placeId} listing={data.listing} /></TabsContent>
        <TabsContent value="docs" className="mt-6"><DocsEditor placeId={placeId} listing={data.listing} /></TabsContent>
        <TabsContent value="faqs" className="mt-6"><FaqEditor placeId={placeId} /></TabsContent>
        <TabsContent value="metrics" className="mt-6"><MetricsPanel placeId={placeId} /></TabsContent>
      </Tabs>
    </div>
  );
}

type Listing = Record<string, unknown>;

function InfoEditor({ placeId, listing }: { placeId: string; listing: Listing }) {
  const navigate = useNavigate();
  const update = useServerFn(updateMyListing);
  const qc = useQueryClient();
  const existingSocial = (listing.social_links as Record<string, string> | null) ?? {};
  const [form, setForm] = useState({
    about_description: (listing.about_description as string) ?? "",
    specialists: (listing.specialists as string) ?? "",
    notes: (listing.notes as string) ?? "",
    website: (listing.website as string) ?? "",
    phone: (listing.phone as string) ?? "",
    branch_label: (listing.branch_label as string) ?? "",
    email_forward_to: (listing.email_forward_to as string) ?? "",
    services: ((listing.services as string[]) ?? []),
    credentials: (listing.credentials as string) ?? "",
    founded_year: listing.founded_year != null ? String(listing.founded_year) : "",
    years_in_business: listing.years_in_business != null ? String(listing.years_in_business) : "",
    service_area: (listing.service_area as string) ?? "",
    service_area_note: (listing.service_area_note as string) ?? "",
    team_size: (listing.team_size as string) ?? "",
    client_types: (listing.client_types as string) ?? "",
    not_a_fit: (listing.not_a_fit as string) ?? "",
    social_instagram: existingSocial.instagram ?? "",
    social_facebook: existingSocial.facebook ?? "",
    social_tiktok: existingSocial.tiktok ?? "",
    social_youtube: existingSocial.youtube ?? "",
    social_linkedin: existingSocial.linkedin ?? "",
    social_x: existingSocial.x ?? "",
  });
  const [packages, setPackages] = useState<{ name: string; price: string; note: string }[]>(
    Array.isArray(listing.price_ranges)
      ? (listing.price_ranges as any[]).map((p) => ({ name: String(p?.name ?? ""), price: String(p?.price ?? ""), note: String(p?.note ?? "") }))
      : [],
  );
  const [saving, setSaving] = useState(false);

  function toggleService(slug: string) {
    setForm((f) => ({ ...f, services: f.services.includes(slug) ? f.services.filter((s) => s !== slug) : [...f.services, slug] }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const social: Record<string, string> = {};
      if (form.social_instagram) social.instagram = form.social_instagram;
      if (form.social_facebook) social.facebook = form.social_facebook;
      if (form.social_tiktok) social.tiktok = form.social_tiktok;
      if (form.social_youtube) social.youtube = form.social_youtube;
      if (form.social_linkedin) social.linkedin = form.social_linkedin;
      if (form.social_x) social.x = form.social_x;
      const {
        social_instagram, social_facebook, social_tiktok, social_youtube, social_linkedin, social_x,
        founded_year, years_in_business, service_area, ...rest
      } = form;
      await update({
        data: {
          placeId,
          ...rest,
          social_links: social,
          founded_year: founded_year ? Number(founded_year) : null,
          years_in_business: years_in_business ? Number(years_in_business) : null,
          service_area: (service_area || null) as "local" | "regional" | "nationwide" | null,
          price_ranges: packages.filter((p) => p.name.trim()).map((p) => ({ name: p.name.trim(), price: p.price.trim(), note: p.note.trim() })),
        },
      });
      toast.success("Listing updated");
      qc.invalidateQueries({ queryKey: ["my-listing", placeId] });
      navigate({ to: "/dashboard" });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to save"); }

    finally { setSaving(false); }
  }

  return (
    <form onSubmit={onSave} className="space-y-5">
      <div className="space-y-1.5">
        <Label>About</Label>
        <Textarea rows={5} value={form.about_description} onChange={(e) => setForm({ ...form, about_description: e.target.value })} placeholder="Tell visitors who you are, your philosophy, and what makes you different…" maxLength={4000} />
        <p className="text-[11px] text-muted-foreground">Shown publicly on your profile under "About".</p>
      </div>
      <div className="space-y-1.5"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
      <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div className="space-y-1.5">
        <Label>Forward new leads to this email</Label>
        <Input type="email" value={form.email_forward_to} onChange={(e) => setForm({ ...form, email_forward_to: e.target.value })} placeholder="leads@yourmedspa.com" />
        <p className="text-[11px] text-muted-foreground">Optional. We'll mirror dashboard leads to this address (requires email setup).</p>
      </div>
      <div className="space-y-1.5"><Label>Branch label</Label><Input value={form.branch_label} onChange={(e) => setForm({ ...form, branch_label: e.target.value })} placeholder="Uptown, North, etc." /></div>
      <div className="space-y-1.5"><Label>Practitioners</Label><Textarea rows={3} value={form.specialists} onChange={(e) => setForm({ ...form, specialists: e.target.value })} placeholder="Dr. Jane Doe, MD; Jamie Smith, APRN" /></div>
      <div className="space-y-1.5"><Label>Internal notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Operational notes — not displayed publicly" /></div>

      <div className="space-y-3 rounded-2xl border border-border p-4">
        <p className="font-display text-lg">Business details</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Year founded</Label><Input inputMode="numeric" value={form.founded_year} onChange={(e) => setForm({ ...form, founded_year: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="2015" /></div>
          <div className="space-y-1.5"><Label>Years in business</Label><Input inputMode="numeric" value={form.years_in_business} onChange={(e) => setForm({ ...form, years_in_business: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="10" /></div>
          <div className="space-y-1.5"><Label>Team size</Label><Input value={form.team_size} onChange={(e) => setForm({ ...form, team_size: e.target.value })} placeholder="e.g. 5–10 staff" maxLength={60} /></div>
          <div className="space-y-1.5">
            <Label>Serves clients</Label>
            <Select value={form.service_area || undefined} onValueChange={(v) => setForm({ ...form, service_area: v })}>
              <SelectTrigger><SelectValue placeholder="Select service area" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local area</SelectItem>
                <SelectItem value="regional">Regional</SelectItem>
                <SelectItem value="nationwide">Nationwide</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5"><Label>Service area note</Label><Input value={form.service_area_note} onChange={(e) => setForm({ ...form, service_area_note: e.target.value })} placeholder="Serving Dallas–Fort Worth and North Texas" maxLength={500} /></div>
        <div className="space-y-1.5"><Label>Credentials &amp; licenses</Label><Textarea rows={3} value={form.credentials} onChange={(e) => setForm({ ...form, credentials: e.target.value })} placeholder="Board-certified dermatologist, TX RN license #…" maxLength={2000} /></div>
        <div className="space-y-1.5"><Label>Types of clients served</Label><Textarea rows={3} value={form.client_types} onChange={(e) => setForm({ ...form, client_types: e.target.value })} placeholder="First-time injectable patients, brides, post-partum skin care…" maxLength={2000} /></div>
        <div className="space-y-1.5">
          <Label>Not a good fit if…</Label>
          <Textarea rows={3} value={form.not_a_fit} onChange={(e) => setForm({ ...form, not_a_fit: e.target.value })} placeholder="We're not the right fit if you're looking for surgical procedures or same-day walk-ins." maxLength={2000} />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg">Pricing &amp; packages</p>
          <Button type="button" size="sm" variant="outline" onClick={() => setPackages((ps) => (ps.length >= 20 ? ps : [...ps, { name: "", price: "", note: "" }]))}>Add package</Button>
        </div>
        {packages.length === 0 && <p className="text-sm text-muted-foreground">No packages yet.</p>}
        {packages.map((pkg, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_140px_1fr_auto]">
            <Input value={pkg.name} onChange={(e) => setPackages((ps) => ps.map((p, j) => (j === i ? { ...p, name: e.target.value } : p)))} placeholder="Package name" maxLength={120} />
            <Input value={pkg.price} onChange={(e) => setPackages((ps) => ps.map((p, j) => (j === i ? { ...p, price: e.target.value } : p)))} placeholder="$350" maxLength={80} />
            <Input value={pkg.note} onChange={(e) => setPackages((ps) => ps.map((p, j) => (j === i ? { ...p, note: e.target.value } : p)))} placeholder="What's included" maxLength={300} />
            <Button type="button" variant="ghost" size="icon" aria-label="Remove package" onClick={() => setPackages((ps) => ps.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Social media links</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input value={form.social_instagram} onChange={(e) => setForm({ ...form, social_instagram: e.target.value })} placeholder="Instagram URL" />
          <Input value={form.social_facebook} onChange={(e) => setForm({ ...form, social_facebook: e.target.value })} placeholder="Facebook URL" />
          <Input value={form.social_tiktok} onChange={(e) => setForm({ ...form, social_tiktok: e.target.value })} placeholder="TikTok URL" />
          <Input value={form.social_youtube} onChange={(e) => setForm({ ...form, social_youtube: e.target.value })} placeholder="YouTube URL" />
          <Input value={form.social_linkedin} onChange={(e) => setForm({ ...form, social_linkedin: e.target.value })} placeholder="LinkedIn URL" />
          <Input value={form.social_x} onChange={(e) => setForm({ ...form, social_x: e.target.value })} placeholder="X (Twitter) URL" />
        </div>
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

      <Button type="submit" disabled={saving} className="w-full h-11">{saving ? "Saving…" : "Save changes"}</Button>
    </form>
  );
}

function MediaEditor({ placeId, listing }: { placeId: string; listing: Listing }) {
  const qc = useQueryClient();
  const update = useServerFn(updateMyListing);
  const [photos, setPhotos] = useState<string[]>((listing.gallery_urls as string[]) ?? []);
  const [hero, setHero] = useState((listing.hero_photo_url as string) ?? "");
  const [videos, setVideos] = useState<string[]>((listing.video_urls as string[]) ?? []);
  const [newVideo, setNewVideo] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function uploadPhotos(files: FileList | null) {
    if (!files || !files.length) return;
    if (photos.length + files.length > 20) return toast.error("Maximum 20 photos");
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} not an image`); continue; }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} over 5MB`); continue; }
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${placeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("provider-photos").upload(path, file);
      if (error) { toast.error(error.message); continue; }
      const { data: pub } = supabase.storage.from("provider-photos").getPublicUrl(path);
      newUrls.push(pub.publicUrl);
    }
    if (newUrls.length) setPhotos((p) => [...p, ...newUrls]);
    setUploading(false);
  }

  function addVideo() {
    const v = newVideo.trim();
    if (!v) return;
    if (videos.length >= 10) return toast.error("Maximum 10 videos");
    setVideos((vs) => [...vs, v]);
    setNewVideo("");
  }

  async function save() {
    setSaving(true);
    try {
      await update({ data: { placeId, gallery_urls: photos, video_urls: videos, hero_photo_url: hero } });
      toast.success("Media saved");
      qc.invalidateQueries({ queryKey: ["my-listing", placeId] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5"><Label>Hero photo URL</Label><Input value={hero} onChange={(e) => setHero(e.target.value)} placeholder="https://…" /></div>

      <div className="space-y-2">
        <Label>Photo gallery</Label>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((url) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setPhotos((p) => p.filter((u) => u !== url))} className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 transition group-hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-6 text-sm hover:border-brand">
          <Upload className="h-4 w-4" /><span>{uploading ? "Uploading…" : "Upload photos (up to 20, max 5 MB)"}</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadPhotos(e.target.files)} />
        </label>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5"><Video className="h-4 w-4" /> Videos</Label>
        <p className="text-[11px] text-muted-foreground">Paste YouTube, Vimeo, or direct video URLs (max 10).</p>
        <div className="flex gap-2">
          <Input value={newVideo} onChange={(e) => setNewVideo(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
          <Button type="button" onClick={addVideo} variant="outline">Add</Button>
        </div>
        {videos.length > 0 && (
          <ul className="space-y-2">
            {videos.map((v) => (
              <li key={v} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <span className="truncate">{v}</span>
                <button type="button" onClick={() => setVideos((vs) => vs.filter((x) => x !== v))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button onClick={save} disabled={saving || uploading} className="w-full h-11">{saving ? "Saving…" : "Save media"}</Button>
    </div>
  );
}

function DocsEditor({ placeId, listing }: { placeId: string; listing: Listing }) {
  const qc = useQueryClient();
  const update = useServerFn(updateMyListing);
  const [certs, setCerts] = useState<string[]>((listing.certificate_urls as string[]) ?? []);
  const [docs, setDocs] = useState<string[]>((listing.document_urls as string[]) ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function uploadTo(bucketList: string[], setList: (l: string[]) => void, files: FileList | null, kind: "cert" | "doc") {
    if (!files || !files.length) return;
    if (bucketList.length + files.length > 20) return toast.error("Maximum 20 files");
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} over 10MB`); continue; }
      const ext = file.name.split(".").pop() ?? "pdf";
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
      const path = `${placeId}/${kind}/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from("provider-files").upload(path, file);
      if (error) { toast.error(error.message); continue; }
      // Create a signed URL (1 year)
      const { data: signed } = await supabase.storage.from("provider-files").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signed?.signedUrl) newUrls.push(signed.signedUrl);
    }
    if (newUrls.length) setList([...bucketList, ...newUrls]);
    setUploading(false);
  }

  async function save() {
    setSaving(true);
    try {
      await update({ data: { placeId, certificate_urls: certs, document_urls: docs } });
      toast.success("Files saved");
      qc.invalidateQueries({ queryKey: ["my-listing", placeId] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <FileList icon={<Award className="h-4 w-4" />} label="Certificates" hint="Upload certifications & credentials (publicly displayed)." items={certs} onRemove={(u) => setCerts((c) => c.filter((x) => x !== u))} />
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-6 text-sm hover:border-brand">
        <Upload className="h-4 w-4" /><span>{uploading ? "Uploading…" : "Upload certificates (PDF, JPG, PNG — max 10 MB)"}</span>
        <input type="file" accept=".pdf,image/*" multiple className="hidden" onChange={(e) => uploadTo(certs, setCerts, e.target.files, "cert")} />
      </label>

      <FileList icon={<FileText className="h-4 w-4" />} label="Private documents" hint="Internal documents (not publicly displayed)." items={docs} onRemove={(u) => setDocs((d) => d.filter((x) => x !== u))} />
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-6 text-sm hover:border-brand">
        <Upload className="h-4 w-4" /><span>{uploading ? "Uploading…" : "Upload documents"}</span>
        <input type="file" multiple className="hidden" onChange={(e) => uploadTo(docs, setDocs, e.target.files, "doc")} />
      </label>

      <Button onClick={save} disabled={saving || uploading} className="w-full h-11">{saving ? "Saving…" : "Save files"}</Button>
    </div>
  );
}

function FileList({ icon, label, hint, items, onRemove }: { icon: React.ReactNode; label: string; hint: string; items: string[]; onRemove: (url: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">{icon} {label}</Label>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None uploaded.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((u, i) => (
            <li key={u} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <a href={u} target="_blank" rel="noopener noreferrer" className="truncate text-brand hover:underline">{label} {i + 1}</a>
              <button type="button" onClick={() => onRemove(u)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
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
        <h3 className="font-display text-lg">Add a question tailored to your brand</h3>
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
    { icon: Eye, label: "All-time profile views", value: data.totalViews },
    { icon: Star, label: "Review count (Google)", value: data.reviewCount },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
