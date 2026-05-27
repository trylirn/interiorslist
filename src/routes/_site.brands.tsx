import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listBrands } from "@/lib/providers.functions";
import { Building2 } from "lucide-react";

const opts = queryOptions({ queryKey: ["brands"], queryFn: () => listBrands() });

export const Route = createFileRoute("/_site/brands")({
  head: () => ({
    meta: [
      { title: "Multi-Location Brands | Texas Aesthetics" },
      { name: "description", content: "Browse aesthetic injector brands with multiple Texas locations." },
      { property: "og:title", content: "Texas Aesthetic Brands" },
      { property: "og:description", content: "Multi-location injector brands across Texas." },
      { property: "og:url", content: "/brands" },
    ],
    links: [{ rel: "canonical", href: "/brands" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  component: BrandsPage,
});

function BrandsPage() {
  const { data } = useSuspenseQuery(opts);
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-display text-4xl md:text-5xl">Multi-location brands</h1>
      <p className="mt-2 text-muted-foreground">Aesthetic injector brands with multiple verified Texas branches.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.brands.map((b) => (
          <Link key={b.id} to="/brand/$slug" params={{ slug: b.slug }} className="rounded-2xl border border-border bg-card p-6 transition hover:border-brand hover:shadow-md">
            <Building2 className="h-6 w-6 text-brand" />
            <h3 className="mt-3 font-display text-xl">{b.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{b.branchCount} locations</p>
          </Link>
        ))}
        {data.brands.length === 0 && <p className="text-muted-foreground">No multi-location brands yet.</p>}
      </div>
    </div>
  );
}
