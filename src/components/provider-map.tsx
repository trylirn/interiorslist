import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { ExternalLink, MapPin } from "lucide-react";

type Props = {
  lat: number | null | undefined;
  lng: number | null | undefined;
  name: string;
  address?: string | null;
  city?: string | null;
};

export function ProviderMap({ lat, lng, name, address, city }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);

  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const query = address ? `${name} ${address}` : city ? `${name} ${city}` : name;
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  useEffect(() => {
    if (!hasCoords || !ref.current) return;
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !ref.current) return;
        const position = { lat: lat as number, lng: lng as number };
        const map = new maps.Map(ref.current, {
          center: position,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        new maps.Marker({ position, map, title: name });
      })
      .catch((e: Error) => !cancelled && setErr(e.message));
    return () => {
      cancelled = true;
    };
  }, [hasCoords, lat, lng, name]);

  return (
    <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
      <h2 className="font-display text-2xl flex items-center gap-2">
        <MapPin className="h-5 w-5 text-brand" /> Location
      </h2>
      {address && (
        <p className="mt-2 text-sm text-muted-foreground">
          {address}
        </p>
      )}
      {hasCoords && !err ? (
        <div ref={ref} className="mt-4 h-[360px] w-full overflow-hidden rounded-xl border border-border bg-secondary/30" />
      ) : (
        <div className="mt-4 flex h-[180px] items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 text-sm text-muted-foreground">
          {err ? "Map unavailable" : "Map location pending"}
        </div>
      )}
      <a
        href={directionsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
      >
        <ExternalLink className="h-4 w-4" /> Get directions
      </a>
    </section>
  );
}
