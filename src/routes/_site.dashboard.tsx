import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { listMyListings, getMyOnboardingStatus, listMyClaims } from "@/lib/owner.functions";
import { getMyRoles } from "@/lib/role.functions";
import { DashboardShell } from "@/components/dashboard-shell";
import { AccountSettings } from "@/components/account-settings";
import { ListingManager } from "@/components/listing-manager";
import { Building2, Clock, FileCheck2, Settings } from "lucide-react";
import { submitPublicBusiness } from "@/lib/submissions.functions";

const PENDING_BUSINESS_KEY = "intearior-pending-business";

export const Route = createFileRoute("/_site/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | Intearior" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>) => z.object({ tab: z.string().optional() }).parse(s),
  component: Dashboard,
});

function Dashboard() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const resumedBusiness = useRef(false);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setEmail(data.session?.user.email ?? null); setReady(true); });
  }, []);
  const { data: roles, isLoading: rolesLoading } = useQuery({ queryKey: ["my-roles"], queryFn: () => getMyRoles(), enabled: !!email });
  useEffect(() => {
    if (roles?.isAdmin) navigate({ to: "/admin" });
  }, [roles?.isAdmin, navigate]);
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["my-listings"], queryFn: () => listMyListings(), enabled: !!email,
  });
  const { data: onboarding, isLoading: onboardingLoading } = useQuery({ queryKey: ["my-onboarding"], queryFn: () => getMyOnboardingStatus(), enabled: !!email });
  const { data: claimsData, isLoading: claimsLoading } = useQuery({
    queryKey: ["my-claims"], queryFn: () => listMyClaims(), enabled: !!email,
  });

  useEffect(() => {
    if (!email || resumedBusiness.current) return;
    const raw = window.localStorage.getItem(PENDING_BUSINESS_KEY);
    if (!raw) return;
    resumedBusiness.current = true;
    void (async () => {
      try {
        const pending = JSON.parse(raw) as {
          businessName: string; city: string; address?: string; website?: string;
          contactEmail: string; contactPhone?: string; notes?: string;
        };
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return;
        await submitPublicBusiness({ data: { ...pending, userId: auth.user.id } });
        window.localStorage.removeItem(PENDING_BUSINESS_KEY);
        await queryClient.invalidateQueries({ queryKey: ["my-onboarding"] });
      } catch (error) {
        console.error("pending business submission failed", error);
        resumedBusiness.current = false;
      }
    })();
  }, [email, queryClient]);

  const active = tab === "settings" ? "settings" : "claims";
  const setActive = (key: string) => navigate({ to: "/dashboard", search: { tab: key } });

  // Wait for roles before showing anything owner-specific, so admins never see the studio setup screen.
  if (!ready || (email && (rolesLoading || listingsLoading || claimsLoading || onboardingLoading)))
    return <div className="mx-auto max-w-2xl px-4 py-16"><p className="text-muted-foreground">Loading…</p></div>;
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

  const openClaim = (claimsData?.claims ?? [])[0] ?? null;
  const anyClaim = (claimsData?.claims ?? []).length > 0;
  const pendingSubmission = (onboarding?.pendingSubmissions ?? [])[0] ?? null;


  return (
    <DashboardShell
      title="Dashboard"
      subtitle={<span className="truncate">Signed in as {email}</span>}
      items={[
        ...(anyClaim ? [{ key: "claims", label: "Claims", icon: FileCheck2 }] : []),
        { key: "settings", label: "Settings", icon: Settings },
      ]}
      active={active}
      onSelect={setActive}
    >
      {active === "settings" ? (
        <AccountSettings email={email} canClose={!roles?.isSuperAdmin} />
      ) : openClaim ? (
        <div>
          <h2 className="font-display text-2xl">Your claims</h2>
          <div className="mt-4"><ClaimsTab /></div>
        </div>
      ) : pendingSubmission ? (
        <div className="mt-8 rounded-3xl border border-brand/30 bg-brand/5 p-8">
          <Clock className="h-8 w-8 text-brand" />
          <h2 className="mt-3 font-display text-2xl">Your business is being verified</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We received <span className="font-medium text-foreground">{pendingSubmission.business_name}</span> on{" "}
            {new Date(pendingSubmission.created_at).toLocaleDateString()}. Our team reviews and verifies every new
            studio — usually within 1–2 business days.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            As soon as it's approved, this page becomes your studio dashboard where you can add your description,
            services, photos, business hours and start receiving client enquiries. We'll email you the moment it's live.
          </p>
        </div>
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
              <Button asChild variant="outline"><Link to="/login" search={{ tab: "business" }}>Submit a business</Link></Button>
            </div>
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

