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
  exportProvidersCsv,
  setProviderPlan,
  setProviderPublished,
  setProviderContactEmail,
  getLicenseDocSignedUrl,
  getClaimThreadAdmin,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { BlogAdmin } from "@/components/blog-admin";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard-shell";
import { z } from "zod";
import { BarChart3, LayoutDashboard, FileCheck2, Inbox, Building2, Users, Newspaper, Settings, Wrench, MailWarning } from "lucide-react";
import { OrphanLeads } from "@/components/orphan-leads";
import { AccountSettings } from "@/components/account-settings";
import { ToolDemand } from "@/components/tool-demand";


export const Route = createFileRoute("/_site/admin")({
  validateSearch: (sp: Record<string, unknown>) => z.object({ tab: z.string().optional() }).parse(sp),
  head: () => ({ meta: [{ title: "Admin | Intearior" }, { name: "description", content: "Internal Intearior admin console for managing studio listings, claims and leads." }, { name: "robots", content: "noindex, nofollow" }] }),
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

  return <AdminShell />;
}

const ADMIN_NAV: DashboardNavItem[] = [
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "claims", label: "Claims", icon: FileCheck2 },
  { key: "submissions", label: "Submissions", icon: Inbox },
  { key: "listings", label: "Listings", icon: Building2 },
  { key: "orphanleads", label: "Unrouted leads", icon: MailWarning },
  { key: "team", label: "Team", icon: Users },
  { key: "blog", label: "Blog", icon: Newspaper },
  { key: "tools", label: "Tool demand", icon: Wrench },
  { key: "account", label: "Account", icon: Settings },
];

function AdminShell() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const active = ADMIN_NAV.some((n) => n.key === tab) ? (tab as string) : "analytics";
  const [email, setEmail] = useState<string | null>(null);
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => getMyRoles() });
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
  }, []);
  const { data: metrics } = useQuery({ queryKey: ["admin-metrics"], queryFn: () => adminMetrics() });
  const navWithBadges = ADMIN_NAV.map((item) => {
    if (item.key === "claims") return { ...item, badge: metrics?.totals.pendingClaims };
    if (item.key === "submissions") return { ...item, badge: metrics?.totals.pendingSubmissions };
    return item;
  });

  return (
    <DashboardShell
      title="Admin"
      subtitle="Site-wide management."
      items={navWithBadges}
      active={active}
      onSelect={(key) => navigate({ to: "/admin", search: { tab: key }, replace: true })}
    >
      {active === "analytics" && <AnalyticsDashboard />}
      {active === "overview" && <OverviewTab />}
      {active === "claims" && <ClaimsTab />}
      {active === "submissions" && <SubmissionsTab />}
      {active === "listings" && <ListingsTab />}
      {active === "orphanleads" && <OrphanLeads />}
      {active === "team" && <TeamTab />}
      {active === "blog" && <BlogAdmin />}
      {active === "tools" && <ToolDemand />}
      {active === "account" && <AccountSettings email={email} canClose={!roles?.isSuperAdmin} />}
      
    </DashboardShell>
  );
}

function OverviewTab() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-metrics"], queryFn: () => adminMetrics() });
  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;
  const tiles = [
    { label: "Studios", value: data.totals.providers },
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

const CLAIM_STATUSES = ["pending", "needs_info", "approved", "rejected"] as const;
const CLAIM_LABEL: Record<string, string> = {
  pending: "Pending",
  needs_info: "More info requested",
  approved: "Approved",
  rejected: "Rejected",
};

function ClaimsTab() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-claims"], queryFn: () => listPendingClaims() });
  const [filter, setFilter] = useState<string>("open");
  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;

  const claims = data.claims.filter((c) =>
    filter === "all" ? true : filter === "open" ? c.status === "pending" || c.status === "needs_info" : c.status === filter,
  );

  return (
    <div className="space-y-4">
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="h-9 w-56" aria-label="Filter claims by status"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Open (pending + info needed)</SelectItem>
          <SelectItem value="all">All claims</SelectItem>
          {CLAIM_STATUSES.map((s) => <SelectItem key={s} value={s}>{CLAIM_LABEL[s]}</SelectItem>)}
        </SelectContent>
      </Select>

      {!claims.length ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No claims to review.</p>
      ) : (
        <div className="space-y-3">{claims.map((c) => <ClaimCard key={c.id} claim={c} />)}</div>
      )}
    </div>
  );
}

type AdminClaim = Awaited<ReturnType<typeof listPendingClaims>>["claims"][number];

function ClaimCard({ claim: c }: { claim: AdminClaim }) {
  const qc = useQueryClient();
  const review = useServerFn(reviewClaim);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: thread } = useQuery({
    queryKey: ["admin-claim-thread", c.id],
    queryFn: () => getClaimThreadAdmin({ data: { claimId: c.id } }),
    enabled: open,
  });

  async function decide(action: "approve" | "reject" | "request_info" | "pending") {
    setBusy(true);
    try {
      await review({ data: { id: c.id, action, note: note.trim() } });
      setNote("");
      toast.success(
        action === "approve" ? "Claim approved"
        : action === "reject" ? "Claim rejected"
        : action === "request_info" ? "More info requested" : "Moved back to pending",
      );
      qc.invalidateQueries({ queryKey: ["admin-claims"] });
      qc.invalidateQueries({ queryKey: ["admin-claim-thread", c.id] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex flex-wrap items-center gap-2 font-display text-lg">
            {c.provider?.name ?? c.provider_place_id}
            {(c as { needsReply?: boolean }).needsReply && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-medium text-destructive-foreground">
                Needs reply
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {c.provider?.city ?? ""} · {CLAIM_LABEL[c.status] ?? c.status} · {new Date(c.submitted_at).toLocaleDateString()}
          </p>
          <p className="mt-2 text-sm">
            {c.contact_name && <span className="font-medium">{c.contact_name} · </span>}
            <span className="font-medium">{c.contact_email}</span>{c.contact_phone && <> · {c.contact_phone}</>}
          </p>
          {c.business_role && <p className="text-sm">Role: {c.business_role}</p>}
          {c.proof_notes && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{c.proof_notes}</p>}
          {c.decision_reason && <p className="mt-2 text-sm"><span className="text-muted-foreground">Last note:</span> {c.decision_reason}</p>}
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>{open ? "Hide" : "Review"}</Button>
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          {(thread?.messages ?? []).map((m) => (
            <div key={m.id} className={`rounded-xl border p-3 ${m.author_role === "admin" ? "border-brand/30 bg-brand/5" : "border-border"}`}>
              <p className="text-xs text-muted-foreground">{m.author_name ?? m.author_role} · {new Date(m.created_at).toLocaleString()}</p>
              <p className="mt-1 whitespace-pre-line text-sm">{m.body}</p>
              {m.attachmentUrl && (
                <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-brand underline">View attachment</a>
              )}
            </div>
          ))}
          <Textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note to the claimant — e.g. please send a business licence or a photo of your signage."
            aria-label="Note to the claimant"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => decide("approve")}>Approve</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => decide("request_info")}>Request more info</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => decide("reject")}>Reject with reason</Button>
            {c.status !== "pending" && (
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => decide("pending")}>Move to pending</Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">A note is required when requesting info or rejecting.</p>
        </div>
      )}
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
              {s.npi && <p className="text-sm">License #: {s.npi}</p>}
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

function ContactEmailCell({ placeId, value, forwardTo }: { placeId: string; value: string; forwardTo: string }) {
  const [email, setEmail] = useState(value);
  const [busy, setBusy] = useState(false);
  const save = useServerFn(setProviderContactEmail);
  const dirty = email.trim() !== value;
  async function commit() {
    if (!dirty) return;
    setBusy(true);
    try {
      await save({ data: { placeId, email: email.trim() } });
      toast.success("Contact email saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      setEmail(value);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex items-center gap-1">
      <Input
        type="email"
        aria-label="Studio contact email"
        className="h-8 w-52 text-xs"
        placeholder={forwardTo ? `Forwarding: ${forwardTo}` : "No email on file"}
        value={email}
        disabled={busy}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
      />
      {!email && !forwardTo && <span className="text-[10px] uppercase tracking-wide text-destructive">Missing</span>}
    </div>
  );
}

function ListingsTab() {
  const qc = useQueryClient();
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => getMyRoles() });
  const isSuper = roles?.isSuperAdmin === true;
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "unpublished" | "no_email">("all");
  const [page, setPage] = useState(1);
  const pageSize = 100;
  useEffect(() => { setPage(1); }, [q, status]);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-listings", q, status, page],
    queryFn: () => listAllProviders({ data: { q, status, page, pageSize } }),
  });
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const setPlan = useServerFn(setProviderPlan);
  const setPublished = useServerFn(setProviderPublished);
  async function changePublished(placeId: string, published: boolean) {
    try {
      await setPublished({ data: { placeId, published } });
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success(published ? "Studio published" : "Studio unpublished");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  const exportCsv = useServerFn(exportProvidersCsv);
  const [exporting, setExporting] = useState(false);
  async function changePlan(placeId: string, plan: "free" | "premium") {
    try { await setPlan({ data: { placeId, plan } }); qc.invalidateQueries({ queryKey: ["admin-listings"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  async function downloadCsv() {
    setExporting(true);
    try {
      const res = await exportCsv();
      const blob = new Blob([`\uFEFF${res.csv}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `intearior-studios-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${res.count.toLocaleString()} studios`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name…" className="max-w-sm" aria-label="Search studios" />
        <div className="flex rounded-md border border-border p-0.5">
          {(["all", "published", "unpublished", "no_email"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded px-3 py-1 text-xs capitalize ${status === s ? "bg-secondary font-medium" : "text-muted-foreground"}`}
            >
              {s === "no_email" ? "No contact email" : s}
            </button>
          ))}
        </div>
        {data && <span className="text-xs text-muted-foreground">Showing {from}–{to} of {total.toLocaleString()}</span>}
        <Button size="sm" variant="outline" onClick={downloadCsv} disabled={exporting} className="ml-auto">
          {exporting ? "Preparing…" : "Download CSV"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Claimed and verified status is automatic: a studio becomes verified and goes live the moment its claim is approved. You can still disable or re-publish any studio manually below.{" "}
        <strong className="font-medium text-foreground">Plan</strong> drives featured placement automatically: premium studios are pinned to the front of the homepage row and ranked first in Get Matched.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-2">Name</th><th>City</th><th>Contact email</th><th>Claimed</th><th>Verified</th><th>Published</th><th>Plan</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && data?.providers.length === 0 && (
              <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No studios match.</td></tr>
            )}
            {data?.providers.map((p) => (
              <tr key={p.place_id} className="border-t border-border">
                <td className="p-2">
                  <span>{p.name}</span>
                  {!p.published && <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Unpublished</span>}
                </td>
                <td>{p.city}</td>
                <td className="py-1 pr-2">
                  <ContactEmailCell
                    placeId={p.place_id}
                    value={(p.email as string | null) ?? ""}
                    forwardTo={(p.email_forward_to as string | null) ?? ""}
                  />
                </td>
                <td>{p.claimed_by ? "✓" : "—"}</td>
                <td className="text-xs">{p.is_verified ? "Verified" : "—"}</td>
                <td>
                  <select
                    aria-label="Published"
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    value={p.published ? "live" : "hidden"}
                    onChange={(e) => changePublished(p.place_id, e.target.value === "live")}
                  >
                    <option value="live">Live</option>
                    <option value="hidden">Disabled</option>
                  </select>
                </td>
                <td>
                  <select
                    aria-label="Plan"
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    value={p.plan === "premium" ? "premium" : "free"}
                    onChange={(e) => changePlan(p.place_id, e.target.value as "free" | "premium")}
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                  </select>
                  {p.featured && <span className="ml-2 text-[10px] uppercase tracking-wide text-brand">Featured</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Page {page} of {pageCount}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage((n) => Math.min(pageCount, n + 1))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TeamTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-team"], queryFn: () => listAdmins() });
  const grant = useServerFn(grantRole);
  const revoke = useServerFn(revokeRole);
  const cancel = useServerFn(cancelInvite);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "super_admin">("admin");
  const [busy, setBusy] = useState(false);

  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;
  const canManage = data.isSuperAdmin;

  async function add() {
    setBusy(true);
    try {
      const r = await grant({ data: { email: email.trim(), role } });
      toast.success(r.invited ? "Invite saved — access applies when they sign up" : "Access granted");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin-team"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(userId: string, r: string) {
    try {
      await revoke({ data: { userId, role: r as "admin" | "super_admin" } });
      toast.success("Access removed");
      qc.invalidateQueries({ queryKey: ["admin-team"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      {canManage ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-xl">Add a team member</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            They get access right away if they already have an account — otherwise the moment they sign up with this email.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="max-w-sm" maxLength={255} />
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "super_admin")}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={add} disabled={busy || !/.+@.+\..+/.test(email)}>Grant access</Button>
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Only a super admin can add or remove team members.
        </p>
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-xl">Team access</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-2">Person</th><th>Role</th><th>Granted</th><th /></tr>
            </thead>
            <tbody>
              {data.members.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="p-2">
                    <span className="font-medium">{m.name ?? m.email ?? "Unknown user"}</span>
                    {m.name && m.email && <span className="ml-2 text-xs text-muted-foreground">{m.email}</span>}
                    {m.isMe && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                  </td>
                  <td>{m.role === "super_admin" ? "Super admin" : "Admin"}</td>
                  <td>{new Date(m.grantedAt).toLocaleDateString()}</td>
                  <td className="text-right">
                    {canManage && !m.isMe && (
                      <Button size="sm" variant="outline" onClick={() => remove(m.userId, m.role)}>Remove</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.invites.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-xl">Pending invites</h3>
          <ul className="mt-4 space-y-2">
            {data.invites.map((i) => (
              <li key={i.id} className="flex items-center justify-between border-b border-border py-2 text-sm">
                <span>{i.email} · {i.role === "super_admin" ? "Super admin" : "Admin"}</span>
                {canManage && (
                  <Button size="sm" variant="ghost" onClick={async () => {
                    try { await cancel({ data: { id: i.id } }); qc.invalidateQueries({ queryKey: ["admin-team"] }); }
                    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
                  }}>Cancel</Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
