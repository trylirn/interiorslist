import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { listCities } from "@/lib/providers.functions";

/** "Find a studio near you" block shown at the bottom of every article. */
export function BlogLocationCta({ limit = 9 }: { limit?: number }) {
  const { data } = useQuery({
    queryKey: ["browse-cities-all"],
    queryFn: () => listCities({ data: {} }),
    staleTime: 30 * 60 * 1000,
  });
  const cities = [...(data?.cities ?? [])].sort((a, b) => b.count - a.count).slice(0, limit);

  return (
    <section className="mt-16 space-y-6">
      {cities.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-display text-2xl">Find Interior Designers Near You</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Browse vetted interior design studios in your city.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((c) => (
              <Link
                key={`${c.state}-${c.slug}`}
                to="/designers/$state/$city"
                params={{ state: c.state.toLowerCase(), city: c.slug }}
                className="text-sm font-medium text-brand hover:underline"
              >
                {c.name}
                {c.state ? `, ${c.state}` : ""}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-3xl border border-brand/20 bg-brand/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
            <Search className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-xl">Find studios near you</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Compare interior design studios, styles and typical project costs in your area.
            </p>
          </div>
        </div>
        <Link
          to="/search"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-medium text-brand-foreground transition hover:opacity-90"
        >
          Search studios
        </Link>
      </div>
    </section>
  );
}
