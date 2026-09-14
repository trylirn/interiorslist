import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listOrphanLeads } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

type Lead = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: string | null;
  created_at: string;
  location: string | null;
  project_type: string | null;
  budget: string | null;
  style: string | null;
  timeline: string | null;
  rooms: string | null;
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function OrphanLeads() {
  const { data, isLoading } = useQuery({ queryKey: ["orphan-leads"], queryFn: () => listOrphanLeads() });
  const [open, setOpen] = useState<string | null>(null);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data || data.studios.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h3 className="font-display text-xl">No unrouted leads</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Every enquiry so far reached a studio with a contact email on file.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm">
        <strong className="font-medium">{data.totalLeads.toLocaleString()}</strong> enquiries across{" "}
        <strong className="font-medium">{data.studios.length.toLocaleString()}</strong> studios that have no contact
        email on file. These are emailed to the admin team instead — follow up by hand or add the studio's email in
        Listings.
      </div>

      <div className="mt-6 space-y-3">
        {data.studios.map((s) => (
          <div key={s.placeId} className="rounded-2xl border border-border bg-card">
            <button
              type="button"
              onClick={() => setOpen(open === s.placeId ? null : s.placeId)}
              className="flex w-full flex-wrap items-center gap-3 p-4 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[s.city, s.state].filter(Boolean).join(", ") || "—"} · {s.claimed ? "Claimed" : "Unclaimed"} · last
                  lead {fmt(s.lastLeadAt)}
                </p>
              </div>
              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                {s.leadCount} {s.leadCount === 1 ? "lead" : "leads"}
              </span>
              <span className="text-xs text-muted-foreground">{open === s.placeId ? "Hide" : "View"}</span>
            </button>

            {open === s.placeId && (
              <div className="space-y-3 border-t border-border p-4">
                {(s.leads as Lead[]).map((l) => (
                  <div key={l.id} className="rounded-xl border border-border p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {[l.first_name, l.last_name].filter(Boolean).join(" ") || "Unnamed"}
                      </span>
                      <span className="text-xs text-muted-foreground">{fmt(l.created_at)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs">
                      {l.email && (
                        <a className="text-brand hover:underline" href={`mailto:${l.email}`}>
                          {l.email}
                        </a>
                      )}
                      {l.phone && (
                        <a className="text-brand hover:underline" href={`tel:${l.phone}`}>
                          {l.phone}
                        </a>
                      )}
                    </div>
                    <dl className="mt-2 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                      {([
                        ["Location", l.location],
                        ["Project", l.project_type],
                        ["Rooms", l.rooms],
                        ["Budget", l.budget],
                        ["Style", l.style],
                        ["Timeline", l.timeline],
                      ] as const)
                        .filter(([, v]) => !!v)
                        .map(([k, v]) => (
                          <div key={k}>
                            <dt className="inline font-medium text-foreground">{k}: </dt>
                            <dd className="inline">{v}</dd>
                          </div>
                        ))}
                    </dl>
                    {l.message && <p className="mt-2 whitespace-pre-wrap text-sm">{l.message}</p>}
                    {l.email && (
                      <Button asChild size="sm" variant="outline" className="mt-3">
                        <a href={`mailto:${l.email}?subject=${encodeURIComponent(`Your enquiry to ${s.name}`)}`}>
                          Reply by email
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
