import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { STYLES } from "@/lib/cities";
import {
  ROOMS, SCOPES, US_STATES, estimate, money, moneyExact,
  type RoomSlug, type ScopeSlug,
} from "@/lib/cost-model";
import { logToolUsage } from "@/lib/tool-usage";

const STORE_KEY = "intearior_estimate";

type Saved = { room: RoomSlug; sqft: number; scope: ScopeSlug; style: string; state: string };

function load(): Partial<Saved> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function BudgetEstimator({
  defaultState,
  defaultRoom,
  defaultScope,
  compact,
}: {
  defaultState?: string;
  defaultRoom?: RoomSlug;
  defaultScope?: ScopeSlug;
  compact?: boolean;
}) {
  const saved = useMemo(load, []);
  const [room, setRoom] = useState<RoomSlug>(defaultRoom ?? (saved.room as RoomSlug) ?? "kitchen");
  const [sqft, setSqft] = useState<string>(
    String(saved.sqft ?? ROOMS.find((r) => r.slug === (defaultRoom ?? "kitchen"))?.typicalSqFt ?? 200),
  );
  const [scope, setScope] = useState<ScopeSlug>(defaultScope ?? (saved.scope as ScopeSlug) ?? "remodel");
  const [style, setStyle] = useState<string>(saved.style ?? "transitional");
  const [stateCode, setStateCode] = useState<string>(defaultState ?? saved.state ?? "");
  const [result, setResult] = useState<ReturnType<typeof estimate> | null>(null);

  function onRoom(next: RoomSlug) {
    setRoom(next);
    const typical = ROOMS.find((r) => r.slug === next)?.typicalSqFt;
    if (typical) setSqft(String(typical));
  }

  function run() {
    const n = Number(sqft) || ROOMS.find((r) => r.slug === room)!.typicalSqFt;
    const out = estimate({ room, sqft: n, scope, style, stateCode: stateCode || undefined });
    setResult(out);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ room, sqft: n, scope, style, state: stateCode }));
    } catch {
      /* private browsing */
    }
    logToolUsage({
      tool: "budget-estimator",
      room_type: room,
      scope,
      state_code: stateCode || undefined,
      style_slug: style,
      budget_band: bandFor(out.typical),
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Room or area">
          <Select value={room} onValueChange={(v) => onRoom(v as RoomSlug)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROOMS.map((r) => <SelectItem key={r.slug} value={r.slug}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Approximate size (sq ft)">
          <Input
            type="number" min={20} max={20000} inputMode="numeric"
            value={sqft} onChange={(e) => setSqft(e.target.value)}
          />
        </Field>

        <Field label="Scope of work">
          <Select value={scope} onValueChange={(v) => setScope(v as ScopeSlug)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SCOPES.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {SCOPES.find((s) => s.slug === scope)?.desc}
          </p>
        </Field>

        <Field label="Style / finish level">
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              {STYLES.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        <Field label="State">
          <Select value={stateCode || "none"} onValueChange={(v) => setStateCode(v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="National average" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="none">National average</SelectItem>
              {US_STATES.map((s) => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        <div className="flex items-end">
          <Button className="w-full rounded-none" onClick={run}>Estimate my project</Button>
        </div>
      </div>

      {result && (
        <div className="border-t border-border p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Figure label="Lower end" value={moneyExact(result.low)} />
            <Figure label="Most likely" value={moneyExact(result.typical)} highlight />
            <Figure label="Upper end" value={moneyExact(result.high)} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Roughly {money(result.perSqFt.low)}–{money(result.perSqFt.high)} per square foot for this
            combination.
          </p>

          <h3 className="mt-6 text-xs font-semibold uppercase tracking-widest text-foreground/70">
            Where the money goes
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {result.breakdown.map((b) => (
              <li key={b.label} className="flex items-center justify-between border-b border-border/60 pb-2">
                <span>{b.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {moneyExact(b.low)} – {moneyExact(b.high)}
                </span>
              </li>
            ))}
          </ul>

          <h3 className="mt-6 text-xs font-semibold uppercase tracking-widest text-foreground/70">
            What drives this number
          </h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {result.drivers.map((d) => <li key={d}>{d}</li>)}
          </ul>

          <p className="mt-6 rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground">
            This is a directory estimate, not a quote. It is built from typical published US design and
            remodelling ranges, adjusted for your room, scope, finish level and state. Real quotes vary with
            site conditions, structural work, lead times and the studio you hire.
          </p>

          {!compact && (
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild className="rounded-none"><Link to="/match">Get matched with 3 studios</Link></Button>
              <Button asChild variant="outline" className="rounded-none"><Link to="/search">Browse studios</Link></Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function bandFor(n: number): string {
  if (n < 10000) return "under-10k";
  if (n < 25000) return "10-25k";
  if (n < 75000) return "25-75k";
  if (n < 150000) return "75-150k";
  return "150k-plus";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-widest text-foreground/70">{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Figure({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`border p-4 ${highlight ? "border-brand bg-brand/5" : "border-border"}`}>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
