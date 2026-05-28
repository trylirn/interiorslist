import { Scale } from "lucide-react";
import { useCompareStore, type CompareItem } from "@/stores/compare-store";
import { toast } from "sonner";

export function CompareButton(props: CompareItem) {
  const { toggle, isIn, items } = useCompareStore();
  const active = isIn(props.place_id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!active && items.length >= 3) {
          toast.error("You can compare up to 3 providers");
          return;
        }
        toggle(props);
        toast.success(active ? "Removed from compare" : "Added to compare");
      }}
      aria-label={active ? "Remove from compare" : "Add to compare"}
      className={`absolute right-14 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-sm ring-1 ring-border transition hover:scale-105 ${active ? "bg-brand text-brand-foreground" : "bg-card/95 text-foreground hover:text-brand"}`}
    >
      <Scale className="h-4 w-4" />
    </button>
  );
}
