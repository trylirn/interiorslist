import { useQuery } from "@tanstack/react-query";
import { getToolDemand } from "@/lib/cost.functions";
import { COST_TOPICS } from "@/lib/cost-content";
import { ROOMS, SCOPES, US_STATES } from "@/lib/cost-model";

/**
 * Admin view: which tool combinations visitors actually use, so new indexable
 * pages are built from demand rather than guesswork.
 */
export function ToolDemand() {
  const { data, isLoading } = useQuery({ queryKey: ["tool-demand"], queryFn: () => getToolDemand() });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data) return <p className="text-muted-foreground">No tool usage recorded yet.</p>;

  const label = (list: { slug: string; label: string }[], slug: string) =>
    list.find((x) => x.slug === slug)?.label ?? slug;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-2xl">Tool demand</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.total.toLocaleString()} anonymous tool interactions. No visitor identifiers are stored.
        </p>
      </div>

      <Section title="By tool">
        <ul className="space-y-2 text-sm">
          {data.byTool.map((t) => (
            <Row key={t.key} left={t.key} right={t.count} />
          ))}
        </ul>
      </Section>

      <Section title="Most requested combinations">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="py-2">Room</th>
                <th className="py-2">Scope</th>
                <th className="py-2">State</th>
                <th className="py-2">Uses</th>
                <th className="py-2">Page exists?</th>
              </tr>
            </thead>
            <tbody>
              {data.combos.map((c) => {
                const has = COST_TOPICS.some((t) => t.room === c.room && t.scope === c.scope);
                return (
                  <tr key={`${c.room}-${c.scope}-${c.state}`} className="border-b border-border/60">
                    <td className="py-2">{label(ROOMS, c.room)}</td>
                    <td className="py-2">{label(SCOPES, c.scope)}</td>
                    <td className="py-2">{c.state}</td>
                    <td className="py-2 tabular-nums">{c.count}</td>
                    <td className="py-2">
                      {has ? (
                        <span className="text-muted-foreground">Yes</span>
                      ) : (
                        <span className="font-medium text-brand">Build one</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {data.combos.length === 0 && (
                <tr><td className="py-3 text-muted-foreground" colSpan={5}>Nothing recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-8 md:grid-cols-2">
        <Section title="Top states">
          <ul className="space-y-2 text-sm">
            {data.byState.map((s) => (
              <Row key={s.key} left={US_STATES.find((x) => x.code === s.key)?.name ?? s.key} right={s.count} />
            ))}
            {data.byState.length === 0 && <li className="text-muted-foreground">Nothing yet.</li>}
          </ul>
        </Section>
        <Section title="Top styles">
          <ul className="space-y-2 text-sm">
            {data.byStyle.map((s) => <Row key={s.key} left={s.key} right={s.count} />)}
            {data.byStyle.length === 0 && <li className="text-muted-foreground">Nothing yet.</li>}
          </ul>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground/70">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({ left, right }: { left: string; right: number }) {
  return (
    <li className="flex items-center justify-between border-b border-border/60 pb-1.5">
      <span className="capitalize">{left.replace(/-/g, " ")}</span>
      <span className="tabular-nums text-muted-foreground">{right}</span>
    </li>
  );
}
