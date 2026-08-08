import { Link } from "@tanstack/react-router";
import { BadgeCheck, Check, MapPin, Star, Wifi } from "lucide-react";
import { serviceName, styleLabel, projectTypeLabel } from "@/lib/cities";

export type MatchResult = {
  place_id: string;
  slug: string;
  name: string;
  city: string;
  address: string | null;
  services: string[] | null;
  specialists: string | null;
  notes?: string | null;
  branch_label: string | null;
  is_verified: boolean;
  rating?: number | null;
  review_count?: number | null;
  styles?: string[] | null;
  project_types?: string[] | null;
  price_tier?: string | null;
  remote_services?: boolean | null;
  matchedServices?: string[];
  matchedStyles?: string[];
  matchedProjectType?: string | null;
  budgetFit?: boolean;
  matchPercent: number;
};

const TIER_LABEL: Record<string, string> = {
  budget: "Budget-friendly",
  moderate: "Mid-range",
  premium: "Premium",
};

function Chip({ children, on }: { children: React.ReactNode; on?: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] ${
        on ? "bg-brand text-brand-foreground font-medium" : "bg-secondary text-muted-foreground"
      }`}
    >
      {children}
    </span>
  );
}

export function MatchResultCard({
  m,
  selected,
  onToggle,
  selectable,
}: {
  m: MatchResult;
  selected: boolean;
  onToggle: () => void;
  selectable: boolean;
}) {
  const matchedServices = m.matchedServices ?? [];
  const matchedStyles = m.matchedStyles ?? [];
  const otherServices = (m.services ?? []).filter((s) => !matchedServices.includes(s)).slice(0, 2);
  const otherStyles = (m.styles ?? []).filter((s) => !matchedStyles.includes(s)).slice(0, 2);

  const reasons = [
    matchedStyles.length ? `${matchedStyles.map(styleLabel).join(" & ")} work` : null,
    matchedServices.length ? `${matchedServices.slice(0, 2).map(serviceName).join(" and ")}` : null,
    m.matchedProjectType ? projectTypeLabel(m.matchedProjectType).toLowerCase() + " experience" : null,
    m.budgetFit && m.price_tier ? `${(TIER_LABEL[m.price_tier] ?? m.price_tier).toLowerCase()} pricing` : null,
    m.remote_services ? "works remotely" : null,
  ].filter(Boolean) as string[];

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border bg-card p-4 transition ${
        selected ? "border-brand ring-2 ring-brand/30" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-brand-foreground">
          {m.matchPercent}% match
        </span>
        {selectable && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={selected ? `Deselect ${m.name}` : `Select ${m.name}`}
            className={`flex h-6 w-6 items-center justify-center rounded border ${
              selected ? "border-brand bg-brand text-brand-foreground" : "border-border"
            }`}
          >
            {selected && <Check className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      <h3 className="mt-2.5 font-display text-lg leading-tight">
        <Link to="/provider/$slug" params={{ slug: m.slug }} className="hover:text-brand">
          {m.name}
        </Link>
        {m.is_verified && <BadgeCheck className="ml-1.5 inline h-4 w-4 text-brand" />}
      </h3>

      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        {m.branch_label ? `${m.branch_label} · ` : ""}
        {m.address || m.city}
      </p>

      {Boolean(m.rating) && (
        <p className="mt-1 flex items-center gap-1 text-sm">
          <Star className="h-3.5 w-3.5 fill-brand text-brand" />
          <span className="font-medium">{m.rating?.toFixed(1) ?? "—"}</span>
          <span className="text-muted-foreground">({m.review_count ?? 0} reviews)</span>
        </p>
      )}

      {reasons.length > 0 && (
        <p className="mt-2.5 rounded-xl bg-brand/5 px-3 py-1.5 text-xs leading-relaxed">
          <span className="font-semibold">Why this match: </span>
          {reasons.join(", ")}.
        </p>
      )}

      {(matchedStyles.length > 0 || otherStyles.length > 0) && (
        <div className="mt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Styles</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {matchedStyles.map((s) => <Chip key={s} on>{styleLabel(s)}</Chip>)}
            {otherStyles.map((s) => <Chip key={s}>{styleLabel(s)}</Chip>)}
          </div>
        </div>
      )}

      {(matchedServices.length > 0 || otherServices.length > 0) && (
        <div className="mt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Services</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {matchedServices.map((s) => <Chip key={s} on>{serviceName(s)}</Chip>)}
            {otherServices.map((s) => <Chip key={s}>{serviceName(s)}</Chip>)}
          </div>
        </div>
      )}

      {(m.project_types?.length || m.price_tier || m.remote_services) && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {(m.project_types ?? []).slice(0, 3).map((p) => (
            <Chip key={p} on={p === m.matchedProjectType}>{projectTypeLabel(p)}</Chip>
          ))}
          {m.price_tier && <Chip on={m.budgetFit}>{TIER_LABEL[m.price_tier] ?? m.price_tier}</Chip>}
          {m.remote_services && (
            <Chip>
              <Wifi className="mr-1 inline h-3 w-3" />
              Remote-friendly
            </Chip>
          )}
        </div>
      )}

      {m.specialists && <p className="mt-2.5 line-clamp-2 text-xs text-muted-foreground">{m.specialists}</p>}

      <div className="mt-auto pt-3">
        <Link to="/provider/$slug" params={{ slug: m.slug }} className="text-xs font-medium text-brand hover:underline">
          View full profile →
        </Link>
      </div>
    </article>
  );
}
