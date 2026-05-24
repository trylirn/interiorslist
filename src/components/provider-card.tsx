import { Link } from "@tanstack/react-router";
import { Star, MapPin } from "lucide-react";

export type ProviderCardProps = {
  slug: string;
  name: string;
  city: string;
  address?: string | null;
  rating?: number | null;
  review_count?: number | null;
  services?: string[] | null;
  hero_photo_url?: string | null;
};

export function ProviderCard(p: ProviderCardProps) {
  return (
    <Link
      to="/provider/$slug"
      params={{ slug: p.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
        {p.hero_photo_url ? (
          <img src={p.hero_photo_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-3xl text-muted-foreground">{p.name.charAt(0)}</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-tight">{p.name}</h3>
          {p.rating != null && (
            <div className="flex shrink-0 items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-rating text-rating" />
              <span className="font-medium">{p.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({p.review_count ?? 0})</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">{p.address || p.city}</span>
        </div>
        {p.services && p.services.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {p.services.slice(0, 3).map((s) => (
              <span key={s} className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground capitalize">{s.replace(/-/g, " ")}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
