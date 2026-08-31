import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyLeads, updateLeadStatus } from "@/lib/owner.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Mail, Phone, Search } from "lucide-react";
import { toast } from "sonner";

type Lead = Awaited<ReturnType<typeof listMyLeads>>["leads"][number];

const STATUSES = ["new", "contacted", "closed"] as const;
type Status = (typeof STATUSES)[number];

/** A lead that carries the quiz brief fields came through Get Matched. */
function sourceOf(l: Lead) {
  return l.project_type || l.budget || l.style || l.timeline ? "Get Matched" : "Studio page";
}

function csvEscape(v: string | null | undefined) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

export function LeadsInbox({ placeId }: { placeId?: string }) {
  const qc = useQueryClient();
  const queryKey = ["leads-inbox", placeId ?? "all"];
  const { data, isLoading } = useQuery({ queryKey, queryFn: () => listMyLeads({ data: placeId ? { placeId } : undefined }) });
  const updateStatus = useServerFn(updateLeadStatus);

  const [status, setStatus] = useState<string>("all");
  const [listing, setListing] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [range, setRange] = useState<string>("all");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(50);

  const leads = useMemo(() => data?.leads ?? [], [data]);
  const listings = data?.listings ?? [];

  const counts = useMemo(() => {
    const now = Date.now();
    return {
      total: leads.length,
      new: leads.filter((l) => l.status === "new").length,
      contacted: leads.filter((l) => l.status === "contacted").length,
      closed: leads.filter((l) => l.status === "closed").length,
      last7: leads.filter((l) => now - new Date(l.created_at).getTime() < 7 * 864e5).length,
    };
  }, [leads]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const days = range === "all" ? null : Number(range);
    const now = Date.now();
    return leads.filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (listing !== "all" && l.provider_place_id !== listing) return false;
      if (source !== "all" && sourceOf(l) !== source) return false;
      if (days && now - new Date(l.created_at).getTime() > days * 864e5) return false;
      if (needle) {
        const hay = [l.first_name, l.last_name, l.email, l.phone, l.message, l.location, l.project_type, l.providerName]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [leads, status, listing, source, range, q]);

  async function setLeadStatus(id: string, next: Status) {
    try {
      await updateStatus({ data: { id, status: next } });
      toast.success("Lead updated");
      qc.invalidateQueries({ queryKey });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update lead");
    }
  }

  function exportCsv() {
    const header = [
      "Date", "Studio", "Source", "Status", "First name", "Last name", "Email", "Phone",
      "Location", "Project", "Rooms", "Budget", "Style", "Timeline", "Message",
    ];
    const rows = filtered.map((l) =>
      [
        new Date(l.created_at).toISOString(), l.providerName, sourceOf(l), l.status, l.first_name, l.last_name,
        l.email, l.phone, l.location, l.project_type, l.rooms, l.budget, l.style, l.timeline, l.message,
      ].map(csvEscape).join(","),
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  if (!leads.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        No leads yet. Enquiries from your studio page and from Get Matched will land here.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          ["Total", counts.total],
          ["New", counts.new],
          ["Contacted", counts.contacted],
          ["Closed", counts.closed],
          ["Last 7 days", counts.last7],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-2xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search leads" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        {!placeId && listings.length > 1 && (
          <Select value={listing} onValueChange={setListing}>
            <SelectTrigger><SelectValue placeholder="Listing" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All listings</SelectItem>
              {listings.map((l) => (
                <SelectItem key={l.place_id} value={l.place_id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="Get Matched">Get Matched</SelectItem>
            <SelectItem value="Studio page">Studio page</SelectItem>
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger><SelectValue placeholder="Date" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{filtered.length} lead{filtered.length === 1 ? "" : "s"}</p>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
          <Download className="mr-2 h-4 w-4" />Export CSV
        </Button>
      </div>

      {!filtered.length ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No leads match these filters.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.slice(0, limit).map((l) => (
            <LeadCard key={l.id} lead={l} showStudio={!placeId} onStatus={(s) => setLeadStatus(l.id, s)} />
          ))}
        </div>
      )}

      {filtered.length > limit && (
        <div className="text-center">
          <Button variant="outline" onClick={() => setLimit((n) => n + 50)}>Load more</Button>
        </div>
      )}
    </div>
  );
}

function LeadCard({ lead: l, showStudio, onStatus }: { lead: Lead; showStudio: boolean; onStatus: (s: Status) => void }) {
  const rows: [string, string | null | undefined][] = [
    ["Location", l.location],
    ["Project", l.project_type],
    ["Rooms / focus", l.rooms],
    ["Budget", l.budget],
    ["Style", l.style],
    ["Timeline", l.timeline],
  ];
  const filled = rows.filter(([, v]) => !!v && String(v).trim());
  const badges = [sourceOf(l), l.project_type, l.budget].filter(Boolean) as string[];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate font-medium">{l.first_name} {l.last_name}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <a href={`mailto:${l.email}`} className="flex min-w-0 items-center gap-1 hover:text-brand">
              <Mail className="h-3 w-3 shrink-0" /><span className="truncate">{l.email}</span>
            </a>
            {l.phone && (
              <a href={`tel:${l.phone}`} className="flex items-center gap-1 hover:text-brand">
                <Phone className="h-3 w-3 shrink-0" />{l.phone}
              </a>
            )}
            <span>{new Date(l.created_at).toLocaleDateString()}</span>
            {showStudio && l.providerName && <span className="truncate">· {l.providerName}</span>}
          </div>
        </div>
        <Select value={l.status} onValueChange={(v) => onStatus(v as Status)}>
          <SelectTrigger className="h-9 w-full sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {badges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <span key={b} className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground">{b}</span>
          ))}
        </div>
      )}

      {filled.length > 0 && (
        <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {filled.map(([k, v]) => (
            <div key={k} className="flex gap-2 text-sm">
              <dt className="min-w-24 shrink-0 text-muted-foreground">{k}:</dt>
              <dd className="min-w-0 break-words font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {l.message && (
        <div className="mt-3">
          {filled.length > 0 && <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Client message</p>}
          <p className="mt-1 whitespace-pre-line break-words text-sm">{l.message}</p>
        </div>
      )}
    </div>
  );
}
