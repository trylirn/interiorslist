import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { serviceLabel, styleLabel } from "@/lib/cities";
import { MapPin } from "lucide-react";

type Studio = {
  slug: string;
  name: string;
  city: string | null;
  styles: string[] | null;
  services: string[] | null;
};

type Stats = { studios: number; cities: number; states: number };

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function HeroMatchCard({ stats, studios }: { stats: Stats; studios: Studio[] }) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const paused = useRef(false);

  useEffect(() => {
    if (reduced || studios.length < 2) return;
    const id = setInterval(() => {
      if (paused.current) return;
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % studios.length);
        setVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(id);
  }, [reduced, studios.length]);

  const current = studios[index % Math.max(1, studios.length)];
  const tags = [
    ...(current?.styles ?? []).slice(0, 2).map(styleLabel),
    ...(current?.services ?? []).slice(0, 2).map(serviceLabel),
  ].slice(0, 2);

  return (
    <div className="rounded-3xl border border-border bg-card/95 p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] backdrop-blur">
      <p className="font-display text-2xl">Not sure who's right for your project?</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Answer a few questions about your space, style and budget and we'll shortlist studios that fit.
      </p>
      <Button asChild className="mt-6 w-full rounded-full">
        <Link to="/match">Get matched →</Link>
      </Button>

      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
        <Stat label="Studios" value={stats.studios.toLocaleString()} />
        <Stat label="Cities" value={stats.cities.toLocaleString()} />
        <Stat label="States" value={stats.states.toLocaleString()} />
      </div>

      {current && (
        <div
          className="mt-6 border-t border-border/70 pt-4"
          onMouseEnter={() => { paused.current = true; }}
          onMouseLeave={() => { paused.current = false; }}
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Recently listed</p>
          <Link
            to="/studio/$slug"
            params={{ slug: current.slug }}
            className={`mt-2 block transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
          >
            <p className="font-display text-lg leading-snug hover:text-brand">{current.name}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {current.city}
              {tags.length > 0 && <span> · {tags.join(" · ")}</span>}
            </p>
          </Link>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-3">
      <p className="font-display text-2xl">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}
