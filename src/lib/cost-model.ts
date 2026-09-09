/**
 * Transparent cost model behind the Intearior budget estimator.
 *
 * Everything here is an ESTIMATE, never a quote. The base per-square-foot
 * ranges are typical published US interior design / remodelling ranges; they
 * are then adjusted for room type, project scope, finish level (style) and a
 * regional cost index. Where studios listed on Intearior publish their own
 * typical project budget, we show that alongside the model output with the
 * sample size, so the visitor can see how thin or thick the evidence is.
 */

export type ScopeSlug = "styling" | "refresh" | "remodel" | "gut";
export type RoomSlug =
  | "kitchen"
  | "bathroom"
  | "primary-bath"
  | "living-room"
  | "dining-room"
  | "bedroom"
  | "primary-suite"
  | "home-office"
  | "basement"
  | "outdoor"
  | "whole-home";

export const SCOPES: { slug: ScopeSlug; label: string; desc: string; perSqFt: [number, number] }[] = [
  {
    slug: "styling",
    label: "Furnishing & styling only",
    desc: "No construction — furniture, lighting, textiles, art and styling.",
    perSqFt: [25, 90],
  },
  {
    slug: "refresh",
    label: "Refresh",
    desc: "Paint, lighting, soft finishes and new furnishings. Nothing structural.",
    perSqFt: [55, 160],
  },
  {
    slug: "remodel",
    label: "Remodel",
    desc: "New cabinetry, tile, fixtures and finishes; layout largely unchanged.",
    perSqFt: [150, 380],
  },
  {
    slug: "gut",
    label: "Gut renovation",
    desc: "Down to the studs — new layout, systems, joinery and finishes.",
    perSqFt: [300, 700],
  },
];

export const ROOMS: { slug: RoomSlug; label: string; factor: number; typicalSqFt: number }[] = [
  { slug: "kitchen", label: "Kitchen", factor: 2.0, typicalSqFt: 200 },
  { slug: "bathroom", label: "Bathroom", factor: 1.85, typicalSqFt: 60 },
  { slug: "primary-bath", label: "Primary bathroom", factor: 2.1, typicalSqFt: 120 },
  { slug: "living-room", label: "Living room", factor: 1.0, typicalSqFt: 320 },
  { slug: "dining-room", label: "Dining room", factor: 0.9, typicalSqFt: 220 },
  { slug: "bedroom", label: "Bedroom", factor: 0.85, typicalSqFt: 180 },
  { slug: "primary-suite", label: "Primary suite", factor: 1.05, typicalSqFt: 350 },
  { slug: "home-office", label: "Home office", factor: 0.95, typicalSqFt: 150 },
  { slug: "basement", label: "Basement", factor: 0.8, typicalSqFt: 700 },
  { slug: "outdoor", label: "Outdoor / patio", factor: 0.7, typicalSqFt: 300 },
  { slug: "whole-home", label: "Whole home", factor: 0.85, typicalSqFt: 2200 },
];

/** Finish-level multiplier by design style. Anything not listed is 1.0. */
const STYLE_FACTOR: Record<string, number> = {
  "contemporary-luxury": 1.35,
  "hollywood-regency": 1.25,
  "art-deco": 1.2,
  victorian: 1.2,
  "english-country": 1.15,
  "french-country": 1.15,
  traditional: 1.1,
  "organic-modern": 1.1,
  japandi: 1.05,
  "warm-minimalism": 1.05,
  modern: 1.0,
  contemporary: 1.0,
  transitional: 1.0,
  scandinavian: 0.95,
  minimalist: 0.95,
  farmhouse: 0.95,
  bohemian: 0.9,
  rustic: 0.95,
  coastal: 1.0,
  industrial: 0.95,
};

export type UsState = { code: string; name: string; slug: string; index: number };

/** Regional cost index — 1.00 is the national average. */
export const US_STATES: UsState[] = [
  ["AL", "Alabama", 0.9], ["AK", "Alaska", 1.22], ["AZ", "Arizona", 0.98],
  ["AR", "Arkansas", 0.88], ["CA", "California", 1.3], ["CO", "Colorado", 1.08],
  ["CT", "Connecticut", 1.15], ["DE", "Delaware", 1.02], ["DC", "District of Columbia", 1.25],
  ["FL", "Florida", 1.03], ["GA", "Georgia", 0.95], ["HI", "Hawaii", 1.35],
  ["ID", "Idaho", 0.95], ["IL", "Illinois", 1.05], ["IN", "Indiana", 0.9],
  ["IA", "Iowa", 0.88], ["KS", "Kansas", 0.88], ["KY", "Kentucky", 0.89],
  ["LA", "Louisiana", 0.92], ["ME", "Maine", 1.02], ["MD", "Maryland", 1.1],
  ["MA", "Massachusetts", 1.22], ["MI", "Michigan", 0.94], ["MN", "Minnesota", 1.0],
  ["MS", "Mississippi", 0.86], ["MO", "Missouri", 0.9], ["MT", "Montana", 0.96],
  ["NE", "Nebraska", 0.89], ["NV", "Nevada", 1.02], ["NH", "New Hampshire", 1.08],
  ["NJ", "New Jersey", 1.18], ["NM", "New Mexico", 0.92], ["NY", "New York", 1.28],
  ["NC", "North Carolina", 0.95], ["ND", "North Dakota", 0.92], ["OH", "Ohio", 0.92],
  ["OK", "Oklahoma", 0.87], ["OR", "Oregon", 1.08], ["PA", "Pennsylvania", 1.0],
  ["RI", "Rhode Island", 1.1], ["SC", "South Carolina", 0.94], ["SD", "South Dakota", 0.89],
  ["TN", "Tennessee", 0.94], ["TX", "Texas", 0.97], ["UT", "Utah", 0.99],
  ["VT", "Vermont", 1.04], ["VA", "Virginia", 1.03], ["WA", "Washington", 1.12],
  ["WV", "West Virginia", 0.87], ["WI", "Wisconsin", 0.96], ["WY", "Wyoming", 0.93],
].map(([code, name, index]) => ({
  code: code as string,
  name: name as string,
  slug: (name as string).toLowerCase().replace(/\s+/g, "-"),
  index: index as number,
}));

export function stateFromSlug(slug: string): UsState | undefined {
  return US_STATES.find((s) => s.slug === slug.toLowerCase());
}
export function stateFromCode(code: string): UsState | undefined {
  return US_STATES.find((s) => s.code === code.toUpperCase());
}

/** Share of total spend, by scope. Always sums to 1. */
const SPLIT: Record<ScopeSlug, { design: number; furniture: number; materials: number; labour: number }> = {
  styling: { design: 0.2, furniture: 0.68, materials: 0.05, labour: 0.07 },
  refresh: { design: 0.18, furniture: 0.42, materials: 0.2, labour: 0.2 },
  remodel: { design: 0.13, furniture: 0.17, materials: 0.35, labour: 0.35 },
  gut: { design: 0.11, furniture: 0.12, materials: 0.37, labour: 0.4 },
};

export type EstimateInput = {
  room: RoomSlug;
  sqft: number;
  scope: ScopeSlug;
  style?: string;
  stateCode?: string;
};

export type Estimate = {
  low: number;
  typical: number;
  high: number;
  perSqFt: { low: number; high: number };
  breakdown: { label: string; low: number; high: number }[];
  drivers: string[];
};

const round = (n: number) => {
  if (n >= 100000) return Math.round(n / 5000) * 5000;
  if (n >= 20000) return Math.round(n / 1000) * 1000;
  if (n >= 5000) return Math.round(n / 500) * 500;
  return Math.round(n / 100) * 100;
};

export function estimate(input: EstimateInput): Estimate {
  const scope = SCOPES.find((s) => s.slug === input.scope) ?? SCOPES[1]!;
  const room = ROOMS.find((r) => r.slug === input.room) ?? ROOMS[3]!;
  const styleFactor = (input.style && STYLE_FACTOR[input.style]) || 1;
  const st = input.stateCode ? stateFromCode(input.stateCode) : undefined;
  const regionFactor = st?.index ?? 1;
  const sqft = Math.max(20, Math.min(20000, input.sqft || room.typicalSqFt));

  const f = room.factor * styleFactor * regionFactor;
  const lowPsf = scope.perSqFt[0] * f;
  const highPsf = scope.perSqFt[1] * f;
  const low = lowPsf * sqft;
  const high = highPsf * sqft;
  const typical = low + (high - low) * 0.45;

  const split = SPLIT[input.scope];
  const breakdown = [
    { label: "Design fee", key: "design" as const },
    { label: "Furniture & decor", key: "furniture" as const },
    { label: "Materials & fixtures", key: "materials" as const },
    { label: "Labour & installation", key: "labour" as const },
  ].map((b) => ({
    label: b.label,
    low: round(low * split[b.key]),
    high: round(high * split[b.key]),
  }));

  const drivers: string[] = [
    `${room.label} work carries a ${room.factor.toFixed(2)}× cost weighting against a standard living space.`,
    `${scope.label} typically runs $${scope.perSqFt[0]}–$${scope.perSqFt[1]} per square foot before adjustments.`,
  ];
  if (st) drivers.push(`${st.name} sits at ${Math.round(regionFactor * 100)}% of the national cost average.`);
  if (styleFactor !== 1)
    drivers.push(
      styleFactor > 1
        ? `The finish level you picked adds roughly ${Math.round((styleFactor - 1) * 100)}% for materials and joinery.`
        : `The finish level you picked trims roughly ${Math.round((1 - styleFactor) * 100)}% from materials and joinery.`,
    );

  return {
    low: round(low),
    typical: round(typical),
    high: round(high),
    perSqFt: { low: Math.round(lowPsf), high: Math.round(highPsf) },
    breakdown,
    drivers,
  };
}

export function money(n: number): string {
  return n >= 1000 ? `$${Math.round(n / 1000).toLocaleString()}k` : `$${n.toLocaleString()}`;
}

export function moneyExact(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}
