import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listFavorites } from "@/lib/user-actions.functions";
import { ProviderCard } from "@/components/provider-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_site/favorites")({
  head: () => ({ meta: [{ title: "My Favorites | Texas Aesthetics" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSignedIn(!!data.session); setReady(true); });
  }, []);
  const fetchFavs = useServerFn(listFavorites);
  const { data } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => fetchFavs(),
    enabled: ready && signedIn,
  });

  if (!ready) return <div className="mx-auto max-w-7xl px-4 py-12">Loading…</div>;
  if (!signedIn) return (
    <div className="mx-auto max-w-md py-24 text-center px-4">
      <h1 className="font-display text-3xl">Sign in to view favorites</h1>
      <Button asChild className="mt-6"><Link to="/login">Sign in</Link></Button>
    </div>
  );
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-display text-4xl">Your favorites</h1>
      {data && data.providers.length === 0 && <p className="mt-4 text-muted-foreground">You haven't favorited any providers yet.</p>}
      {data && data.providers.length > 0 && (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.providers.map((p) => <ProviderCard key={p.place_id} {...p} />)}
        </div>
      )}
    </div>
  );
}
