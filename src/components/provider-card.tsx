import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { MapPin, BadgeCheck, Building2 } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
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
  is_verified?: boolean | null;
};

export function ProviderCard(p: ProviderCardProps) {
  return (
    <div className="relative">
      <FavoriteButton placeId={p.place_id} />
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
        className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-lg"
      >
        <div className="flex items-start justify-between gap-2 pr-20">
          <div className="min-w-0">
            <h3 className="font-display text-lg leading-tight">{p.name}</h3>
            {p.branch_label && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-brand">
                <Building2 className="h-3 w-3" /> {p.branch_label}
              </p>
            )}
          </div>
          {p.is_verified && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
              <BadgeCheck className="h-3 w-3" /> Verified
            </span>
          )}
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
