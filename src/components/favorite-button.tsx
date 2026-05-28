import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { toggleFavorite } from "@/lib/user-actions.functions";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function FavoriteButton({ placeId }: { placeId: string }) {
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const toggle = useServerFn(toggleFavorite);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`fav:${placeId}`);
      if (raw) setActive(raw === "1");
    } catch {
      // ignore localStorage errors (private mode, etc.)
    }
  }, [placeId]);

  return (
    <button
      type="button"
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      disabled={busy}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate({ to: "/login" });
          return;
        }
        setBusy(true);
        const next = !active;
        setActive(next);
        try {
          localStorage.setItem(`fav:${placeId}`, next ? "1" : "0");
        } catch {
          // ignore
        }
        try {
          const res = await toggle({ data: { placeId } });
          setActive(res.favorited);
          toast.success(res.favorited ? "Saved to favorites" : "Removed from favorites");
        } catch {
          setActive(!next);
          toast.error("Couldn't update favorite");
        } finally {
          setBusy(false);
        }
      }}
      className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-card/95 text-foreground shadow-sm ring-1 ring-border transition hover:scale-105 hover:text-rose-500"
    >
      <Heart className={`h-4 w-4 ${active ? "fill-rose-500 text-rose-500" : ""}`} />
    </button>
  );
}
