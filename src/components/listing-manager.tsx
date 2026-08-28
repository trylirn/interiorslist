import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyListing, updateMyListing, listMyLeads, listMyReviews, updateLeadStatus } from "@/lib/owner.functions";
import { listProviderFaqs, upsertProviderFaq, deleteProviderFaq, getListingMetrics, respondToReview, listReviewResponses } from "@/lib/brand-extra.functions";
import { SERVICES, STYLES, PROJECT_TYPES, BUDGET_BANDS } from "@/lib/cities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { Eye, Plus, MessageSquare, Star, Trash2, Upload, X, Video, FileText, Award, Shield, Mail, Phone, Building2 } from "lucide-react";
import { toast } from "sonner";

export function ListingManager({ placeId, admin = false }: { placeId: string; admin?: boolean }) {
  const { data, isLoading } = useQuery({ queryKey: ["my-listing", placeId], queryFn: () => getMyListing({ data: { placeId } }) });
  const backTo = admin ? "/admin" : "/dashboard";

  if (isLoading) return <div className="mx-auto max-w-3xl px-4 py-16"><p className="text-muted-foreground">Loading…</p></div>;
  if (!data?.listing) return (
    <div className="mx-auto max-w-md py-24 text-center px-4">
      <h1 className="font-display text-3xl">Not found</h1>
      <p className="mt-3 text-muted-foreground">This listing doesn't exist{admin ? "." : " or isn't claimed by you."}</p>
      <Button asChild className="mt-6"><Link to={backTo}>Back</Link></Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link to={backTo} className="text-sm text-muted-foreground hover:text-brand">← Back to {admin ? "admin" : "dashboard"}</Link>
      {admin && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-brand/40 bg-brand/5 px-4 py-2.5 text-sm">
          <Shield className="h-4 w-4 text-brand" />
          <span>Super admin onboarding mode — you are editing this studio on their behalf. Changes save to their live listing.</span>
        </div>
      )}
      <h1 className="mt-3 font-display text-4xl">{(data.listing as Listing).name as string}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{[(data.listing as Listing).city, (data.listing as Listing).state].filter(Boolean).join(", ")}</p>

      <Tabs defaultValue="info" className="mt-8">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="info">About & info</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="docs">Certificates & files</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-6"><InfoEditor placeId={placeId} listing={data.listing} backTo={backTo} /></TabsContent>
        <TabsContent value="media" className="mt-6"><MediaEditor placeId={placeId} listing={data.listing} /></TabsContent>
        <TabsContent value="docs" className="mt-6"><DocsEditor placeId={placeId} listing={data.listing} /></TabsContent>
        <TabsContent value="faqs" className="mt-6"><FaqEditor placeId={placeId} /></TabsContent>
        <TabsContent value="leads" className="mt-6"><ListingLeads placeId={placeId} /></TabsContent>
        <TabsContent value="reviews" className="mt-6"><ListingReviews placeId={placeId} /></TabsContent>
        <TabsContent value="metrics" className="mt-6"><MetricsPanel placeId={placeId} /></TabsContent>
      </Tabs>
    </div>
  );
}

type Listing = Record<string, unknown>;

function InfoEditor({ placeId, listing, backTo }: { placeId: string; listing: Listing; backTo: string }) {
  const navigate = useNavigate();
  const update = useServerFn(updateMyListing);
  const qc = useQueryClient();
  const existingSocial = (listing.social_links as Record<string, string> | null) ?? {};
  const [form, setForm] = useState({
    name: (listing.name as string) ?? "",
    about_description: (listing.about_description as string) ?? "",
    specialists: (listing.specialists as string) ?? "",
    website: (listing.website as string) ?? "",
    
    branch_label: (listing.branch_label as string) ?? "",
    address: (listing.address as string) ?? "",
    city: (listing.city as string) ?? "",
    state: ((listing.state as string) ?? "").toUpperCase(),
    postal_code: (listing.postal_code as string) ?? "",
    email_forward_to: (listing.email_forward_to as string) ?? "",
    services: ((listing.services as string[]) ?? []),
    styles: ((listing.styles as string[]) ?? []),
    project_types: ((listing.project_types as string[]) ?? []),
    typical_project_budget: (listing.typical_project_budget as string) ?? "",
    remote_services: Boolean(listing.remote_services),
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
    social_pinterest: existingSocial.pinterest ?? "",
  });
  const [team, setTeam] = useState<{ name: string; role: string; bio: string }[]>(
    Array.isArray(listing.team)
      ? (listing.team as any[]).map((m) => ({ name: String(m?.name ?? ""), role: String(m?.role ?? ""), bio: String(m?.bio ?? "") }))
      : [],
  );
  const [packages, setPackages] = useState<{ name: string; price: string; note: string }[]>(
    Array.isArray(listing.price_ranges)
      ? (listing.price_ranges as any[]).map((p) => ({ name: String(p?.name ?? ""), price: String(p?.price ?? ""), note: String(p?.note ?? "") }))
      : [],
  );
  const [saving, setSaving] = useState(false);
  // Anything that isn't one of the preset bands is treated as a custom cost line.
  const isCustomCost =
    !!form.typical_project_budget && !BUDGET_BANDS.some((b) => b.slug === form.typical_project_budget);

  function toggleService(slug: string) {
    setForm((f) => ({ ...f, services: f.services.includes(slug) ? f.services.filter((s) => s !== slug) : [...f.services, slug] }));
  }
  function toggleStyle(slug: string) {
    setForm((f) => ({ ...f, styles: f.styles.includes(slug) ? f.styles.filter((s) => s !== slug) : [...f.styles, slug] }));
  }
  function toggleProjectType(slug: string) {
    setForm((f) => ({ ...f, project_types: f.project_types.includes(slug) ? f.project_types.filter((s) => s !== slug) : [...f.project_types, slug] }));
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
      if (form.social_pinterest) social.pinterest = form.social_pinterest;
      const {
        social_instagram, social_facebook, social_tiktok, social_youtube, social_linkedin, social_x, social_pinterest,
        founded_year, years_in_business, service_area, ...rest
      } = form;
      await update({
        data: {
          placeId,
          ...rest,
          social_links: social,
          founded_year: founded_year ? Number(founded_year) : null,
          years_in_business: years_in_business ? Number(years_in_business) : null,
          service_area: (service_area || null) as "local" | "regional" | "nationwide" | "national_international" | null,
          team: team
            .filter((m) => m.name.trim() && m.role.trim())
            .map((m) => ({ name: m.name.trim(), role: m.role.trim(), bio: m.bio.trim() })),
          price_ranges: packages.filter((p) => p.name.trim()).map((p) => ({ name: p.name.trim(), price: p.price.trim(), note: p.note.trim() })),
        },
      });
      toast.success("Listing updated");
      qc.invalidateQueries({ queryKey: ["my-listing", placeId] });
      navigate({ to: backTo });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to save"); }

    finally { setSaving(false); }
  }

  return (
    <form onSubmit={onSave} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Studio name</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={160} required placeholder="Your studio name" />
        <p className="text-[11px] text-muted-foreground">Shown as the heading on your public profile.</p>
      </div>
      <div className="space-y-1.5">
        <Label>About</Label>
        <Textarea rows={5} value={form.about_description} onChange={(e) => setForm({ ...form, about_description: e.target.value })} placeholder="Tell visitors who you are, your philosophy, and what makes you different…" maxLength={4000} />
        <p className="text-[11px] text-muted-foreground">Shown publicly on your profile under "About".</p>
      </div>
      <div className="space-y-1.5"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
      
      <div className="space-y-1.5">
        <Label>Forward new leads to this email</Label>
        <Input type="email" value={form.email_forward_to} onChange={(e) => setForm({ ...form, email_forward_to: e.target.value })} placeholder="leads@yourstudio.com" />
        <p className="text-[11px] text-muted-foreground">Optional. We'll mirror dashboard leads to this address (requires email setup).</p>
      </div>
      <div className="space-y-1.5"><Label>Branch label</Label><Input value={form.branch_label} onChange={(e) => setForm({ ...form, branch_label: e.target.value })} placeholder="Uptown, North, etc." /></div>
      <div className="space-y-3 rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-lg">Meet the team</p>
            <p className="text-[11px] text-muted-foreground">Designers on staff. Shown publicly as a "Meet the team" card on your profile.</p>
          </div>
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setTeam((t) => [...t, { name: "", role: "", bio: "" }])}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add member
          </Button>
        </div>
        {team.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No team members yet.{form.specialists ? ` Previously listed: ${form.specialists}` : ""}
          </p>
        )}
        {team.map((m, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border bg-secondary/20 p-3">
            <div className="flex gap-2">
              <Input value={m.name} onChange={(e) => setTeam((t) => t.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Full name" maxLength={120} />
              <Input value={m.role} onChange={(e) => setTeam((t) => t.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} placeholder="Role / position" maxLength={120} />
              <Button type="button" variant="ghost" size="icon" aria-label="Remove team member" onClick={() => setTeam((t) => t.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Textarea rows={2} value={m.bio} onChange={(e) => setTeam((t) => t.map((x, j) => (j === i ? { ...x, bio: e.target.value } : x)))} placeholder="Short intro (optional)" maxLength={600} />
          </div>
        ))}
      </div>

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
                <SelectItem value="national_international">National &amp; International</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5"><Label>Service area note</Label><Input value={form.service_area_note} onChange={(e) => setForm({ ...form, service_area_note: e.target.value })} placeholder="Serving the metro area and surrounding suburbs" maxLength={500} /></div>
        <div className="space-y-1.5"><Label>Credentials &amp; licenses</Label><Textarea rows={3} value={form.credentials} onChange={(e) => setForm({ ...form, credentials: e.target.value })} placeholder="Professional certifications, memberships, license #…" maxLength={2000} /></div>
        <div className="space-y-1.5"><Label>Types of clients served</Label><Textarea rows={3} value={form.client_types} onChange={(e) => setForm({ ...form, client_types: e.target.value })} placeholder="Homeowners, developers, boutique hotels…" maxLength={2000} /></div>
        <div className="space-y-1.5">
          <Label>Not a good fit if…</Label>
          <Textarea rows={3} value={form.not_a_fit} onChange={(e) => setForm({ ...form, not_a_fit: e.target.value })} placeholder="We're not the right fit if you're looking for a same-day turnaround or a strict budget under $5k." maxLength={2000} />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg">Packages &amp; typical prices</p>
            <p className="text-[11px] text-muted-foreground">Optional. Listed on your public profile so clients can see what you offer.</p>
          </div>
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
          <Input value={form.social_pinterest} onChange={(e) => setForm({ ...form, social_pinterest: e.target.value })} placeholder="Pinterest URL" />
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

      <div className="space-y-2">
        <Label>Design styles</Label>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((s) => {
            const active = form.styles.includes(s.slug);
            return (
              <button type="button" key={s.slug} onClick={() => toggleStyle(s.slug)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card hover:border-brand"}`}>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Project types</Label>
        <div className="flex flex-wrap gap-2">
          {PROJECT_TYPES.map((p) => {
            const active = form.project_types.includes(p.slug);
            return (
              <button type="button" key={p.slug} onClick={() => toggleProjectType(p.slug)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card hover:border-brand"}`}>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Typical job cost</Label>
        <Select
          value={isCustomCost ? "custom" : form.typical_project_budget || undefined}
          onValueChange={(v) => setForm({ ...form, typical_project_budget: v === "custom" ? "Custom" : v })}
        >
          <SelectTrigger><SelectValue placeholder="Select a range" /></SelectTrigger>
          <SelectContent>
            {BUDGET_BANDS.map((b) => <SelectItem key={b.slug} value={b.slug}>{b.label}</SelectItem>)}
            <SelectItem value="custom">Custom…</SelectItem>
          </SelectContent>
        </Select>
        {isCustomCost && (
          <Input
            value={form.typical_project_budget}
            onChange={(e) => setForm({ ...form, typical_project_budget: e.target.value })}
            placeholder="e.g. From $8k per room"
            maxLength={40}
            aria-label="Custom typical job cost"
          />
        )}
        <p className="text-[11px] text-muted-foreground">Shown on your public profile and used to match you with clients' budgets.</p>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border p-4">
        <div>
          <Label>Offers remote / e-design services</Label>
          <p className="text-[11px] text-muted-foreground">Show clients you can work virtually, not just in person.</p>
        </div>
        <Switch checked={form.remote_services} onCheckedChange={(v) => setForm({ ...form, remote_services: v })} />
      </div>

      <Button type="submit" disabled={saving} className="w-full h-11">{saving ? "Saving…" : "Save changes"}</Button>
    </form>
  );
}

function MediaEditor({ placeId, listing }: { placeId: string; listing: Listing }) {
  const qc = useQueryClient();
  const update = useServerFn(updateMyListing);
  const [photos, setPhotos] = useState<string[]>((listing.gallery_urls as string[]) ?? []);
  
  const [logo, setLogo] = useState(((listing as Record<string, unknown>).logo_url as string) ?? "");
  const [videos, setVideos] = useState<string[]>((listing.video_urls as string[]) ?? []);
  const [newVideo, setNewVideo] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);


  // Studio photos live in a private bucket, so we store long-lived signed links.
  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${placeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("provider-photos").upload(path, file);
    if (error) { toast.error(error.message); return null; }
    const { data: signed } = await supabase.storage.from("provider-photos").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    return signed?.signedUrl ?? null;
  }

  async function uploadLogo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Logo must be an image");
    if (file.size > 2 * 1024 * 1024) return toast.error("Logo must be under 2 MB");
    setUploading(true);
    const url = await uploadImage(file);
    if (url) setLogo(url);
    setUploading(false);
  }




  async function uploadPhotos(files: FileList | null) {
    if (!files || !files.length) return;
    if (photos.length + files.length > 20) return toast.error("Maximum 20 photos");
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} not an image`); continue; }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} over 5MB`); continue; }
      const url = await uploadImage(file);
      if (url) newUrls.push(url);
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
      await update({ data: { placeId, gallery_urls: photos, video_urls: videos, logo_url: logo } });
      toast.success("Media saved");
      qc.invalidateQueries({ queryKey: ["my-listing", placeId] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }

  // Shared drag-and-drop wiring so every uploader accepts dropped image files.
  function dropZone(target: "logo" | "gallery") {
    return {
      onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragOver(target); },
      onDragLeave: () => setDragOver(null),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(null);
        const files = e.dataTransfer.files;
        if (!files?.length) return;
        if (target === "gallery") void uploadPhotos(files);
        else void uploadLogo(files);
      },
      "data-active": dragOver === target ? "true" : undefined,
    };
  }

  const zoneClass = (target: string) =>
    `cursor-pointer rounded-xl border border-dashed transition ${dragOver === target ? "border-brand bg-brand/5" : "border-border hover:border-brand"}`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Studio logo</Label>
        <p className="text-[11px] text-muted-foreground">Square image works best (PNG or JPG, max 2 MB). Shown next to your studio name on your public profile.</p>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary/40">
            {logo ? <img src={logo} alt="Studio logo" className="h-full w-full object-cover" /> : <Building2 className="h-6 w-6 text-muted-foreground" />}
          </div>
          <div className="flex flex-wrap gap-2">
            <label {...dropZone("logo")} className={`flex items-center gap-2 px-4 py-2.5 text-sm ${zoneClass("logo")}`}>
              <Upload className="h-4 w-4" /><span>{uploading ? "Uploading…" : logo ? "Replace logo" : "Upload or drop logo"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(e.target.files)} />
            </label>
            {logo && (
              <Button type="button" variant="ghost" onClick={() => setLogo("")} className="gap-1.5"><X className="h-4 w-4" /> Remove</Button>
            )}
          </div>
        </div>
      </div>


      <div className="space-y-2">
        <Label>Photo gallery</Label>
        <p className="text-[11px] text-muted-foreground">Project photos shown in the gallery on your profile.</p>
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
        <label {...dropZone("gallery")} className={`flex items-center justify-center gap-2 bg-secondary/40 px-4 py-6 text-sm ${zoneClass("gallery")}`}>
          <Upload className="h-4 w-4" /><span>{uploading ? "Uploading…" : "Click to upload or drag photos here (up to 20, max 5 MB)"}</span>
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

function ListingLeads({ placeId }: { placeId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["listing-leads", placeId], queryFn: () => listMyLeads({ data: { placeId } }) });
  const setStatusFn = useServerFn(updateLeadStatus);
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const leads = data?.leads ?? [];
  if (!leads.length) return <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No leads yet for this listing.</p>;
  return (
    <div className="space-y-3">
      {leads.map((l) => (
        <div key={l.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{l.first_name} {l.last_name}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{l.email}</span>
                {l.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{l.phone}</span>}
                <span>{new Date(l.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <Select
              value={l.status}
              onValueChange={async (v) => {
                try {
                  await setStatusFn({ data: { id: l.id, status: v as "new" | "contacted" | "closed" } });
                  toast.success("Updated");
                  qc.invalidateQueries({ queryKey: ["listing-leads", placeId] });
                } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
              }}
            >
              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm">{l.message}</p>
        </div>
      ))}
    </div>
  );
}

function ListingReviews({ placeId }: { placeId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["listing-reviews", placeId], queryFn: () => listMyReviews({ data: { placeId } }) });
  const reviews = data?.reviews ?? [];
  const ids = reviews.map((r) => r.id);
  const { data: respData } = useQuery({
    queryKey: ["listing-review-responses", placeId, ids.join(",")],
    queryFn: () => listReviewResponses({ data: { reviewIds: ids } }),
    enabled: ids.length > 0,
  });
  const respond = useServerFn(respondToReview);
  const respMap = new Map((respData?.responses ?? []).map((r) => [r.review_id, r.body]));
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!reviews.length) return <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No reviews yet for this listing.</p>;
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <ListingReviewCard
          key={r.id}
          review={r}
          existingResponse={respMap.get(r.id) ?? ""}
          onSave={async (body) => {
            try {
              await respond({ data: { reviewId: r.id, body } });
              toast.success("Response posted");
              qc.invalidateQueries({ queryKey: ["listing-review-responses", placeId, ids.join(",")] });
            } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
          }}
        />
      ))}
    </div>
  );
}

function ListingReviewCard({ review: r, existingResponse, onSave }: { review: { id: string; author_name: string | null; rating: number | null; text: string | null }; existingResponse: string; onSave: (body: string) => Promise<void> }) {
  const [body, setBody] = useState(existingResponse);
  const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <p className="font-medium">{r.author_name ?? "Anonymous"}</p>
        <span className="flex items-center gap-0.5 text-amber-500">
          {Array.from({ length: r.rating ?? 0 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
        </span>
      </div>
      {r.text && <p className="mt-3 text-sm">{r.text}</p>}
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Response</p>
        <Textarea className="mt-2 min-h-20" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Thanks for your feedback…" maxLength={2000} />
        <Button size="sm" className="mt-2" disabled={busy || body.trim().length < 2} onClick={async () => { setBusy(true); await onSave(body.trim()); setBusy(false); }}>
          {busy ? "Saving…" : existingResponse ? "Update response" : "Post response"}
        </Button>
      </div>
    </div>
  );
}
