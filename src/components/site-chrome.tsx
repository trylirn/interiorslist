import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, Menu, Search, X } from "lucide-react";

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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight uppercase">
          Texas Aesthetics
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/search" className="text-sm font-medium hover:text-brand">Find an Injector</Link>
          <Link to="/submit" className="text-sm font-medium hover:text-brand">Submit Listing</Link>
          <Link to="/about" className="text-sm font-medium hover:text-brand">About</Link>
          <Link to="/favorites" aria-label="Favorites" className="text-foreground/80 hover:text-brand">
            <Heart className="h-4 w-4" />
          </Link>
          <Link to="/search" aria-label="Search" className="text-foreground/80 hover:text-brand">
            <Search className="h-4 w-4" />
          </Link>
          {userEmail ? (
            <Link to="/dashboard" className="text-sm font-medium hover:text-brand">Account</Link>
          ) : (
            <Link to="/login" className="text-sm font-medium hover:text-brand">Sign In</Link>
          )}
          <Button asChild className="rounded-full px-5"><Link to="/submit">Write a Review</Link></Button>
        </nav>
        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4">
            <Link to="/search" onClick={() => setOpen(false)}>Find an Injector</Link>
            <Link to="/submit" onClick={() => setOpen(false)}>Submit Listing</Link>
            <Link to="/about" onClick={() => setOpen(false)}>About</Link>
            <Link to="/favorites" onClick={() => setOpen(false)}>Favorites</Link>
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
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold uppercase tracking-tight">Texas Aesthetics</p>
          <p className="mt-3 text-sm text-muted-foreground">The trusted directory of aesthetic injectors across Texas.</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm">Browse</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/tx/$city" params={{ city: "houston" }} className="hover:text-brand">Houston</Link></li>
            <li><Link to="/tx/$city" params={{ city: "dallas" }} className="hover:text-brand">Dallas</Link></li>
            <li><Link to="/tx/$city" params={{ city: "austin" }} className="hover:text-brand">Austin</Link></li>
            <li><Link to="/tx/$city" params={{ city: "san-antonio" }} className="hover:text-brand">San Antonio</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm">For providers</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/submit" className="hover:text-brand">Submit a business</Link></li>
            <li><Link to="/login" className="hover:text-brand">Claim your listing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-brand">About</Link></li>
            <li><Link to="/contact" className="hover:text-brand">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-brand">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-brand">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Texas Aesthetics. Informational only — not medical advice. Always verify provider credentials and consult a licensed professional before any treatment.</p>
        </div>
      </div>
    </footer>
  );
}
