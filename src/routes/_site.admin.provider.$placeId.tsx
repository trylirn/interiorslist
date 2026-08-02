import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles } from "@/lib/role.functions";
import { ListingManager } from "@/components/listing-manager";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_site/admin/provider/$placeId")({
  head: () => ({ meta: [{ title: "Provider dashboard (admin) | Texas Aesthetics" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminProviderDashboard,
});

function AdminProviderDashboard() {
  const { placeId } = Route.useParams();
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setAuthed(!!data.session); setReady(true); });
  }, []);
  const { data: roles, isLoading } = useQuery({ queryKey: ["my-roles"], queryFn: () => getMyRoles(), enabled: authed });

  if (!ready || (authed && isLoading)) return <div className="mx-auto max-w-3xl px-4 py-16"><p className="text-muted-foreground">Loading…</p></div>;
  if (!authed || !roles?.isAdmin) {
    return (
      <div className="mx-auto max-w-md py-24 text-center px-4">
        <h1 className="font-display text-3xl">Admin only</h1>
        <Button asChild className="mt-6"><Link to="/login">Sign in</Link></Button>
      </div>
    );
  }
  return <ListingManager placeId={placeId} admin />;
}
