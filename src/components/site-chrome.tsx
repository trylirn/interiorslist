import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Menu, Search, X } from "lucide-react";
import { SERVICES, STYLES } from "@/lib/cities";
import { BrandLockup, BrandStacked } from "@/components/brand-logo";
import { listStates, listTopCities } from "@/lib/providers.functions";
import { getMyRoles } from "@/lib/role.functions";

export function SiteHeader() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUserEmail(session?.user.email ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data: roles } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => getMyRoles(),
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4">
        <BrandLockup />
        <nav className="hidden items-center gap-8 lg:flex">
          <Link to="/search" className="text-sm font-medium hover:text-brand">Find a Designer</Link>
          <Link to="/match" className="text-sm font-medium hover:text-brand">Get Matched</Link>
          <Link to="/for-business" className="text-sm font-medium hover:text-brand">For Studios</Link>
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link to="/search" aria-label="Search" className="text-foreground/80 hover:text-brand">
            <Search className="h-4 w-4" />
          </Link>
          {roles?.isAdmin && <Link to="/admin" className="text-sm font-medium text-brand hover:underline">Admin</Link>}
          {userEmail ? (
            <Link to="/dashboard" className="text-sm font-medium hover:text-brand">Account</Link>
          ) : (
            <Link to="/login" className="text-sm font-medium hover:text-brand">Sign In</Link>
          )}
          <Button asChild className="rounded-none px-5"><Link to="/review">Write a Review</Link></Button>
        </div>
        <button className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-sm">
            <Link to="/search" onClick={() => setOpen(false)}>Find a Designer</Link>
            <Link to="/match" onClick={() => setOpen(false)}>Get Matched</Link>
            <Link to="/for-business" onClick={() => setOpen(false)}>For Studios</Link>
            
            <Link to="/review" onClick={() => setOpen(false)}>Write a Review</Link>
            {roles?.isAdmin && <Link to="/admin" onClick={() => setOpen(false)}>Admin</Link>}
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
  const services = SERVICES.slice(0, 6);
  const styles = STYLES.slice(0, 6);
  const { data: cityData } = useQuery({
    queryKey: ["footer-cities"],
    queryFn: () => listTopCities({ data: { limit: 8 } }),
    staleTime: 30 * 60 * 1000,
  });
  const { data: stateData } = useQuery({
    queryKey: ["footer-states"],
    queryFn: () => listStates(),
    staleTime: 30 * 60 * 1000,
  });
  const states = [...(stateData?.states ?? [])].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <footer className="mt-16 border-t border-border/60 bg-secondary/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 lg:grid-cols-6">
        <div>
          <BrandStacked width={168} className="-ml-2" />
          <p className="mt-4 text-sm text-muted-foreground">
            The independent directory for finding vetted interior design studios across the country.
          </p>
        </div>

        <FooterCol title="Cities" to="/search">
          {(cityData?.cities ?? []).map((c) => (
            <li key={c.slug}>
              <Link to="/designers/$state/$city" params={{ state: c.state.toLowerCase(), city: c.slug }} className="hover:text-brand">
                {c.name}, {c.state} <span className="text-muted-foreground/60">({c.count})</span>
              </Link>
            </li>
          ))}
          <li><Link to="/search" className="font-medium text-brand hover:underline">All cities →</Link></li>
        </FooterCol>

        <FooterCol title="States" to="/search">
          {states.map((st) => (
            <li key={st.code}>
              <Link to="/designers/$state" params={{ state: st.slug }} className="hover:text-brand">
                {st.name} <span className="text-muted-foreground/60">({st.count})</span>
              </Link>
            </li>
          ))}
          <li><Link to="/search" className="font-medium text-brand hover:underline">All states →</Link></li>
        </FooterCol>

        <FooterCol title="Services" to="/search">
          {services.map((s) => (
            <li key={s.slug}><Link to="/service/$slug" params={{ slug: s.slug }} className="hover:text-brand">{s.name}</Link></li>
          ))}
          <li><Link to="/search" className="font-medium text-brand hover:underline">All services →</Link></li>
        </FooterCol>

        <FooterCol title="Styles" to="/search">
          {styles.map((c) => (
            <li key={c.slug}><Link to="/style/$slug" params={{ slug: c.slug }} className="hover:text-brand">{c.label}</Link></li>
          ))}
          <li><Link to="/search" className="font-medium text-brand hover:underline">All styles →</Link></li>
        </FooterCol>

        <div className="space-y-8">
          <FooterCol title="Company">
            <li><Link to="/about" className="hover:text-brand">About</Link></li>
            <li><Link to="/blog" className="hover:text-brand">Blog</Link></li>
            <li><Link to="/how-it-works" className="hover:text-brand">How it works</Link></li>
            <li><Link to="/submit" className="hover:text-brand">Submit a studio</Link></li>
            <li><Link to="/for-business" className="hover:text-brand">For studios</Link></li>
            <li><Link to="/contact" className="hover:text-brand">Contact</Link></li>
          </FooterCol>


          <FooterCol title="Trust">
            <li><Link to="/how-it-works" className="hover:text-brand">How it works</Link></li>
            <li><Link to="/privacy" className="hover:text-brand">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-brand">Terms</Link></li>
          </FooterCol>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Intearior. An independent directory — we don't sell placement.
            Always confirm a studio's credentials, insurance and contract terms before hiring.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, to, children }: { title: string; to?: "/search"; children: React.ReactNode }) {
  const heading = "text-xs font-semibold uppercase tracking-widest text-foreground/70";
  return (
    <div>
      {to ? (
        <Link to={to} className={`${heading} hover:text-brand`}>{title}</Link>
      ) : (
        <h4 className={heading}>{title}</h4>
      )}
      <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">{children}</ul>
    </div>
  );
}

