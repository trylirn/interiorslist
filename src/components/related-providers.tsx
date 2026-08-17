import { useQuery } from "@tanstack/react-query";
import { getRelatedProviders } from "@/lib/providers.functions";
import { ProviderCard } from "@/components/provider-card";

export function RelatedProviders({ placeId }: { placeId: string }) {
  const { data } = useQuery({
    queryKey: ["related-providers", placeId],
    queryFn: () => getRelatedProviders({ data: { placeId, limit: 8 } }),
    enabled: !!placeId,
  });
  const providers = data?.providers ?? [];
  if (providers.length === 0) return null;
  return (
    <section className="mt-12 border-t border-border/60 pt-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">More options</p>
      <h2 className="mt-2 font-display text-3xl md:text-4xl">You may also be interested in</h2>
      <p className="mt-2 text-sm text-muted-foreground">Verified design studios with similar services in the same area.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {providers.map((p) => <ProviderCard key={p.place_id} {...p} />)}
      </div>
    </section>
  );
}
