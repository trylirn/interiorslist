import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { listMyListings, getMyOnboardingStatus, listMyClaims } from "@/lib/owner.functions";
import { getMyRoles } from "@/lib/role.functions";
import { DashboardShell } from "@/components/dashboard-shell";
import { AccountSettings } from "@/components/account-settings";
import { ListingManager } from "@/components/listing-manager";
import { Building2, Clock, FileCheck2, Settings } from "lucide-react";

export const Route = createFileRoute("/_site/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | Intearior" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>) => z.object({ tab: z.string().optional() }).parse(s),
  component: Dashboard,
});

function Dashboard() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setEmail(data.session?.user.email ?? null); setReady(true); });
  }, []);
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => getMyRoles(), enabled: !!email });
  useEffect(() => {
    if (roles?.isAdmin) navigate({ to: "/admin" });
  }, [roles?.isAdmin, navigate]);
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["my-listings"], queryFn: () => listMyListings(), enabled: !!email,
  });
  const { data: onboarding } = useQuery({ queryKey: ["my-onboarding"], queryFn: () => getMyOnboardingStatus(), enabled: !!email });

  const active = tab === "settings" ? "settings" : "claims";
  const setActive = (key: string) => navigate({ to: "/dashboard", search: { tab: key } });

  if (!ready || listingsLoading) return <div className="mx-auto max-w-2xl px-4 py-16"><p className="text-muted-foreground">Loading…</p></div>;
  if (!email) return (
    <div className="mx-auto max-w-md py-24 text-center px-4">
      <h1 className="font-display text-3xl">Please sign in</h1>
      <Button asChild className="mt-6"><Link to="/login">Sign in</Link></Button>
    </div>
  );
  if (roles?.isAdmin) return <div className="mx-auto max-w-2xl px-4 py-16"><p className="text-muted-foreground">Redirecting to admin…</p></div>;

  if (listingsData && listingsData.listings.length > 0) {
    return <ListingManager placeId={listingsData.listings[0].place_id} />;
  }

  return (
    <DashboardShell
      title="Dashboard"
      subtitle={<span className="truncate">Signed in as {email}</span>}
      items={[{ key: "claims", label: "Claims", icon: FileCheck2 }, { key: "settings", label: "Settings", icon: Settings }]}
      active={active}
      onSelect={setActive}
    >
      {onboarding && <OnboardingBanner status={onboarding} />}
      {active === "settings" ? (
        <AccountSettings email={email} canClose={!roles?.isSuperAdmin} />
      ) : (
        <>
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-3 font-display text-2xl">You don't manage any listings yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you a studio owner? Find your business and claim it, or submit a new listing.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild><Link to="/search">Find your listing</Link></Button>
              <Button asChild variant="outline"><Link to="/submit">Submit a business</Link></Button>
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

  if (status.listingCount === 0) {
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
