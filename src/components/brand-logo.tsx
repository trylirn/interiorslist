import { Link } from "@tanstack/react-router";
import mark from "@/assets/logo-mark.png.asset.json";
import full from "@/assets/logo-full.png.asset.json";

export const LOGO_MARK_URL = mark.url;
export const LOGO_FULL_URL = full.url;

/** Horizontal lockup: mark + wordmark. Used in the header. */
export function BrandLockup({ className = "" }: { className?: string }) {
  return (
    <Link to="/" aria-label="Intearior — home" className={`flex items-center gap-3 ${className}`}>
      <img src={mark.url} alt="" aria-hidden className="h-16 w-16 object-contain md:h-[88px] md:w-[88px]" />
      <span className="font-display text-xl font-semibold uppercase tracking-[0.16em] md:text-2xl">Intearior</span>
    </Link>

  );
}

/** Stacked logo with wordmark and tagline. Used in the footer, auth and 404. */
export function BrandStacked({ className = "", width = 176 }: { className?: string; width?: number }) {
  return (
    <img
      src={full.url}
      alt="Intearior — interior design directory"
      style={{ width }}
      className={`h-auto object-contain ${className}`}
    />
  );
}
