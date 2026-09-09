import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Download, ImagePlus, Lock, RefreshCw, Trash2, Unlock } from "lucide-react";
import { toast } from "sonner";
import {
  HARMONIES, buildPalette, contrastRatio, hexToHsl, randomHex, readableOn, rgbToHex, shadeLadder,
  type Harmony,
} from "@/lib/color";
import { logToolUsage } from "@/lib/tool-usage";

const STORE_KEY = "intearior_palettes";
type SavedPalette = { id: string; name: string; colors: string[] };

function loadSaved(): SavedPalette[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function PaletteGenerator({ initialBase, initialHarmony }: { initialBase?: string; initialHarmony?: Harmony }) {
  const [base, setBase] = useState(initialBase ?? "#8a6f52");
  const [harmony, setHarmony] = useState<Harmony>(initialHarmony ?? "analogous");
  const [locked, setLocked] = useState<boolean[]>([false, false, false, false, false]);
  const [colors, setColors] = useState<string[]>(() => buildPalette(initialBase ?? "#8a6f52", initialHarmony ?? "analogous"));
  const [saved, setSaved] = useState<SavedPalette[]>([]);
  const [name, setName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setSaved(loadSaved()), []);

  function regenerate(nextBase = base, nextHarmony = harmony) {
    const fresh = buildPalette(nextBase, nextHarmony);
    setColors((prev) => fresh.map((c, i) => (locked[i] ? prev[i]! : c)));
  }

  function shuffle() {
    const nb = randomHex();
    setBase(nb);
    regenerate(nb, harmony);
    logToolUsage({ tool: "color-palette" });
  }

  function persist(next: SavedPalette[]) {
    setSaved(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next.slice(0, 40)));
    } catch {
      /* private browsing */
    }
  }

  function savePalette() {
    const entry: SavedPalette = {
      id: `${Date.now()}`,
      name: name.trim() || `Palette ${saved.length + 1}`,
      colors,
    };
    persist([entry, ...saved]);
    setName("");
    toast.success("Palette saved to this browser");
    logToolUsage({ tool: "color-palette" });
  }

  function copyAll() {
    navigator.clipboard.writeText(colors.join(", ")).then(
      () => toast.success("Hex codes copied"),
      () => toast.error("Couldn't copy"),
    );
  }

  function exportPng() {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect((i * 1000) / colors.length, 0, 1000 / colors.length, 300);
      ctx.fillStyle = readableOn(c);
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(c.toUpperCase(), (i * 1000) / colors.length + 18, 275);
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "intearior-palette.png";
    a.click();
  }

  function fromImage(file: File) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const w = 120;
      const h = Math.max(1, Math.round((img.height / img.width) * w));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
        const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
        const cur = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
        cur.r += r; cur.g += g; cur.b += b; cur.n += 1;
        buckets.set(key, cur);
      }
      const top = Array.from(buckets.values())
        .sort((a, b) => b.n - a.n)
        .slice(0, 5)
        .map((c) => rgbToHex(c.r / c.n, c.g / c.n, c.b / c.n));
      if (top.length) {
        setColors((prev) => prev.map((c, i) => (locked[i] ? c : top[i] ?? c)));
        setBase(top[0]!);
        toast.success("Palette pulled from your photo");
        logToolUsage({ tool: "color-palette" });
      }
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  }

  const ladder = useMemo(() => shadeLadder(colors[0] ?? base), [colors, base]);

  return (
    <div className="space-y-6">
      <div className="grid overflow-hidden rounded-lg border border-border sm:grid-cols-5">
        {colors.map((c, i) => (
          <div key={i} className="relative flex h-40 flex-col justify-between p-3" style={{ background: c }}>
            <button
              onClick={() => setLocked((l) => l.map((v, j) => (j === i ? !v : v)))}
              className="self-end rounded p-1"
              style={{ color: readableOn(c) }}
              aria-label={locked[i] ? "Unlock colour" : "Lock colour"}
            >
              {locked[i] ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4 opacity-60" />}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(c);
                toast.success(`${c.toUpperCase()} copied`);
              }}
              className="text-left text-sm font-semibold tracking-wide"
              style={{ color: readableOn(c) }}
            >
              {c.toUpperCase()}
              <span className="block text-[11px] font-normal opacity-80">
                contrast on white {contrastRatio(c, "#ffffff").toFixed(1)}:1
              </span>
            </button>
          </div>
        ))}
      </div>

      <div className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-widest text-foreground/70">Base colour</Label>
          <div className="mt-2 flex gap-2">
            <input
              type="color" value={base} aria-label="Base colour"
              onChange={(e) => { setBase(e.target.value); regenerate(e.target.value, harmony); }}
              className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent"
            />
            <Input
              value={base}
              onChange={(e) => {
                setBase(e.target.value);
                if (/^#[0-9a-f]{6}$/i.test(e.target.value)) regenerate(e.target.value, harmony);
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Hue {Math.round(hexToHsl(base).h)}° · saturation {Math.round(hexToHsl(base).s)}% ·
            lightness {Math.round(hexToHsl(base).l)}%
          </p>
        </div>

        <div>
          <Label className="text-xs font-semibold uppercase tracking-widest text-foreground/70">Harmony</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {HARMONIES.map((h) => (
              <button
                key={h.slug}
                onClick={() => { setHarmony(h.slug); regenerate(base, h.slug); }}
                className={`border px-3 py-1.5 text-xs ${
                  harmony === h.slug ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {HARMONIES.find((h) => h.slug === harmony)?.desc}
          </p>
        </div>

        <div className="sm:col-span-2 flex flex-wrap gap-2">
          <Button onClick={shuffle} className="rounded-none">
            <RefreshCw className="mr-2 h-4 w-4" /> Shuffle
          </Button>
          <Button variant="outline" className="rounded-none" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="mr-2 h-4 w-4" /> From a photo
          </Button>
          <input
            ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) fromImage(f); e.target.value = ""; }}
          />
          <Button variant="outline" className="rounded-none" onClick={copyAll}>
            <Copy className="mr-2 h-4 w-4" /> Copy hex codes
          </Button>
          <Button variant="outline" className="rounded-none" onClick={exportPng}>
            <Download className="mr-2 h-4 w-4" /> Export image
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground/70">
          Shade ladder — {(colors[0] ?? base).toUpperCase()}
        </h3>
        <div className="mt-3 grid grid-cols-3 gap-1 sm:grid-cols-9">
          {ladder.map((c) => (
            <button
              key={c} onClick={() => { navigator.clipboard.writeText(c); toast.success(`${c.toUpperCase()} copied`); }}
              className="h-14 text-[10px] font-medium" style={{ background: c, color: readableOn(c) }}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground/70">Save for a client pitch</h3>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Palette name (e.g. Hillside primary suite)" value={name} onChange={(e) => setName(e.target.value)} />
          <Button className="rounded-none" onClick={savePalette}>Save palette</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Saved on this device only — no account needed.</p>

        {saved.length > 0 && (
          <ul className="mt-4 space-y-3">
            {saved.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <div className="flex h-8 flex-1 overflow-hidden rounded">
                  {p.colors.map((c, i) => <span key={i} className="flex-1" style={{ background: c }} />)}
                </div>
                <span className="hidden w-40 truncate text-sm sm:block">{p.name}</span>
                <Button size="sm" variant="ghost" onClick={() => { setColors(p.colors); setBase(p.colors[0]!); }}>
                  Load
                </Button>
                <Button
                  size="sm" variant="ghost" aria-label="Delete palette"
                  onClick={() => persist(saved.filter((s) => s.id !== p.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
