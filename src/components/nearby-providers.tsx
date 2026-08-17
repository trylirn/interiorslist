import { useQuery } from "@tanstack/react-query";
import { getNearbyProviders } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";

export function NearbyProviders({ placeId }: { placeId: string }) {
  const { data } = useQuery({
    queryKey: ["nearby-providers", placeId],
    queryFn: () => getNearbyProviders({ data: { placeId } }),
    enabled: !!placeId,
  });
  const providers = data?.providers ?? [];
  if (providers.length === 0) return null;
  return (
    <section className="mt-12 border-t border-border/60 pt-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">Nearby</p>
      <h2 className="mt-2 font-display text-3xl md:text-4xl">Nearby Studios</h2>
      <p className="mt-2 text-sm text-muted-foreground">The closest verified design studios to this location.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {providers.map((p: any) => <ProviderCard key={p.place_id} {...p} />)}
      </div>
    </section>
  );
}
