import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { MapPin, BadgeCheck, Building2 } from "lucide-react";
import { CompareButton } from "@/components/compare-button";
import { trackImpressions, trackListingClick } from "@/lib/analytics";

export type ProviderCardProps = {
  place_id: string;
  slug: string;
  name: string;
  city: string;
  city_slug?: string | null;
  address?: string | null;
  services?: string[] | null;
  specialists?: string | null;
  branch_label?: string | null;
  brand_id?: string | null;
  logo_url?: string | null;
  is_verified?: boolean | null;
};

export function ProviderCard(p: ProviderCardProps) {
  useEffect(() => {
    if (p.place_id) trackImpressions([p.place_id], p.city_slug ?? undefined);
  }, [p.place_id, p.city_slug]);
  return (
    <div className="relative">
      <CompareButton
        place_id={p.place_id}
        slug={p.slug}
        name={p.name}
        city={p.city}
        specialists={p.specialists}
        branch_label={p.branch_label}
        services={p.services}
      />
      <Link
        to="/provider/$slug"
        params={{ slug: p.slug }}
        onClick={() => trackListingClick(p.place_id, p.city_slug ?? undefined)}
        className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-lg"
      >
        <div className="flex items-start gap-3 pr-20">
          {p.logo_url && (
            <img
              src={p.logo_url}
              alt={`${p.name} logo`}
              loading="lazy"
              className="h-10 w-10 shrink-0 rounded-lg border border-border bg-background object-contain"
            />
          )}
          <div>
            <h3 className="font-display text-lg leading-tight">{p.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {p.branch_label && (
                <span className="flex items-center gap-1 text-xs text-brand">
                  <Building2 className="h-3 w-3" /> {p.branch_label}
                </span>
              )}
              {p.is_verified && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">{p.address || p.city}</span>
        </div>
        {p.specialists && (
          <p className="line-clamp-2 text-sm text-foreground/80">{p.specialists}</p>
        )}
        {p.services && p.services.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-1">
            {p.services.slice(0, 4).map((s) => (
              <span key={s} className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground capitalize">
                {s.replace(/-/g, " ")}
              </span>
            ))}
          </div>
        )}
      </Link>
    </div>
  );
}
