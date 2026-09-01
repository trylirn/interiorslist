import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { listMyListings, listMyReviews, getMyOnboardingStatus, listMyClaims } from "@/lib/owner.functions";
import { respondToReview, listReviewResponses } from "@/lib/brand-extra.functions";
import { getMyRoles } from "@/lib/role.functions";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard-shell";
import { LeadsInbox } from "@/components/leads-inbox";
import { AccountSettings } from "@/components/account-settings";
import { Star, ExternalLink, Building2, Shield, Clock, Inbox, MessageSquare, FileCheck2, Settings } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | Intearior" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>) => z.object({ tab: z.string().optional() }).parse(s),
  component: Dashboard,
});

const NAV: DashboardNavItem[] = [
  { key: "listings", label: "My Listings", icon: Building2 },
  { key: "leads", label: "Leads", icon: Inbox },
  { key: "reviews", label: "Reviews", icon: MessageSquare },
  { key: "claims", label: "Claims", icon: FileCheck2 },
  { key: "settings", label: "Settings", icon: Settings },
];

function Dashboard() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setEmail(data.session?.user.email ?? null); setReady(true); });
  }, []);
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => getMyRoles(), enabled: !!email });
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["my-listings"], queryFn: () => listMyListings(), enabled: !!email,
  });
  const ownsListings = (listingsData?.listings.length ?? 0) > 0;
  const { data: onboarding } = useQuery({ queryKey: ["my-onboarding"], queryFn: () => getMyOnboardingStatus(), enabled: !!email });

  const active = NAV.some((n) => n.key === tab) ? (tab as string) : "listings";
  const setActive = (key: string) => navigate({ to: "/dashboard", search: { tab: key } });

  if (!ready) return <div className="mx-auto max-w-2xl px-4 py-16"><p className="text-muted-foreground">Loading…</p></div>;
  if (!email) return (
    <div className="mx-auto max-w-md py-24 text-center px-4">
      <h1 className="font-display text-3xl">Please sign in</h1>
      <Button asChild className="mt-6"><Link to="/login">Sign in</Link></Button>
    </div>
  );

  if (!listingsLoading && !ownsListings) {
    return (
      <DashboardShell
        title="Dashboard"
        subtitle={<span className="truncate">Signed in as {email}</span>}
        items={[{ key: "claims", label: "Claims", icon: FileCheck2 }, { key: "settings", label: "Settings", icon: Settings }]}
        active={active === "settings" ? "settings" : "claims"}
        onSelect={setActive}
      >
        {onboarding && !roles?.isAdmin && <OnboardingBanner status={onboarding} />}
        {active === "settings" ? (
          <AccountSettings email={email} canClose={!roles?.isSuperAdmin} />
        ) : (
          <>
            <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
              <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="mt-3 font-display text-2xl">
                {roles?.isAdmin ? "You're signed in as an admin" : "You don't manage any listings yet"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {roles?.isAdmin
                  ? "The brand dashboard is for studio owners. Head to the admin console to manage the site."
                  : "Are you a studio owner? Find your business and claim it, or submit a new listing."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {roles?.isAdmin ? (
                  <Button asChild><Link to="/admin"><Shield className="mr-2 h-4 w-4" />Open admin</Link></Button>
                ) : (
                  <>
                    <Button asChild><Link to="/search">Find your listing</Link></Button>
                    <Button asChild variant="outline"><Link to="/submit">Submit a business</Link></Button>
                  </>
                )}
              </div>
            </div>
            <div className="mt-8">
              <h2 className="font-display text-2xl">Your claims</h2>
              <div className="mt-4"><ClaimsTab /></div>
            </div>
          </>
        )}
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Dashboard"
      subtitle={<span className="truncate">Signed in as {email}</span>}
      items={NAV}
      active={active}
      onSelect={setActive}
      extraNav={roles?.isAdmin ? (
        <Link to="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
          <Shield className="h-4 w-4" />Admin console
        </Link>
      ) : undefined}
    >
      {onboarding && !roles?.isAdmin && <OnboardingBanner status={onboarding} />}
      {listingsLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <>
          {active === "listings" && <ListingsTab />}
          {active === "leads" && <LeadsInbox />}
          {active === "reviews" && <ReviewsTab />}
          {active === "claims" && <ClaimsTab />}
          {active === "settings" && (roles?.isSuperAdmin
            ? <p className="text-sm text-muted-foreground">Super admin accounts can't be closed from the dashboard.</p>
            : <CloseAccount />)}
        </>
      )}
    </DashboardShell>
  );
}


function CloseAccount() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const del = useServerFn(deleteMyAccount);

  async function onDelete() {
    setBusy(true);
    try {
      await del({ data: undefined as never });
      await supabase.auth.signOut();
      toast.success("Your account has been closed");
      window.location.href = "/";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not close account");
      setBusy(false);
    }
  }

  return (
    <div className="mt-16 rounded-3xl border border-destructive/40 bg-destructive/5 p-6">
      <h2 className="font-display text-xl text-destructive">Close account</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Closing your account permanently removes your profile, saved details, claims and reviews. Any studio listing
        you claimed is released back to unclaimed — the listing itself stays in the directory. This cannot be undone.
      </p>
      {!open ? (
        <Button variant="outline" className="mt-4 border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => setOpen(true)}>
          Close my account
        </Button>
      ) : (
        <div className="mt-4 max-w-sm space-y-3">
          <label className="block text-sm font-medium">Type <span className="font-mono">DELETE</span> to confirm</label>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="DELETE"
          />
          <div className="flex gap-2">
            <Button variant="destructive" disabled={confirm !== "DELETE" || busy} onClick={onDelete}>
              {busy ? "Closing…" : "Permanently close account"}
            </Button>
            <Button variant="ghost" onClick={() => { setOpen(false); setConfirm(""); }}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}



function ClaimsTab() {
  const { data, isLoading } = useQuery({ queryKey: ["my-claims"], queryFn: () => listMyClaims() });
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const claims = data?.claims ?? [];
  if (!claims.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        No claims yet. Find your studio in the directory and claim it to manage the listing.
      </p>
    );
  }
  const label: Record<string, string> = {
    pending: "Pending review",
    needs_info: "More info needed",
    approved: "Approved",
    rejected: "Not approved",
  };
  return (
    <div className="space-y-3">
      {claims.map((c) => (
        <div key={c.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{c.provider?.name ?? c.provider_place_id}</p>
              <p className="text-xs text-muted-foreground">
                {c.provider ? `${c.provider.city}, ${c.provider.state} · ` : ""}
                {label[c.status] ?? c.status} · {new Date(c.submitted_at).toLocaleDateString()}
              </p>
              {c.decision_reason && <p className="mt-2 whitespace-pre-line text-sm">{c.decision_reason}</p>}
            </div>
            <Button asChild size="sm" variant={c.status === "needs_info" ? "default" : "outline"}>
              <Link to="/claim/status/$id" params={{ id: c.id }} search={{ token: c.access_token as string }}>
                {c.status === "needs_info" ? "Send proof" : "View claim"}
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

type Onboarding = Awaited<ReturnType<typeof getMyOnboardingStatus>>;

function OnboardingBanner({ status }: { status: Onboarding }) {
  const pendingClaim = status.pendingClaims.length > 0;
  const pendingSub = status.pendingSubmissions.length > 0;

  if (pendingClaim || pendingSub) {
    return (
      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-5">
        <Clock className="h-5 w-5 shrink-0 text-brand" />
        <div className="min-w-[16rem] flex-1">
          <p className="font-medium">
            {pendingClaim ? "Your claim is under review" : "Your listing is under review"}
          </p>
          <p className="text-sm text-muted-foreground">
            Our team verifies every {pendingClaim ? "claim" : "submission"} — usually within 1–2 business days. You'll get access to manage the listing as soon as it's approved.
          </p>
        </div>
      </div>
    );
  }

  if (status.listingCount === 0 || !status.profileComplete) {
    return (
      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-5">
        <Building2 className="h-5 w-5 shrink-0 text-brand" />
        <div className="min-w-[16rem] flex-1">
          <p className="font-medium">Finish setting up your studio profile</p>
          <p className="text-sm text-muted-foreground">
            Claim your studio or submit it, then add services, photos, credentials and FAQs so clients can find you.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm"><Link to="/claim">Claim your listing</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to="/submit">Submit a business</Link></Button>
        </div>
      </div>
    );
  }
  return null;
}

function ListingsTab() {
  const { data, isLoading } = useQuery({ queryKey: ["my-listings"], queryFn: () => listMyListings() });
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const listings = data?.listings ?? [];
  if (!listings.length) return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
      <h3 className="mt-3 font-display text-xl">No claimed listings yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">Find your studio and claim it to manage your profile.</p>
      <Button asChild className="mt-6"><Link to="/search">Find your listing</Link></Button>
    </div>
  );
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {listings.map((l) => (
        <div key={l.place_id} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-lg">{l.name}</h3>
          <p className="text-sm text-muted-foreground">{l.city}</p>
          {l.services && l.services.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">{l.services.slice(0, 4).join(" · ")}</p>
          )}
          <div className="mt-4 flex gap-2">
            <Button asChild size="sm"><Link to="/dashboard/listing/$placeId" params={{ placeId: l.place_id }}>Manage</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/provider/$slug" params={{ slug: l.slug }}>View</Link></Button>
          </div>
        </div>
      ))}
    </div>
  );
}


function ReviewsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-reviews"], queryFn: () => listMyReviews() });
  const reviews = data?.reviews ?? [];
  const ids = reviews.map((r) => r.id);
  const { data: respData } = useQuery({
    queryKey: ["my-reviews-responses", ids.join(",")],
    queryFn: () => listReviewResponses({ data: { reviewIds: ids } }),
    enabled: ids.length > 0,
  });
  const respond = useServerFn(respondToReview);
  const respMap = new Map((respData?.responses ?? []).map((r) => [r.review_id, r.body]));

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!reviews.length) return <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No reviews yet on your listings.</p>;

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} existingResponse={respMap.get(r.id) ?? ""} onSave={async (body) => {
          try { await respond({ data: { reviewId: r.id, body } }); toast.success("Response posted"); qc.invalidateQueries({ queryKey: ["my-reviews-responses", ids.join(",")] }); }
          catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
        }} />
      ))}
    </div>
  );
}

function ReviewCard({ review: r, existingResponse, onSave }: { review: { id: string; author_name: string | null; rating: number | null; text: string | null; providerName?: string }; existingResponse: string; onSave: (body: string) => Promise<void>; }) {
  const [body, setBody] = useState(existingResponse);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setBody(existingResponse); }, [existingResponse]);
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <p className="font-medium">{r.author_name ?? "Anonymous"}</p>
        <span className="flex items-center gap-0.5 text-amber-500">
          {Array.from({ length: r.rating ?? 0 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
        </span>
        {r.providerName && <span className="text-xs text-muted-foreground flex items-center gap-1"><ExternalLink className="h-3 w-3" />{r.providerName}</span>}
      </div>
      {r.text && <p className="mt-3 text-sm">{r.text}</p>}
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Your response</p>
        <Textarea className="mt-2 min-h-20" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Thanks for your feedback…" maxLength={2000} />
        <Button size="sm" className="mt-2" disabled={busy || body.trim().length < 2} onClick={async () => { setBusy(true); await onSave(body.trim()); setBusy(false); }}>
          {busy ? "Saving…" : existingResponse ? "Update response" : "Post response"}
        </Button>
      </div>
    </div>
  );
}
