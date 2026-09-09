import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { photoUrl } from "@/lib/photo-url";

/** Gallery grid whose photos open in a full-screen viewer on the page itself. */
export function PhotoGallery({ urls, alt }: { urls: string[]; alt: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") setIndex((i) => (i === null ? i : (i + 1) % urls.length));
      if (e.key === "ArrowLeft") setIndex((i) => (i === null ? i : (i - 1 + urls.length) % urls.length));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, urls.length]);

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {urls.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setIndex(i)}
            className="block aspect-square overflow-hidden rounded-xl border border-border bg-secondary/30"
            aria-label={`Open photo ${i + 1}`}
          >
            <img
              src={photoUrl(url)}
              alt={`${alt} — photo ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition hover:scale-105"
            />
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setIndex(null)}
        >
          <button
            type="button"
            onClick={() => setIndex(null)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {urls.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(e) => { e.stopPropagation(); setIndex((i) => (i === null ? i : (i - 1 + urls.length) % urls.length)); }}
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={(e) => { e.stopPropagation(); setIndex((i) => (i === null ? i : (i + 1) % urls.length)); }}
                className="absolute right-4 top-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img
            src={photoUrl(urls[index]!)}
            alt={`${alt} — photo ${index + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </>
  );
}
