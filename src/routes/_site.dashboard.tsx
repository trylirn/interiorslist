import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listMyListings, listMyLeads, listMyReviews, updateLeadStatus } from "@/lib/owner.functions";
import { Star, Mail, Phone, ExternalLink, Building2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | Texas Aesthetics" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setEmail(data.session?.user.email ?? null); setReady(true); });
  }, []);

  if (!ready) return <div className="mx-auto max-w-2xl px-4 py-16"><p className="text-muted-foreground">Loading…</p></div>;
  if (!email) return (
    <div className="mx-auto max-w-md py-24 text-center px-4">
      <h1 className="font-display text-3xl">Please sign in</h1>
      <Button asChild className="mt-6"><Link to="/login">Sign in</Link></Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Signed in as <span className="font-medium text-foreground">{email}</span></p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/favorites">Favorites</Link></Button>
          <Button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} variant="outline" size="sm">Sign out</Button>
        </div>
      </div>

      <Tabs defaultValue="listings" className="mt-8">
        <TabsList>
          <TabsTrigger value="listings">My Listings</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
        <TabsContent value="listings" className="mt-6"><ListingsTab /></TabsContent>
        <TabsContent value="leads" className="mt-6"><LeadsTab /></TabsContent>
        <TabsContent value="reviews" className="mt-6"><ReviewsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ListingsTab() {
  const { data, isLoading } = useQuery({ queryKey: ["my-listings"], queryFn: () => listMyListings() });
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const listings = data?.listings ?? [];
  if (!listings.length) return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
      <h3 className="mt-3 font-display text-xl">No claimed listings yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">Find your medspa and claim it to manage your profile.</p>
      <Button asChild className="mt-6"><Link to="/search">Find your listing</Link></Button>
    </div>
  );
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {listings.map((l) => (
        <div key={l.place_id} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-lg">{l.name}</h3>
          <p className="text-sm text-muted-foreground">{l.city}, TX</p>
          {l.services && l.services.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">{l.services.slice(0, 4).join(" · ")}</p>
          )}
          <div className="mt-4 flex gap-2">
            <Button asChild size="sm"><Link to="/dashboard/listing/$placeId" params={{ placeId: l.place_id }}>Edit</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/provider/$slug" params={{ slug: l.slug }}>View</Link></Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function LeadsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-leads"], queryFn: () => listMyLeads() });
  const updateStatus = useServerFn(updateLeadStatus);
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const leads = data?.leads ?? [];
  if (!leads.length) return <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No leads yet. Inquiries from your listings will show up here.</p>;

  async function setStatus(id: string, status: "new" | "contacted" | "closed") {
    try {
      await updateStatus({ data: { id, status } });
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["my-leads"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

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
            <Select value={l.status} onValueChange={(v) => setStatus(l.id, v as "new" | "contacted" | "closed")}>
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

function ReviewsTab() {
  const { data, isLoading } = useQuery({ queryKey: ["my-reviews"], queryFn: () => listMyReviews() });
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const reviews = data?.reviews ?? [];
  if (!reviews.length) return <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No reviews yet on your listings.</p>;
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <p className="font-medium">{r.author_name ?? "Anonymous"}</p>
            <span className="flex items-center gap-0.5 text-amber-500">
              {Array.from({ length: r.rating ?? 0 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
            </span>
            {r.providerName && <span className="text-xs text-muted-foreground flex items-center gap-1"><ExternalLink className="h-3 w-3" />{r.providerName}</span>}
          </div>
          {r.text && <p className="mt-3 text-sm">{r.text}</p>}
        </div>
      ))}
    </div>
  );
}
