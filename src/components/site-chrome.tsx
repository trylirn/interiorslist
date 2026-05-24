import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, Menu, X } from "lucide-react";

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
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-brand-foreground font-display text-lg">T</span>
          <span className="font-display text-xl font-semibold tracking-tight">TexasInjectors</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Home</Link>
          <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground">Browse</Link>
          <Link to="/submit" className="text-sm text-muted-foreground hover:text-foreground">Add listing</Link>
          <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link>
          <Link to="/favorites" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <Heart className="h-4 w-4" /> Favorites
          </Link>
          {userEmail ? (
            <Button asChild variant="outline" size="sm"><Link to="/dashboard">Account</Link></Button>
          ) : (
            <Button asChild size="sm"><Link to="/login">Sign in</Link></Button>
          )}
        </nav>
        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4">
            <Link to="/" onClick={() => setOpen(false)}>Home</Link>
            <Link to="/search" onClick={() => setOpen(false)}>Browse</Link>
            <Link to="/submit" onClick={() => setOpen(false)}>Add listing</Link>
            <Link to="/about" onClick={() => setOpen(false)}>About</Link>
            <Link to="/favorites" onClick={() => setOpen(false)}>Favorites</Link>
            {userEmail ? <Link to="/dashboard" onClick={() => setOpen(false)}>Account</Link> : <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link>}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-brand-foreground font-display">T</span>
            <span className="font-display text-lg">TexasInjectors</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">The trusted directory of aesthetic injectors across Texas.</p>
        </div>
        <div>
          <h4 className="font-semibold">Browse</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/tx/$city" params={{ city: "houston" }}>Houston</Link></li>
            <li><Link to="/tx/$city" params={{ city: "dallas" }}>Dallas</Link></li>
            <li><Link to="/tx/$city" params={{ city: "austin" }}>Austin</Link></li>
            <li><Link to="/tx/$city" params={{ city: "san-antonio" }}>San Antonio</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">For providers</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/submit">Submit a business</Link></li>
            <li><Link to="/login">Claim your listing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} TexasInjectors. Listings sourced from public Google Maps data. This site is informational and is not medical advice — always verify provider credentials and consult a licensed professional before any treatment.</p>
        </div>
      </div>
    </footer>
  );
}
