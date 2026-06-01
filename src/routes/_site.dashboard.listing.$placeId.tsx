import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyListing, updateMyListing } from "@/lib/owner.functions";
import { SERVICES } from "@/lib/cities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/dashboard/listing/$placeId")({
  head: () => ({ meta: [{ title: "Edit listing | Texas Aesthetics" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: EditListing,
});

function EditListing() {
  const { placeId } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["my-listing", placeId], queryFn: () => getMyListing({ data: { placeId } }) });
  const update = useServerFn(updateMyListing);
  const [form, setForm] = useState({ specialists: "", notes: "", website: "", phone: "", hero_photo_url: "", branch_label: "", services: [] as string[] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.listing) {
      const l = data.listing;
      setForm({
        specialists: l.specialists ?? "",
        notes: l.notes ?? "",
        website: l.website ?? "",
        phone: l.phone ?? "",
        hero_photo_url: l.hero_photo_url ?? "",
        branch_label: l.branch_label ?? "",
        services: l.services ?? [],
      });
    }
  }, [data]);

  if (isLoading) return <div className="mx-auto max-w-2xl px-4 py-16"><p className="text-muted-foreground">Loading…</p></div>;
  if (!data?.listing) return (
    <div className="mx-auto max-w-md py-24 text-center px-4">
      <h1 className="font-display text-3xl">Not found</h1>
      <p className="mt-3 text-muted-foreground">This listing doesn't exist or isn't claimed by you.</p>
      <Button asChild className="mt-6"><Link to="/dashboard">Back to dashboard</Link></Button>
    </div>
  );

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await update({ data: { placeId, ...form } });
      toast.success("Listing updated");
      navigate({ to: "/dashboard" });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSaving(false); }
  }

  function toggleService(slug: string) {
    setForm((f) => ({ ...f, services: f.services.includes(slug) ? f.services.filter((s) => s !== slug) : [...f.services, slug] }));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-brand">← Back to dashboard</Link>
      <h1 className="mt-3 font-display text-4xl">{data.listing.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{data.listing.city}, TX</p>

      <form onSubmit={onSave} className="mt-8 space-y-5">
        <div className="space-y-1.5"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Hero photo URL</Label><Input value={form.hero_photo_url} onChange={(e) => setForm({ ...form, hero_photo_url: e.target.value })} placeholder="https://…" /></div>
        <div className="space-y-1.5"><Label>Branch label</Label><Input value={form.branch_label} onChange={(e) => setForm({ ...form, branch_label: e.target.value })} placeholder="Uptown, North, etc." /></div>
        <div className="space-y-1.5"><Label>Specialists</Label><Textarea rows={3} value={form.specialists} onChange={(e) => setForm({ ...form, specialists: e.target.value })} placeholder="Dr. Jane Doe, MD; Jamie Smith, APRN" /></div>
        <div className="space-y-1.5"><Label>About / notes</Label><Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

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
    </div>
  );
}
