import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCompareStore } from "@/stores/compare-store";
import { Link } from "@tanstack/react-router";
import { X, Scale } from "lucide-react";

export function CompareDrawer() {
  const { items, remove, clear } = useCompareStore();
  if (items.length === 0) return null;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 z-50 rounded-full px-6 shadow-lg">
          <Scale className="mr-2 h-4 w-4" /> Compare ({items.length})
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Compare providers</SheetTitle>
        </SheetHeader>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {items.map((p) => (
            <div key={p.place_id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-display text-lg leading-tight">{p.name}</h3>
                <button onClick={() => remove(p.place_id)} aria-label="Remove" className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.city}, TX</p>
              {p.branch_label && <p className="mt-1 text-xs text-brand">{p.branch_label}</p>}
              {p.specialists && <p className="mt-3 text-sm line-clamp-4">{p.specialists}</p>}
              {p.services && p.services.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.services.slice(0, 6).map((s) => (
                    <span key={s} className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize">{s.replace(/-/g, " ")}</span>
                  ))}
                </div>
              )}
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link to="/provider/$slug" params={{ slug: p.slug }}>View profile</Link>
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="ghost" onClick={clear}>Clear all</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
