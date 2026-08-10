import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listStates, listCities } from "@/lib/providers.functions";

const CITY_LIMIT = 60;

function LinkColumns({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
      {children}
    </div>
  );
}

export function BrowseByLocation() {
  const { data: stateData } = useQuery({
    queryKey: ["browse-states"],
    queryFn: () => listStates(),
    staleTime: 30 * 60 * 1000,
  });
  const { data: cityData } = useQuery({
    queryKey: ["browse-cities-all"],
    queryFn: () => listCities({ data: {} }),
    staleTime: 30 * 60 * 1000,
  });

  const states = stateData?.states ?? [];
  const cities = [...(cityData?.cities ?? [])].sort((a, b) => b.count - a.count).slice(0, CITY_LIMIT);

  if (states.length === 0 && cities.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border pt-10">
      <h2 className="font-serif text-2xl tracking-tight">Browse interior designers by location</h2>
      <p className="mt-1 text-sm text-muted-foreground">Find interior designers in your state or city.</p>

      {states.length > 0 && (
        <div className="mt-7">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">By state</h3>
          <LinkColumns>
            {states.map((s) => (
              <Link
                key={s.code}
                to="/designers/$state"
                params={{ state: s.slug }}
                className="text-xs text-muted-foreground transition-colors hover:text-brand"
              >
                Designers in {s.name}
              </Link>
            ))}
          </LinkColumns>
        </div>
      )}

      {cities.length > 0 && (
        <div className="mt-8">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">By city</h3>
          <LinkColumns>
            {cities.map((c) => (
              <Link
                key={`${c.state}-${c.slug}`}
                to="/designers/$state/$city"
                params={{ state: c.state.toLowerCase(), city: c.slug }}
                className="text-xs text-muted-foreground transition-colors hover:text-brand"
              >
                Designers in {c.name}
              </Link>
            ))}
          </LinkColumns>
        </div>
      )}
    </section>
  );
}
