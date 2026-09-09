/**
 * Top-down furniture illustrations for the 2D room planner.
 *
 * Every glyph is authored in a 100 x 100 coordinate space and stretched to the
 * piece's real footprint by the planner, so plans stay crisp at any zoom and
 * survive the PNG export (no external images, no CORS).
 */

export type FurnitureDef = {
  kind: string;
  label: string;
  w: number; // feet
  h: number; // feet
  color: string;
  glyph: GlyphKind;
  category: Category;
};

export type Category =
  | "Living room"
  | "Dining"
  | "Kitchen"
  | "Bedroom"
  | "Bathroom"
  | "Office"
  | "Storage"
  | "Outdoor & extras";

type GlyphKind =
  | "sofa" | "sectional" | "loveseat" | "armchair" | "recliner" | "ottoman" | "bench"
  | "coffee-table" | "side-table" | "console" | "tv" | "tv-unit" | "rug" | "round-rug"
  | "floor-lamp" | "fireplace" | "piano" | "bookcase"
  | "table-rect" | "table-round" | "chair" | "stool" | "sideboard"
  | "counter" | "island" | "sink" | "fridge" | "range" | "dishwasher" | "microwave" | "pantry"
  | "bed" | "crib" | "nightstand" | "wardrobe" | "dresser" | "mirror"
  | "desk" | "l-desk" | "office-chair" | "filing-cabinet" | "shelving"
  | "vanity" | "double-vanity" | "bathtub" | "shower" | "toilet" | "pedestal-sink"
  | "washer" | "dryer" | "plant" | "tree-plant" | "stairs" | "column" | "pet-bed"
  | "grill" | "patio-set" | "bike" | "closet";

/* ------------------------------------------------------------ colour utils */

function hex2rgb(h: string) {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)] as const;
}
function mix(a: string, b: string, t: number) {
  const [r1, g1, b1] = hex2rgb(a);
  const [r2, g2, b2] = hex2rgb(b);
  const p = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${p(r1, r2)}${p(g1, g2)}${p(b1, b2)}`;
}
const dark = (c: string, t = 0.28) => mix(c, "#000000", t);
const light = (c: string, t = 0.3) => mix(c, "#ffffff", t);
const INK = "#3a352e";

/* ------------------------------------------------------------ the catalogue */

export const FURNITURE: FurnitureDef[] = [
  // Living room
  { kind: "sofa", label: "Sofa (3 seat)", w: 7, h: 3, color: "#8a6f52", glyph: "sofa", category: "Living room" },
  { kind: "sectional", label: "Sectional", w: 9, h: 7, color: "#8a6f52", glyph: "sectional", category: "Living room" },
  { kind: "loveseat", label: "Loveseat", w: 5, h: 3, color: "#9c8266", glyph: "loveseat", category: "Living room" },
  { kind: "armchair", label: "Armchair", w: 3, h: 3, color: "#a68f74", glyph: "armchair", category: "Living room" },
  { kind: "recliner", label: "Recliner", w: 3.2, h: 3.5, color: "#8d7358", glyph: "recliner", category: "Living room" },
  { kind: "ottoman", label: "Ottoman", w: 2.5, h: 2, color: "#a89478", glyph: "ottoman", category: "Living room" },
  { kind: "bench", label: "Bench", w: 4, h: 1.5, color: "#8a7454", glyph: "bench", category: "Living room" },
  { kind: "coffee-table", label: "Coffee table", w: 4, h: 2, color: "#6d5b47", glyph: "coffee-table", category: "Living room" },
  { kind: "side-table", label: "Side table", w: 1.7, h: 1.7, color: "#7b6852", glyph: "side-table", category: "Living room" },
  { kind: "console", label: "Console table", w: 4.5, h: 1.3, color: "#6d5b47", glyph: "console", category: "Living room" },
  { kind: "tv-unit", label: "TV unit", w: 6, h: 1.5, color: "#4c4741", glyph: "tv-unit", category: "Living room" },
  { kind: "tv", label: "TV (wall)", w: 4.5, h: 0.5, color: "#2f2d2b", glyph: "tv", category: "Living room" },
  { kind: "rug-8x10", label: "Rug 8×10", w: 10, h: 8, color: "#cbbda8", glyph: "rug", category: "Living room" },
  { kind: "rug-5x8", label: "Rug 5×8", w: 8, h: 5, color: "#cbbda8", glyph: "rug", category: "Living room" },
  { kind: "rug-round", label: "Round rug 8ft", w: 8, h: 8, color: "#cbbda8", glyph: "round-rug", category: "Living room" },
  { kind: "floor-lamp", label: "Floor lamp", w: 1.4, h: 1.4, color: "#c9a961", glyph: "floor-lamp", category: "Living room" },
  { kind: "fireplace", label: "Fireplace", w: 4.5, h: 1.6, color: "#7a7268", glyph: "fireplace", category: "Living room" },
  { kind: "piano", label: "Upright piano", w: 5, h: 2.2, color: "#3f3a35", glyph: "piano", category: "Living room" },
  { kind: "bookcase", label: "Bookcase", w: 3, h: 1.2, color: "#5d5140", glyph: "bookcase", category: "Living room" },

  // Dining
  { kind: "dining-table", label: "Dining table (6)", w: 6, h: 3.3, color: "#7a6144", glyph: "table-rect", category: "Dining" },
  { kind: "dining-table-8", label: "Dining table (8)", w: 8, h: 3.5, color: "#7a6144", glyph: "table-rect", category: "Dining" },
  { kind: "dining-round", label: "Round table", w: 4.5, h: 4.5, color: "#7a6144", glyph: "table-round", category: "Dining" },
  { kind: "chair", label: "Dining chair", w: 1.6, h: 1.6, color: "#8d7a63", glyph: "chair", category: "Dining" },
  { kind: "bar-stool", label: "Bar stool", w: 1.4, h: 1.4, color: "#8d7a63", glyph: "stool", category: "Dining" },
  { kind: "sideboard", label: "Sideboard", w: 5, h: 1.6, color: "#6b5a44", glyph: "sideboard", category: "Dining" },
  { kind: "china-cabinet", label: "China cabinet", w: 4, h: 1.6, color: "#5d5140", glyph: "shelving", category: "Dining" },

  // Kitchen
  { kind: "kitchen-island", label: "Kitchen island", w: 7, h: 3.3, color: "#5f5a53", glyph: "island", category: "Kitchen" },
  { kind: "counter", label: "Counter run", w: 8, h: 2, color: "#6b665e", glyph: "counter", category: "Kitchen" },
  { kind: "sink", label: "Kitchen sink", w: 3, h: 2, color: "#9aa1a8", glyph: "sink", category: "Kitchen" },
  { kind: "fridge", label: "Fridge", w: 3, h: 2.5, color: "#8f9297", glyph: "fridge", category: "Kitchen" },
  { kind: "range", label: "Range / cooktop", w: 2.5, h: 2.2, color: "#8f9297", glyph: "range", category: "Kitchen" },
  { kind: "dishwasher", label: "Dishwasher", w: 2, h: 2, color: "#8f9297", glyph: "dishwasher", category: "Kitchen" },
  { kind: "microwave", label: "Microwave", w: 2, h: 1.4, color: "#8f9297", glyph: "microwave", category: "Kitchen" },
  { kind: "pantry", label: "Pantry", w: 3, h: 2, color: "#6b5a44", glyph: "pantry", category: "Kitchen" },

  // Bedroom
  { kind: "bed-king", label: "King bed", w: 6.3, h: 6.7, color: "#9b8a76", glyph: "bed", category: "Bedroom" },
  { kind: "bed-queen", label: "Queen bed", w: 5, h: 6.7, color: "#9b8a76", glyph: "bed", category: "Bedroom" },
  { kind: "bed-full", label: "Full bed", w: 4.5, h: 6.3, color: "#9b8a76", glyph: "bed", category: "Bedroom" },
  { kind: "bed-single", label: "Single bed", w: 3.2, h: 6.3, color: "#9b8a76", glyph: "bed", category: "Bedroom" },
  { kind: "crib", label: "Crib", w: 2.5, h: 4.5, color: "#a5937c", glyph: "crib", category: "Bedroom" },
  { kind: "nightstand", label: "Nightstand", w: 1.7, h: 1.5, color: "#7b6852", glyph: "nightstand", category: "Bedroom" },
  { kind: "dresser", label: "Dresser", w: 5, h: 1.7, color: "#665845", glyph: "dresser", category: "Bedroom" },
  { kind: "wardrobe", label: "Wardrobe", w: 6, h: 2, color: "#665845", glyph: "wardrobe", category: "Bedroom" },
  { kind: "mirror", label: "Floor mirror", w: 2, h: 0.6, color: "#b8c4c9", glyph: "mirror", category: "Bedroom" },

  // Bathroom
  { kind: "vanity", label: "Bath vanity", w: 4, h: 1.8, color: "#6b665e", glyph: "vanity", category: "Bathroom" },
  { kind: "double-vanity", label: "Double vanity", w: 6, h: 1.8, color: "#6b665e", glyph: "double-vanity", category: "Bathroom" },
  { kind: "bathtub", label: "Bathtub", w: 5, h: 2.6, color: "#adb5bd", glyph: "bathtub", category: "Bathroom" },
  { kind: "shower", label: "Shower", w: 3, h: 3, color: "#adb5bd", glyph: "shower", category: "Bathroom" },
  { kind: "toilet", label: "Toilet", w: 1.6, h: 2.4, color: "#c3cad0", glyph: "toilet", category: "Bathroom" },
  { kind: "pedestal-sink", label: "Pedestal sink", w: 1.8, h: 1.6, color: "#c3cad0", glyph: "pedestal-sink", category: "Bathroom" },
  { kind: "washer", label: "Washer", w: 2.3, h: 2.3, color: "#9aa1a8", glyph: "washer", category: "Bathroom" },
  { kind: "dryer", label: "Dryer", w: 2.3, h: 2.3, color: "#9aa1a8", glyph: "dryer", category: "Bathroom" },

  // Office
  { kind: "desk", label: "Desk", w: 5, h: 2.5, color: "#6d5b47", glyph: "desk", category: "Office" },
  { kind: "l-desk", label: "L-shaped desk", w: 5.5, h: 5, color: "#6d5b47", glyph: "l-desk", category: "Office" },
  { kind: "office-chair", label: "Office chair", w: 2.2, h: 2.2, color: "#4f4b46", glyph: "office-chair", category: "Office" },
  { kind: "filing-cabinet", label: "Filing cabinet", w: 1.5, h: 2, color: "#6b665e", glyph: "filing-cabinet", category: "Office" },
  { kind: "shelving", label: "Shelving unit", w: 3.5, h: 1.2, color: "#5d5140", glyph: "shelving", category: "Office" },

  // Storage
  { kind: "closet", label: "Closet", w: 5, h: 2.2, color: "#7c6f5c", glyph: "closet", category: "Storage" },
  { kind: "column", label: "Column", w: 1.2, h: 1.2, color: "#8d867c", glyph: "column", category: "Storage" },
  { kind: "stairs", label: "Stairs", w: 3.5, h: 9, color: "#9a9185", glyph: "stairs", category: "Storage" },

  // Outdoor & extras
  { kind: "plant", label: "Plant", w: 1.5, h: 1.5, color: "#6f8f6a", glyph: "plant", category: "Outdoor & extras" },
  { kind: "tree-plant", label: "Large plant", w: 2.5, h: 2.5, color: "#5f8159", glyph: "tree-plant", category: "Outdoor & extras" },
  { kind: "pet-bed", label: "Pet bed", w: 2.5, h: 2, color: "#a08a6f", glyph: "pet-bed", category: "Outdoor & extras" },
  { kind: "patio-set", label: "Patio set", w: 5, h: 5, color: "#7e8a73", glyph: "patio-set", category: "Outdoor & extras" },
  { kind: "grill", label: "Grill", w: 3, h: 2, color: "#55565a", glyph: "grill", category: "Outdoor & extras" },
  { kind: "bike", label: "Bike", w: 5.5, h: 1.6, color: "#5d6672", glyph: "bike", category: "Outdoor & extras" },
];

export const CATEGORIES: Category[] = [
  "Living room", "Dining", "Kitchen", "Bedroom", "Bathroom", "Office", "Storage", "Outdoor & extras",
];

export const byKind = (kind: string) => FURNITURE.find((f) => f.kind === kind);

/* ------------------------------------------------------------ glyph drawing */

/** Draws the piece seen from above, inside a 100 x 100 box. */
export function FurnitureGlyph({ glyph, color }: { glyph: GlyphKind; color: string }) {
  const c = color;
  const d = dark(c);
  const dd = dark(c, 0.45);
  const l = light(c);
  const ll = light(c, 0.55);
  const line = { fill: "none", stroke: dd, strokeWidth: 2 } as const;

  switch (glyph) {
    case "sofa":
    case "loveseat":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={8} fill={d} />
          <rect x={0} y={0} width={100} height={30} fill={dd} />
          <rect x={0} y={22} width={13} height={78} rx={5} fill={dd} />
          <rect x={87} y={22} width={13} height={78} rx={5} fill={dd} />
          {(glyph === "sofa" ? [0, 1, 2] : [0, 1]).map((i, _, arr) => {
            const gap = 4;
            const span = (74 - gap * (arr.length - 1)) / arr.length;
            return <rect key={i} x={13 + i * (span + gap)} y={32} width={span} height={58} rx={5} fill={ll} />;
          })}
        </>
      );
    case "sectional":
      return (
        <>
          <path d="M0 0 H100 V100 H60 V40 H0 Z" fill={d} />
          <path d="M0 0 H100 V16 H16 V40 H0 Z" fill={dd} />
          <rect x={20} y={20} width={34} height={16} rx={4} fill={ll} />
          <rect x={58} y={20} width={38} height={16} rx={4} fill={ll} />
          <rect x={66} y={44} width={30} height={24} rx={4} fill={ll} />
          <rect x={66} y={72} width={30} height={24} rx={4} fill={ll} />
        </>
      );
    case "armchair":
    case "recliner":
      return (
        <>
          <rect x={4} y={0} width={92} height={100} rx={10} fill={d} />
          <rect x={4} y={0} width={92} height={26} rx={8} fill={dd} />
          <rect x={4} y={20} width={16} height={80} rx={7} fill={dd} />
          <rect x={80} y={20} width={16} height={80} rx={7} fill={dd} />
          <rect x={22} y={30} width={56} height={62} rx={8} fill={ll} />
        </>
      );
    case "ottoman":
      return (
        <>
          <rect x={2} y={2} width={96} height={96} rx={10} fill={l} />
          <rect x={10} y={10} width={80} height={80} rx={8} fill={c} />
          <path d="M10 50 H90 M50 10 V90" {...line} />
        </>
      );
    case "bench":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={5} fill={c} />
          {[12, 32, 52, 72].map((y) => <rect key={y} x={4} y={y} width={92} height={14} rx={3} fill={ll} />)}
        </>
      );
    case "coffee-table":
    case "console":
    case "table-rect":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={4} fill={c} />
          <rect x={7} y={9} width={86} height={82} rx={3} fill={l} />
          <rect x={14} y={17} width={72} height={66} rx={2} fill="none" stroke={d} strokeWidth={2} />
        </>
      );
    case "side-table":
    case "nightstand":
      return (
        <>
          <rect x={2} y={2} width={96} height={96} rx={6} fill={c} />
          <rect x={12} y={12} width={76} height={76} rx={4} fill={l} />
          <circle cx={50} cy={50} r={7} fill={dd} />
        </>
      );
    case "table-round":
      return (
        <>
          <ellipse cx={50} cy={50} rx={49} ry={49} fill={c} />
          <ellipse cx={50} cy={50} rx={40} ry={40} fill={l} />
          <ellipse cx={50} cy={50} rx={22} ry={22} fill="none" stroke={d} strokeWidth={2} />
        </>
      );
    case "chair":
      return (
        <>
          <rect x={10} y={18} width={80} height={78} rx={8} fill={c} />
          <rect x={20} y={28} width={60} height={58} rx={6} fill={ll} />
          <rect x={6} y={0} width={88} height={16} rx={7} fill={dd} />
        </>
      );
    case "stool":
    case "office-chair":
      return (
        <>
          <circle cx={50} cy={54} r={40} fill={c} />
          <circle cx={50} cy={54} r={28} fill={ll} />
          {glyph === "office-chair" && <path d="M14 30 A44 44 0 0 1 86 30" fill="none" stroke={dd} strokeWidth={11} strokeLinecap="round" />}
        </>
      );
    case "sideboard":
    case "dresser":
    case "pantry":
    case "filing-cabinet":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={4} fill={c} />
          <rect x={4} y={6} width={44} height={88} rx={3} fill={l} />
          <rect x={52} y={6} width={44} height={88} rx={3} fill={l} />
          <circle cx={42} cy={50} r={5} fill={dd} />
          <circle cx={58} cy={50} r={5} fill={dd} />
        </>
      );
    case "wardrobe":
    case "closet":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={3} fill={c} />
          <rect x={3} y={6} width={30} height={88} rx={2} fill={l} />
          <rect x={35} y={6} width={30} height={88} rx={2} fill={l} />
          <rect x={67} y={6} width={30} height={88} rx={2} fill={l} />
          <path d="M0 78 H100" {...line} />
        </>
      );
    case "bookcase":
    case "shelving":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={3} fill={c} />
          <rect x={4} y={8} width={92} height={84} fill={l} />
          {[16, 34, 52, 70].map((x, i) => (
            <rect key={x} x={x} y={16} width={12} height={68} rx={2} fill={i % 2 ? dd : d} />
          ))}
        </>
      );
    case "tv-unit":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={4} fill={c} />
          <rect x={5} y={12} width={90} height={76} rx={3} fill={l} />
          <rect x={22} y={0} width={56} height={16} rx={3} fill="#2f2d2b" />
        </>
      );
    case "tv":
      return (
        <>
          <rect x={0} y={20} width={100} height={60} rx={4} fill="#2f2d2b" />
          <rect x={6} y={32} width={88} height={36} rx={2} fill="#4d5661" />
        </>
      );
    case "rug":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={3} fill={c} />
          <rect x={7} y={9} width={86} height={82} fill="none" stroke={d} strokeWidth={4} />
          <rect x={18} y={22} width={64} height={56} fill="none" stroke={d} strokeWidth={2} strokeDasharray="6 5" />
        </>
      );
    case "round-rug":
      return (
        <>
          <circle cx={50} cy={50} r={50} fill={c} />
          <circle cx={50} cy={50} r={38} fill="none" stroke={d} strokeWidth={4} />
          <circle cx={50} cy={50} r={22} fill="none" stroke={d} strokeWidth={2} strokeDasharray="6 5" />
        </>
      );
    case "floor-lamp":
      return (
        <>
          <circle cx={50} cy={50} r={44} fill={l} />
          <circle cx={50} cy={50} r={26} fill={c} />
          <circle cx={50} cy={50} r={8} fill={dd} />
        </>
      );
    case "fireplace":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} fill={c} />
          <path d="M14 100 V44 A36 36 0 0 1 86 44 V100 Z" fill="#3b3733" />
          <path d="M34 100 V56 A16 16 0 0 1 66 56 V100 Z" fill="#c2703a" />
        </>
      );
    case "piano":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={4} fill={c} />
          <rect x={4} y={52} width={92} height={40} fill="#f4f1ea" />
          {Array.from({ length: 13 }, (_, i) => (
            <rect key={i} x={6 + i * 7} y={52} width={2} height={26} fill="#2b2926" />
          ))}
        </>
      );
    case "counter":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} fill={c} />
          <rect x={0} y={0} width={100} height={14} fill={dd} />
          <rect x={4} y={20} width={92} height={74} rx={2} fill={l} />
        </>
      );
    case "island":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={4} fill={c} />
          <rect x={5} y={8} width={90} height={84} rx={3} fill={l} />
          <rect x={30} y={26} width={40} height={30} rx={5} fill={ll} stroke={dd} strokeWidth={2} />
          <circle cx={50} cy={68} r={5} fill={dd} />
        </>
      );
    case "sink":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={4} fill={c} />
          <rect x={8} y={16} width={38} height={68} rx={6} fill={ll} stroke={dd} strokeWidth={2} />
          <rect x={54} y={16} width={38} height={68} rx={6} fill={ll} stroke={dd} strokeWidth={2} />
          <circle cx={27} cy={50} r={5} fill={dd} />
          <circle cx={73} cy={50} r={5} fill={dd} />
        </>
      );
    case "pedestal-sink":
      return (
        <>
          <rect x={4} y={4} width={92} height={92} rx={12} fill={c} />
          <ellipse cx={50} cy={56} rx={34} ry={30} fill={ll} stroke={dd} strokeWidth={2} />
          <circle cx={50} cy={56} r={6} fill={dd} />
          <rect x={42} y={8} width={16} height={12} rx={4} fill={dd} />
        </>
      );
    case "fridge":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={5} fill={c} />
          <rect x={5} y={6} width={90} height={88} rx={4} fill={l} />
          <path d="M50 6 V94" stroke={dd} strokeWidth={3} />
          <rect x={42} y={26} width={5} height={48} rx={2} fill={dd} />
          <rect x={53} y={26} width={5} height={48} rx={2} fill={dd} />
        </>
      );
    case "range":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={4} fill={c} />
          <rect x={5} y={16} width={90} height={78} rx={3} fill={l} />
          {[[32, 42], [68, 42], [32, 74], [68, 74]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={13} fill="none" stroke={dd} strokeWidth={3} />
          ))}
          <rect x={12} y={4} width={76} height={8} rx={4} fill={dd} />
        </>
      );
    case "dishwasher":
    case "washer":
    case "dryer":
    case "microwave":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={4} fill={c} />
          <rect x={5} y={6} width={90} height={88} rx={3} fill={l} />
          <circle cx={50} cy={56} r={26} fill="none" stroke={dd} strokeWidth={4} />
          <rect x={14} y={14} width={72} height={8} rx={4} fill={dd} />
        </>
      );
    case "bed":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={5} fill={ll} stroke={d} strokeWidth={2} />
          <rect x={-2} y={0} width={104} height={10} rx={3} fill={dd} />
          <rect x={7} y={12} width={38} height={20} rx={5} fill={l} stroke={d} strokeWidth={1.5} />
          <rect x={55} y={12} width={38} height={20} rx={5} fill={l} stroke={d} strokeWidth={1.5} />
          <rect x={0} y={40} width={100} height={60} rx={4} fill={c} />
          <path d="M0 52 H100" stroke={dd} strokeWidth={2} />
        </>
      );
    case "crib":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={8} fill={c} />
          <rect x={9} y={9} width={82} height={82} rx={5} fill={ll} />
          {[20, 35, 50, 65, 80].map((y) => <path key={y} d={`M9 ${y} H91`} stroke={l} strokeWidth={3} />)}
        </>
      );
    case "mirror":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={4} fill={dark(c, 0.2)} />
          <rect x={5} y={16} width={90} height={68} fill="#dfe8ec" />
          <path d="M20 84 L60 16 M45 84 L85 16" stroke="#ffffff" strokeWidth={6} opacity={0.7} />
        </>
      );
    case "desk":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={4} fill={c} />
          <rect x={4} y={6} width={92} height={88} rx={3} fill={l} />
          <rect x={62} y={12} width={30} height={76} rx={2} fill={c} />
          <path d="M62 50 H92" stroke={dd} strokeWidth={2} />
          <rect x={14} y={22} width={34} height={22} rx={2} fill="#2f2d2b" />
        </>
      );
    case "l-desk":
      return (
        <>
          <path d="M0 0 H100 V34 H34 V100 H0 Z" fill={c} />
          <path d="M4 4 H96 V30 H30 V96 H4 Z" fill={l} />
          <rect x={44} y={8} width={30} height={18} rx={2} fill="#2f2d2b" />
        </>
      );
    case "vanity":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={4} fill={c} />
          <rect x={4} y={8} width={92} height={84} rx={3} fill={l} />
          <ellipse cx={50} cy={54} rx={26} ry={22} fill={ll} stroke={dd} strokeWidth={2} />
          <circle cx={50} cy={54} r={5} fill={dd} />
          <rect x={44} y={12} width={12} height={9} rx={4} fill={dd} />
        </>
      );
    case "double-vanity":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={4} fill={c} />
          <rect x={3} y={8} width={94} height={84} rx={3} fill={l} />
          {[27, 73].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy={54} rx={18} ry={20} fill={ll} stroke={dd} strokeWidth={2} />
              <circle cx={x} cy={54} r={4} fill={dd} />
              <rect x={x - 5} y={12} width={10} height={8} rx={4} fill={dd} />
            </g>
          ))}
        </>
      );
    case "bathtub":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={12} fill={c} />
          <rect x={7} y={9} width={86} height={82} rx={10} fill="#f2f6f8" stroke={dd} strokeWidth={2} />
          <circle cx={80} cy={50} r={5} fill={dd} />
          <rect x={2} y={42} width={9} height={16} rx={4} fill={dd} />
        </>
      );
    case "shower":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} rx={4} fill="#eef3f6" stroke={dd} strokeWidth={3} />
          <path d="M0 0 L100 100 M100 0 L0 100" stroke={c} strokeWidth={2} opacity={0.6} />
          <circle cx={50} cy={50} r={8} fill="none" stroke={dd} strokeWidth={3} />
          <rect x={0} y={88} width={100} height={12} fill={c} opacity={0.5} />
        </>
      );
    case "toilet":
      return (
        <>
          <rect x={16} y={0} width={68} height={26} rx={5} fill={c} stroke={dd} strokeWidth={2} />
          <ellipse cx={50} cy={62} rx={33} ry={36} fill="#f2f6f8" stroke={dd} strokeWidth={2} />
          <ellipse cx={50} cy={64} rx={20} ry={24} fill={light(c, 0.6)} stroke={dd} strokeWidth={2} />
        </>
      );
    case "plant":
    case "tree-plant":
      return (
        <>
          <circle cx={50} cy={50} r={48} fill={light(c, 0.45)} />
          {[[50, 22], [26, 44], [74, 44], [34, 74], [66, 74]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={glyph === "plant" ? 18 : 21} fill={c} />
          ))}
          <circle cx={50} cy={50} r={13} fill={dark("#8a6f52", 0.1)} />
        </>
      );
    case "pet-bed":
      return (
        <>
          <ellipse cx={50} cy={50} rx={49} ry={48} fill={c} />
          <ellipse cx={50} cy={54} rx={35} ry={33} fill={ll} />
        </>
      );
    case "patio-set":
      return (
        <>
          <circle cx={50} cy={50} r={26} fill={c} />
          <circle cx={50} cy={50} r={17} fill={ll} />
          {[[50, 10], [50, 90], [10, 50], [90, 50]].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x - 11} y={y - 11} width={22} height={22} rx={6} fill={d} />
          ))}
        </>
      );
    case "grill":
      return (
        <>
          <rect x={0} y={8} width={100} height={84} rx={10} fill={c} />
          <rect x={10} y={20} width={80} height={60} rx={6} fill="#2e3033" />
          {[28, 40, 52, 64, 76].map((y) => <path key={y} d={`M14 ${y} H86`} stroke="#7d838b" strokeWidth={4} />)}
        </>
      );
    case "bike":
      return (
        <>
          <circle cx={20} cy={50} r={26} fill="none" stroke={c} strokeWidth={7} />
          <circle cx={80} cy={50} r={26} fill="none" stroke={c} strokeWidth={7} />
          <path d="M20 50 L44 22 L66 50 L44 50 Z" fill="none" stroke={dd} strokeWidth={6} />
          <path d="M66 50 L80 50" stroke={dd} strokeWidth={6} />
        </>
      );
    case "stairs":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} fill={c} />
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M0 ${(i + 1) * 10} H100`} stroke={dd} strokeWidth={3} />
          ))}
          <path d="M50 88 V22 M50 22 L40 34 M50 22 L60 34" fill="none" stroke={INK} strokeWidth={4} />
        </>
      );
    case "column":
      return (
        <>
          <rect x={0} y={0} width={100} height={100} fill={c} />
          <circle cx={50} cy={50} r={34} fill={l} stroke={dd} strokeWidth={3} />
        </>
      );
    default:
      return <rect x={0} y={0} width={100} height={100} rx={4} fill={c} />;
  }
}
