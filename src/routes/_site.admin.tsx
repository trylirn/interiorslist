import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles, listAdmins, grantRole, revokeRole, cancelInvite } from "@/lib/role.functions";
import {
  adminMetrics,
  listPendingClaims,
  reviewClaim,
  listPendingSubmissions,
  reviewSubmission,
  listAllProviders,
  toggleProviderFlag,
  getLicenseDocSignedUrl,
} from "@/lib/admin.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export const Route = createFileRoute("/_site/admin")({
  head: () => ({ meta: [{ title: "Admin | Texas Aesthetics" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChild = pathname.replace(/\/$/, "") !== "/admin";
  if (isChild) return <Outlet />;
  return <AdminPage />;
}


function AdminPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setReady(true);
    });
  }, []);

  const { data: roles, isLoading } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => getMyRoles(),
    enabled: authed,
  });

  if (!ready || (authed && isLoading)) {
    return <div className="mx-auto max-w-4xl px-4 py-16"><p className="text-muted-foreground">Loading…</p></div>;
  }
  if (!authed) {
    return (
      <div className="mx-auto max-w-md py-24 text-center px-4">
        <h1 className="font-display text-3xl">Admin only</h1>
        <Button className="mt-6" onClick={() => navigate({ to: "/login" })}>Sign in</Button>
      </div>
    );
  }
  if (!roles?.isAdmin) {
    return (
      <div className="mx-auto max-w-md py-24 text-center px-4">
        <h1 className="font-display text-3xl">Forbidden</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don't have admin access.</p>
        <Button asChild className="mt-6"><Link to="/dashboard">Go to dashboard</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl">Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">Site-wide management.</p>

      <Tabs defaultValue="analytics" className="mt-8">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="mine">My dashboard</TabsTrigger>
        </TabsList>
        <TabsContent value="analytics" className="mt-6"><AnalyticsDashboard /></TabsContent>
        <TabsContent value="overview" className="mt-6"><OverviewTab /></TabsContent>
        <TabsContent value="claims" className="mt-6"><ClaimsTab /></TabsContent>
        <TabsContent value="submissions" className="mt-6"><SubmissionsTab /></TabsContent>
        <TabsContent value="listings" className="mt-6"><ListingsTab /></TabsContent>
        <TabsContent value="team" className="mt-6"><TeamTab /></TabsContent>
        <TabsContent value="mine" className="mt-6">
          <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm">
            <p className="font-medium">Your own provider dashboard (sandbox)</p>
            <p className="mt-1 text-muted-foreground">
              A private demo listing that behaves exactly like a real provider account — edit anything here to explore the provider experience. It is never published to the directory.
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link to="/admin/provider/$placeId" params={{ placeId: "demo-admin-listing" }}>Open my dashboard</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      <p className="mt-6 text-xs text-muted-foreground">
        <Link to="/admin/articles" className="text-brand underline">Scrape provider articles →</Link>
      </p>
    </div>
  );
}

function OverviewTab() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-metrics"], queryFn: () => adminMetrics() });
  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;
  const tiles = [
    { label: "Providers", value: data.totals.providers },
    { label: "Claimed", value: data.totals.claimed },
    { label: "Pending Claims", value: data.totals.pendingClaims },
    { label: "Pending Submissions", value: data.totals.pendingSubmissions },
    { label: "Leads (7d)", value: data.activity.messages7d },
    { label: "Leads (30d)", value: data.activity.messages30d },
    { label: "Reviews (7d)", value: data.activity.reviews7d },
    { label: "Reviews (30d)", value: data.activity.reviews30d },
    { label: "Signups (7d)", value: data.activity.signups7d },
    { label: "Signups (30d)", value: data.activity.signups30d },
  ];
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t.label}</p>
            <p className="mt-2 font-display text-3xl">{t.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-xl">Top cities</h3>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {data.topCities.map((c) => (
            <li key={c.slug} className="flex justify-between border-b border-border py-2 text-sm">
              <span>{c.city}</span>
              <span className="text-muted-foreground">{c.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ClaimsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-claims"], queryFn: () => listPendingClaims() });
  const review = useServerFn(reviewClaim);
  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;
  if (!data.claims.length) return <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No claims to review.</p>;
  async function decide(id: string, action: "approve" | "reject") {
    try { await review({ data: { id, action } }); toast.success(action === "approve" ? "Claim approved" : "Claim rejected"); qc.invalidateQueries({ queryKey: ["admin-claims"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  return (
    <div className="space-y-3">
      {data.claims.map((c) => (
        <div key={c.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg">{c.provider?.name ?? c.provider_place_id}</p>
              <p className="text-xs text-muted-foreground">{c.provider?.city ?? ""} · {c.status} · {new Date(c.submitted_at).toLocaleDateString()}</p>
              <p className="mt-2 text-sm">Contact: <span className="font-medium">{c.contact_email}</span>{c.contact_phone && <> · {c.contact_phone}</>}</p>
              {c.business_role && <p className="text-sm">Role: {c.business_role}</p>}
              {c.proof_notes && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{c.proof_notes}</p>}
            </div>
            {c.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => decide(c.id, "approve")}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => decide(c.id, "reject")}>Reject</Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SubmissionsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-subs"], queryFn: () => listPendingSubmissions() });
  const review = useServerFn(reviewSubmission);
  const signUrl = useServerFn(getLicenseDocSignedUrl);
  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;
  if (!data.submissions.length) return <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No submissions to review.</p>;
  async function decide(id: string, action: "approve" | "reject") {
    try { await review({ data: { id, action } }); toast.success(action === "approve" ? "Approved" : "Rejected"); qc.invalidateQueries({ queryKey: ["admin-subs"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  async function viewDoc(path: string) {
    try { const r = await signUrl({ data: { path } }); window.open(r.url, "_blank"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  return (
    <div className="space-y-3">
      {data.submissions.map((s) => (
        <div key={s.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg">{s.business_name}</p>
              <p className="text-xs text-muted-foreground">{s.city} · {s.status} · {new Date(s.created_at).toLocaleDateString()}</p>
              <p className="mt-2 text-sm">{s.contact_email}{s.contact_phone && <> · {s.contact_phone}</>}</p>
              {s.website && <p className="text-sm"><a href={s.website} target="_blank" rel="noopener noreferrer" className="text-brand underline">{s.website}</a></p>}
              {s.license_number && <p className="mt-2 text-sm">License: <span className="font-medium">{s.license_type ?? "—"} #{s.license_number}</span></p>}
              {s.npi && <p className="text-sm">NPI: {s.npi}</p>}
              {s.notes && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{s.notes}</p>}
              {s.license_doc_path && <Button size="sm" variant="outline" className="mt-3" onClick={() => viewDoc(s.license_doc_path!)}>View license doc</Button>}
            </div>
            {s.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => decide(s.id, "approve")}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => decide(s.id, "reject")}>Reject</Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListingsTab() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin-listings", q], queryFn: () => listAllProviders({ data: { q } }) });
  const toggle = useServerFn(toggleProviderFlag);
  async function flip(placeId: string, field: "published" | "featured" | "is_verified", value: boolean) {
    try { await toggle({ data: { placeId, field, value } }); qc.invalidateQueries({ queryKey: ["admin-listings"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  return (
    <div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name…" className="max-w-sm" />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-2">Name</th><th>City</th><th>Claimed</th><th>Verified</th><th>Published</th><th>Featured</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Loading…</td></tr>}
            {data?.providers.map((p) => (
              <tr key={p.place_id} className="border-t border-border">
                <td className="p-2"><Link to="/provider/$slug" params={{ slug: p.slug }} className="hover:text-brand">{p.name}</Link></td>
                <td>{p.city}</td>
                <td>{p.claimed_by ? "✓" : "—"}</td>
                <td><Switch checked={p.is_verified} onCheckedChange={(v) => flip(p.place_id, "is_verified", v)} /></td>
                <td><Switch checked={p.published} onCheckedChange={(v) => flip(p.place_id, "published", v)} /></td>
                <td><Switch checked={p.featured} onCheckedChange={(v) => flip(p.place_id, "featured", v)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
