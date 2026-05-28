import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Menu, Search, X } from "lucide-react";

export function SiteHeader() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUserEmail(session?.user.email ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="font-display text-xl font-semibold tracking-[0.15em] uppercase">
          Texas Aesthetics
        </Link>
        <nav className="hidden items-center gap-8 lg:flex">
          <Link to="/search" className="text-sm font-medium hover:text-brand">Find a Pro</Link>
          <Link to="/match" className="text-sm font-medium hover:text-brand">Get Matched</Link>
          <Link to="/brands" className="text-sm font-medium hover:text-brand">Brands</Link>
          <Link to="/safety" className="text-sm font-medium hover:text-brand">Safety</Link>
          <Link to="/about" className="text-sm font-medium hover:text-brand">About</Link>
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <Link to="/search" aria-label="Search" className="text-foreground/80 hover:text-brand">
            <Search className="h-4 w-4" />
          </Link>
          {userEmail ? (
            <Link to="/dashboard" className="text-sm font-medium hover:text-brand">Account</Link>
          ) : (
            <Link to="/login" className="text-sm font-medium hover:text-brand">Sign In</Link>
          )}
          <Button asChild className="rounded-none px-5"><Link to="/submit">Write a Review</Link></Button>
        </div>
        <button className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-sm">
            <Link to="/search" onClick={() => setOpen(false)}>Find a Pro</Link>
            <Link to="/match" onClick={() => setOpen(false)}>Get Matched</Link>
            <Link to="/brands" onClick={() => setOpen(false)}>Brands</Link>
            <Link to="/safety" onClick={() => setOpen(false)}>Safety</Link>
            <Link to="/about" onClick={() => setOpen(false)}>About</Link>
            <Link to="/favorites" onClick={() => setOpen(false)}>Favorites</Link>
            <Link to="/submit" onClick={() => setOpen(false)}>Write a Review</Link>
            {userEmail
              ? <Link to="/dashboard" onClick={() => setOpen(false)}>Account</Link>
              : <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link>}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const cities = ["houston", "dallas", "austin", "san-antonio", "fort-worth"];
  const services = ["botox", "fillers", "lip-filler", "microneedling", "iv-therapy"];
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <p className="font-display text-xl font-semibold uppercase tracking-[0.15em]">Texas Aesthetics</p>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            The trusted directory helping Texans find vetted, verified aesthetic injectors and medspas.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/70">Browse by Type</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/search" className="hover:text-brand">All providers</Link></li>
            <li><Link to="/brands" className="hover:text-brand">Multi-location brands</Link></li>
            <li><Link to="/match" className="hover:text-brand">Get matched</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/70">Browse by City</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            {cities.map((c) => (
              <li key={c}>
                <Link to="/tx/$city" params={{ city: c }} className="hover:text-brand capitalize">
                  {c.replace(/-/g, " ")}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/70">Browse by Treatment</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            {services.map((s) => (
              <li key={s}>
                <Link to="/treatment/$slug" params={{ slug: s }} className="hover:text-brand capitalize">
                  {s.replace(/-/g, " ")}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/70">Company</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-brand">About</Link></li>
            <li><Link to="/contact" className="hover:text-brand">Contact</Link></li>
            <li><Link to="/safety" className="hover:text-brand">Patient Safety</Link></li>
            <li><Link to="/submit" className="hover:text-brand">For Providers</Link></li>
            <li><Link to="/privacy" className="hover:text-brand">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-brand">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Texas Aesthetics. Informational directory only — not medical advice.
            Always verify a provider's licensure with the Texas Medical Board or Texas Board of Nursing
            before treatment.
          </p>
        </div>
      </div>
    </footer>
  );
}
