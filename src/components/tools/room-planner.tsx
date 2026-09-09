import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Redo2, RotateCw, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { logToolUsage } from "@/lib/tool-usage";
import { CATEGORIES, FURNITURE, FurnitureGlyph, byKind } from "./furniture";


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

/* furniture catalogue + top-down illustrations live in ./furniture */


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
  const odrag = useRef<{ id: string } | null>(null);


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
    const preset = byKind(kind);
    if (!preset) return;

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

  function onOpeningPointerDown(e: React.PointerEvent, o: Opening) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    odrag.current = { id: o.id };
    setSelected(null);
    setPast((prev) => [...prev.slice(-40), plan]);
  }

  /** Snap a dragged opening to the nearest wall and slide it along that wall. */
  function moveOpening(id: string, px: number, py: number) {
    const o = plan.openings.find((x) => x.id === id);
    if (!o) return;
    const dists = {
      top: Math.abs(py),
      bottom: Math.abs(plan.roomH - py),
      left: Math.abs(px),
      right: Math.abs(plan.roomW - px),
    } as const;
    const wall = (Object.keys(dists) as Opening["wall"][]).reduce((a, b) => (dists[a] <= dists[b] ? a : b));
    const along = wall === "top" || wall === "bottom" ? px : py;
    const wallLen = wall === "top" || wall === "bottom" ? plan.roomW : plan.roomH;
    const offset = Math.max(0, Math.min(wallLen - o.width, snap(along - o.width / 2)));
    commit(
      { ...plan, openings: plan.openings.map((x) => (x.id === id ? { ...x, wall, offset } : x)) },
      false,
    );
  }

  function onPointerMove(e: React.PointerEvent) {
    const p = toFeet(e.clientX, e.clientY);
    if (odrag.current) {
      moveOpening(odrag.current.id, p.x, p.y);
      return;
    }
    const d = drag.current;
    if (!d) return;
    const item = plan.items.find((i) => i.id === d.id);
    if (!item) return;
    const nx = Math.max(-1, Math.min(plan.roomW - 0.5, snap(p.x - d.dx)));
    const ny = Math.max(-1, Math.min(plan.roomH - 0.5, snap(p.y - d.dy)));
    updateItem(d.id, { x: nx, y: ny }, false);
  }

  function onPointerUp() {
    if (drag.current || odrag.current) {
      drag.current = null;
      odrag.current = null;
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

            {/* openings — drag along any wall */}
            {plan.openings.map((o) => {
              const len = o.width * SCALE;
              const off = o.offset * SCALE;
              const horiz = o.wall === "top" || o.wall === "bottom";
              const x = o.wall === "right" ? PAD + plan.roomW * SCALE : PAD + (horiz ? off : 0);
              const y = o.wall === "bottom" ? PAD + plan.roomH * SCALE : PAD + (horiz ? 0 : off);
              const inward =
                o.wall === "top" ? 1 : o.wall === "bottom" ? -1 : o.wall === "left" ? 1 : -1;
              return (
                <g
                  key={o.id}
                  className="cursor-grab"
                  onPointerDown={(e) => onOpeningPointerDown(e, o)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* clear the wall behind the opening */}
                  <rect
                    x={horiz ? x : x - 5} y={horiz ? y - 5 : y}
                    width={horiz ? len : 10} height={horiz ? 10 : len}
                    fill="#ffffff"
                  />
                  {o.type === "door" ? (
                    <g stroke="#2c2a27" fill="none" strokeWidth={2}>
                      {horiz ? (
                        <>
                          <path d={`M${x} ${y} a${len} ${len} 0 0 ${inward > 0 ? 1 : 0} ${len} ${inward * len}`} opacity={0.45} />
                          <line x1={x} y1={y} x2={x} y2={y + inward * len} strokeWidth={4} />
                        </>
                      ) : (
                        <>
                          <path d={`M${x} ${y} a${len} ${len} 0 0 ${inward > 0 ? 0 : 1} ${inward * len} ${len}`} opacity={0.45} />
                          <line x1={x} y1={y} x2={x + inward * len} y2={y} strokeWidth={4} />
                        </>
                      )}
                    </g>
                  ) : (
                    <g>
                      <rect
                        x={horiz ? x : x - 3.5} y={horiz ? y - 3.5 : y}
                        width={horiz ? len : 7} height={horiz ? 7 : len}
                        fill="#cfe3f2" stroke="#4a7ea3" strokeWidth={2}
                      />
                      {horiz ? (
                        <line x1={x} y1={y} x2={x + len} y2={y} stroke="#4a7ea3" strokeWidth={1.5} />
                      ) : (
                        <line x1={x} y1={y} x2={x} y2={y + len} stroke="#4a7ea3" strokeWidth={1.5} />
                      )}
                    </g>
                  )}
                  {/* grab area */}
                  <rect
                    x={horiz ? x : x - 9} y={horiz ? y - 9 : y}
                    width={horiz ? len : 18} height={horiz ? 18 : len}
                    fill="transparent"
                  />
                </g>
              );
            })}

            {/* furniture */}
            {plan.items.map((it) => {
              const px = PAD + it.x * SCALE;
              const py = PAD + it.y * SCALE;
              const pw = it.w * SCALE;
              const ph = it.h * SCALE;
              const cx = px + pw / 2;
              const cy = py + ph / 2;
              const isSel = it.id === selected;
              const def = byKind(it.kind);
              return (
                <g key={it.id} transform={`rotate(${it.rot} ${cx} ${cy})`}>
                  <svg x={px} y={py} width={pw} height={ph} viewBox="0 0 100 100" preserveAspectRatio="none" overflow="visible">
                    <FurnitureGlyph glyph={def?.glyph ?? "coffee-table"} color={it.color} />
                  </svg>
                  <rect
                    x={px} y={py} width={pw} height={ph}
                    fill="transparent"
                    stroke={isSel ? "#111111" : "none"} strokeWidth={isSel ? 3 : 0}
                    strokeDasharray={isSel ? "6 4" : undefined}
                    className="cursor-move"
                    onPointerDown={(e) => onPointerDown(e, it)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {isSel && (
                    <text
                      x={cx} y={py - 5} textAnchor="middle" fontSize={11} fill="#2c2a27"
                      pointerEvents="none" style={{ paintOrder: "stroke" }} stroke="#ffffff" strokeWidth={3}
                    >
                      {it.label}
                    </text>
                  )}
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
          Drag pieces to move them; tap one to select it, then resize or rotate on the right. Doors and windows
          drag along the walls and snap to whichever wall you pull them nearest. Everything is saved in this
          browser — no account needed.
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
          <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
            {CATEGORIES.map((cat) => (
              <div key={cat}>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{cat}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {FURNITURE.filter((f) => f.category === cat).map((f) => (
                    <button
                      key={f.kind} onClick={() => addItem(f.kind)} title={`${f.label} — ${f.w}×${f.h} ft`}
                      className="flex flex-col items-center gap-1 border border-border p-1.5 text-[10px] leading-tight hover:border-brand hover:text-brand"
                    >
                      <svg viewBox="0 0 100 100" className="h-8 w-8" aria-hidden="true">
                        <FurnitureGlyph glyph={f.glyph} color={f.color} />
                      </svg>
                      <span className="line-clamp-2 text-center">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
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
