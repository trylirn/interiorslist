import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Redo2, RotateCw, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { logToolUsage } from "@/lib/tool-usage";

/* ---------------------------------------------------------------- types */

type Item = {
  id: string;
  kind: string;
  label: string;
  x: number; // feet, from room's top-left
  y: number;
  w: number; // feet
  h: number;
  rot: number; // degrees
  color: string;
};

type Opening = {
  id: string;
  type: "door" | "window";
  wall: "top" | "right" | "bottom" | "left";
  offset: number; // feet from the wall's start
  width: number; // feet
};

type Plan = {
  roomW: number;
  roomH: number;
  unit: "ft" | "m";
  items: Item[];
  openings: Opening[];
};

const FURNITURE: { kind: string; label: string; w: number; h: number; color: string }[] = [
  { kind: "sofa", label: "Sofa", w: 7, h: 3, color: "#8a6f52" },
  { kind: "loveseat", label: "Loveseat", w: 5, h: 3, color: "#9c8266" },
  { kind: "armchair", label: "Armchair", w: 3, h: 3, color: "#a68f74" },
  { kind: "coffee-table", label: "Coffee table", w: 4, h: 2, color: "#6d5b47" },
  { kind: "side-table", label: "Side table", w: 1.7, h: 1.7, color: "#7b6852" },
  { kind: "tv-unit", label: "TV unit", w: 6, h: 1.5, color: "#4c4741" },
  { kind: "rug-8x10", label: "Rug 8×10", w: 10, h: 8, color: "#cbbda8" },
  { kind: "dining-table", label: "Dining table (6)", w: 6, h: 3.3, color: "#7a6144" },
  { kind: "dining-round", label: "Round table", w: 4.5, h: 4.5, color: "#7a6144" },
  { kind: "chair", label: "Chair", w: 1.6, h: 1.6, color: "#8d7a63" },
  { kind: "kitchen-island", label: "Kitchen island", w: 7, h: 3.3, color: "#5f5a53" },
  { kind: "counter", label: "Counter run", w: 8, h: 2, color: "#6b665e" },
  { kind: "fridge", label: "Fridge", w: 3, h: 2.5, color: "#8f9297" },
  { kind: "range", label: "Range", w: 2.5, h: 2.2, color: "#8f9297" },
  { kind: "bed-king", label: "King bed", w: 6.3, h: 6.7, color: "#9b8a76" },
  { kind: "bed-queen", label: "Queen bed", w: 5, h: 6.7, color: "#9b8a76" },
  { kind: "bed-single", label: "Single bed", w: 3.2, h: 6.3, color: "#9b8a76" },
  { kind: "nightstand", label: "Nightstand", w: 1.7, h: 1.5, color: "#7b6852" },
  { kind: "wardrobe", label: "Wardrobe", w: 6, h: 2, color: "#665845" },
  { kind: "dresser", label: "Dresser", w: 5, h: 1.7, color: "#665845" },
  { kind: "desk", label: "Desk", w: 5, h: 2.5, color: "#6d5b47" },
  { kind: "bookcase", label: "Bookcase", w: 3, h: 1.2, color: "#5d5140" },
  { kind: "vanity", label: "Bath vanity", w: 4, h: 1.8, color: "#6b665e" },
  { kind: "bathtub", label: "Bathtub", w: 5, h: 2.6, color: "#adb5bd" },
  { kind: "shower", label: "Shower", w: 3, h: 3, color: "#adb5bd" },
  { kind: "toilet", label: "Toilet", w: 1.6, h: 2.4, color: "#adb5bd" },
  { kind: "plant", label: "Plant", w: 1.5, h: 1.5, color: "#6f8f6a" },
];

const STORE_KEY = "intearior_room_plan";
const EMPTY: Plan = { roomW: 16, roomH: 13, unit: "ft", items: [], openings: [] };
const SNAP = 0.25; // feet

const uid = () => Math.random().toString(36).slice(2, 9);
const snap = (n: number) => Math.round(n / SNAP) * SNAP;
const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

/* ---------------------------------------------------------------- planner */

export function RoomPlanner() {
  const [plan, setPlan] = useState<Plan>(EMPTY);
  const [past, setPast] = useState<Plan[]>([]);
  const [future, setFuture] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setPlan({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const commit = useCallback((next: Plan, record = true) => {
    setPlan((prev) => {
      if (record) {
        setPast((p) => [...p.slice(-40), prev]);
        setFuture([]);
      }
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* private browsing */
      }
      return next;
    });
  }, []);

  function undo() {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1]!;
      setFuture((f) => [plan, ...f]);
      setPlan(prev);
      return p.slice(0, -1);
    });
  }
  function redo() {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0]!;
      setPast((p) => [...p, plan]);
      setPlan(next);
      return f.slice(1);
    });
  }

  /* geometry: 1 foot = SCALE svg units */
  const SCALE = 26;
  const PAD = 34;
  const vbW = plan.roomW * SCALE + PAD * 2;
  const vbH = plan.roomH * SCALE + PAD * 2;

  const toFeet = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const sx = vbW / rect.width;
      const sy = vbH / rect.height;
      return {
        x: ((clientX - rect.left) * sx - PAD) / SCALE,
        y: ((clientY - rect.top) * sy - PAD) / SCALE,
      };
    },
    [vbW, vbH],
  );

  function addItem(kind: string) {
    const preset = FURNITURE.find((f) => f.kind === kind)!;
    const item: Item = {
      id: uid(),
      kind: preset.kind,
      label: preset.label,
      x: snap(Math.max(0.5, plan.roomW / 2 - preset.w / 2)),
      y: snap(Math.max(0.5, plan.roomH / 2 - preset.h / 2)),
      w: preset.w,
      h: preset.h,
      rot: 0,
      color: preset.color,
    };
    commit({ ...plan, items: [...plan.items, item] });
    setSelected(item.id);
  }

  function addOpening(type: "door" | "window") {
    const op: Opening = { id: uid(), type, wall: "top", offset: 1, width: type === "door" ? 3 : 4 };
    commit({ ...plan, openings: [...plan.openings, op] });
  }

  function updateItem(id: string, patch: Partial<Item>, record = true) {
    commit({ ...plan, items: plan.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }, record);
  }

  function onPointerDown(e: React.PointerEvent, item: Item) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const p = toFeet(e.clientX, e.clientY);
    drag.current = { id: item.id, dx: p.x - item.x, dy: p.y - item.y };
    setSelected(item.id);
    setPast((prev) => [...prev.slice(-40), plan]);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const p = toFeet(e.clientX, e.clientY);
    const item = plan.items.find((i) => i.id === d.id);
    if (!item) return;
    const nx = Math.max(-1, Math.min(plan.roomW - 0.5, snap(p.x - d.dx)));
    const ny = Math.max(-1, Math.min(plan.roomH - 0.5, snap(p.y - d.dy)));
    updateItem(d.id, { x: nx, y: ny }, false);
  }

  function onPointerUp() {
    if (drag.current) {
      drag.current = null;
      logToolUsage({ tool: "room-planner" });
    }
  }

  const sel = useMemo(() => plan.items.find((i) => i.id === selected) ?? null, [plan.items, selected]);
  const area = Math.round(plan.roomW * plan.roomH);

  function exportPng() {
    const svg = svgRef.current;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = vbW * 2;
      canvas.height = vbH * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "intearior-room-plan.png";
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* canvas */}
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" className="rounded-none" onClick={undo} disabled={!past.length}>
            <Undo2 className="mr-1.5 h-4 w-4" /> Undo
          </Button>
          <Button size="sm" variant="outline" className="rounded-none" onClick={redo} disabled={!future.length}>
            <Redo2 className="mr-1.5 h-4 w-4" /> Redo
          </Button>
          <Button size="sm" variant="outline" className="rounded-none" onClick={exportPng}>
            <Download className="mr-1.5 h-4 w-4" /> Export image
          </Button>
          <Button
            size="sm" variant="ghost" className="rounded-none text-muted-foreground"
            onClick={() => { commit({ ...plan, items: [], openings: [] }); setSelected(null); toast.success("Plan cleared"); }}
          >
            Clear
          </Button>
          <span className="ml-auto text-sm text-muted-foreground">
            {fmt(plan.roomW)} × {fmt(plan.roomH)} ft · <strong className="text-foreground">{area} sq ft</strong>
          </span>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${vbW} ${vbH}`}
            className="w-full touch-none select-none"
            style={{ aspectRatio: `${vbW} / ${vbH}` }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onClick={() => setSelected(null)}
          >
            <rect width={vbW} height={vbH} fill="#ffffff" />
            {/* 1ft grid */}
            <g stroke="#e7e2da" strokeWidth={1}>
              {Array.from({ length: Math.floor(plan.roomW) + 1 }, (_, i) => (
                <line key={`v${i}`} x1={PAD + i * SCALE} y1={PAD} x2={PAD + i * SCALE} y2={PAD + plan.roomH * SCALE} />
              ))}
              {Array.from({ length: Math.floor(plan.roomH) + 1 }, (_, i) => (
                <line key={`h${i}`} x1={PAD} y1={PAD + i * SCALE} x2={PAD + plan.roomW * SCALE} y2={PAD + i * SCALE} />
              ))}
            </g>

            {/* walls */}
            <rect
              x={PAD} y={PAD} width={plan.roomW * SCALE} height={plan.roomH * SCALE}
              fill="none" stroke="#2c2a27" strokeWidth={7}
            />

            {/* openings */}
            {plan.openings.map((o) => {
              const len = o.width * SCALE;
              const off = o.offset * SCALE;
              const pos =
                o.wall === "top" ? { x: PAD + off, y: PAD - 4, w: len, h: 8 }
                : o.wall === "bottom" ? { x: PAD + off, y: PAD + plan.roomH * SCALE - 4, w: len, h: 8 }
                : o.wall === "left" ? { x: PAD - 4, y: PAD + off, w: 8, h: len }
                : { x: PAD + plan.roomW * SCALE - 4, y: PAD + off, w: 8, h: len };
              return (
                <rect
                  key={o.id} x={pos.x} y={pos.y} width={pos.w} height={pos.h}
                  fill={o.type === "door" ? "#ffffff" : "#8fb3cf"}
                  stroke={o.type === "door" ? "#2c2a27" : "#4a7ea3"} strokeWidth={2}
                />
              );
            })}

            {/* furniture */}
            {plan.items.map((it) => {
              const cx = PAD + (it.x + it.w / 2) * SCALE;
              const cy = PAD + (it.y + it.h / 2) * SCALE;
              const isSel = it.id === selected;
              return (
                <g key={it.id} transform={`rotate(${it.rot} ${cx} ${cy})`}>
                  <rect
                    x={PAD + it.x * SCALE} y={PAD + it.y * SCALE}
                    width={it.w * SCALE} height={it.h * SCALE}
                    fill={it.color} fillOpacity={0.85}
                    stroke={isSel ? "#111111" : "#5c5348"} strokeWidth={isSel ? 3 : 1.5}
                    className="cursor-move"
                    onPointerDown={(e) => onPointerDown(e, it)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <text
                    x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fill="#ffffff"
                    pointerEvents="none" style={{ paintOrder: "stroke" }} stroke="#00000055" strokeWidth={2}
                  >
                    {it.label}
                  </text>
                </g>
              );
            })}

            {/* dimensions */}
            <text x={PAD + (plan.roomW * SCALE) / 2} y={PAD - 14} textAnchor="middle" fontSize={13} fill="#6b6459">
              {fmt(plan.roomW)} ft
            </text>
            <text
              x={16} y={PAD + (plan.roomH * SCALE) / 2} textAnchor="middle" fontSize={13} fill="#6b6459"
              transform={`rotate(-90 16 ${PAD + (plan.roomH * SCALE) / 2})`}
            >
              {fmt(plan.roomH)} ft
            </text>
          </svg>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Drag pieces to move them. Tap a piece to select it, then resize or rotate on the right. Everything is
          saved in this browser — no account needed.
        </p>
      </div>

      {/* side panel */}
      <div className="space-y-5">
        <Panel title="Room size">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Width (ft)</Label>
              <Input
                type="number" min={4} max={80} value={plan.roomW}
                onChange={(e) => commit({ ...plan, roomW: Math.max(4, Math.min(80, Number(e.target.value) || 4)) })}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Length (ft)</Label>
              <Input
                type="number" min={4} max={80} value={plan.roomH}
                onChange={(e) => commit({ ...plan, roomH: Math.max(4, Math.min(80, Number(e.target.value) || 4)) })}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Doors & windows">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-none" onClick={() => addOpening("door")}>Add door</Button>
            <Button size="sm" variant="outline" className="rounded-none" onClick={() => addOpening("window")}>Add window</Button>
          </div>
          <ul className="mt-3 space-y-2">
            {plan.openings.map((o) => (
              <li key={o.id} className="flex items-center gap-1.5 text-xs">
                <span className="w-14 capitalize">{o.type}</span>
                <select
                  value={o.wall}
                  onChange={(e) =>
                    commit({
                      ...plan,
                      openings: plan.openings.map((x) => (x.id === o.id ? { ...x, wall: e.target.value as Opening["wall"] } : x)),
                    })
                  }
                  className="h-8 flex-1 border border-border bg-background px-1"
                >
                  <option value="top">Top</option>
                  <option value="right">Right</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                </select>
                <input
                  type="number" min={0} step={0.5} value={o.offset} aria-label="Offset in feet"
                  onChange={(e) =>
                    commit({
                      ...plan,
                      openings: plan.openings.map((x) => (x.id === o.id ? { ...x, offset: Math.max(0, Number(e.target.value) || 0) } : x)),
                    })
                  }
                  className="h-8 w-14 border border-border bg-background px-1"
                />
                <button
                  aria-label="Remove opening"
                  onClick={() => commit({ ...plan, openings: plan.openings.filter((x) => x.id !== o.id) })}
                  className="p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Add furniture">
          <div className="flex max-h-64 flex-wrap gap-1.5 overflow-y-auto">
            {FURNITURE.map((f) => (
              <button
                key={f.kind} onClick={() => addItem(f.kind)}
                className="border border-border px-2 py-1 text-xs hover:border-brand hover:text-brand"
              >
                {f.label}
              </button>
            ))}
          </div>
        </Panel>

        {sel && (
          <Panel title={`Selected — ${sel.label}`}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Width (ft)</Label>
                <Input
                  type="number" step={0.5} min={0.5} value={sel.w}
                  onChange={(e) => updateItem(sel.id, { w: Math.max(0.5, Number(e.target.value) || 0.5) })}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Depth (ft)</Label>
                <Input
                  type="number" step={0.5} min={0.5} value={sel.h}
                  onChange={(e) => updateItem(sel.id, { h: Math.max(0.5, Number(e.target.value) || 0.5) })}
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" className="rounded-none" onClick={() => updateItem(sel.id, { rot: (sel.rot + 90) % 360 })}>
                <RotateCw className="mr-1.5 h-4 w-4" /> 90°
              </Button>
              <Button size="sm" variant="outline" className="rounded-none" onClick={() => updateItem(sel.id, { rot: (sel.rot + 15) % 360 })}>
                15°
              </Button>
              <Button
                size="sm" variant="ghost" className="rounded-none text-destructive"
                onClick={() => { commit({ ...plan, items: plan.items.filter((i) => i.id !== sel.id) }); setSelected(null); }}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete
              </Button>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground/70">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
