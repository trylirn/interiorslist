import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

/** Signs out cleanly: stop in-flight queries, drop cached data, end session, go home. */
export function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };
}

export function DashboardShell({
  title,
  subtitle,
  items,
  active,
  onSelect,
  extraNav,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  items: DashboardNavItem[];
  active: string;
  onSelect: (key: string) => void;
  extraNav?: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const signOut = useSignOut();

  const nav = (compact: boolean, onNavigate?: () => void) => (
    <nav className="flex h-full flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              onSelect(item.key);
              onNavigate?.();
            }}
            title={compact ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
              compact && "justify-center px-2",
              isActive
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!compact && <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>}
            {!compact && item.badge ? (
              <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
      {extraNav && <div className={cn("mt-3 border-t border-border pt-3", compact && "hidden")}>{extraNav}</div>}
      <div className="mt-auto pt-3">
        <button
          type="button"
          onClick={signOut}
          title={compact ? "Sign out" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
            compact && "justify-center px-2",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!compact && <span>Sign out</span>}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-12">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl sm:text-4xl">{title}</h1>
          {subtitle && <div className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</div>}
        </div>
        <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileOpen(true)}>
          <Menu className="mr-2 h-4 w-4" />Menu
        </Button>
      </header>

      <div className="mt-6 flex gap-8">
        <aside
          className={cn(
            "hidden shrink-0 lg:block",
            collapsed ? "w-14" : "w-56",
          )}
        >
          <div className="sticky top-28 flex min-h-[24rem] flex-col rounded-2xl border border-border bg-card p-2">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="mb-2 flex items-center justify-center rounded-xl px-2 py-2 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            {nav(collapsed)}
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-4">
          <SheetTitle className="mb-4 text-base">{title}</SheetTitle>
          {nav(false, () => setMobileOpen(false))}
        </SheetContent>
      </Sheet>
    </div>
  );
}
