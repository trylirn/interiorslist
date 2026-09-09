export type Hsl = { h: number; s: number; l: number };

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
    else if (max === gg) h = ((bb - rr) / d + 2) / 6;
    else h = ((rr - gg) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const hh = ((h % 360) + 360) % 360 / 360;
  const ss = Math.max(0, Math.min(100, s)) / 100;
  const ll = Math.max(0, Math.min(100, l)) / 100;
  if (ss === 0) {
    const v = ll * 255;
    return rgbToHex(v, v, v);
  }
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  const f = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return rgbToHex(f(hh + 1 / 3) * 255, f(hh) * 255, f(hh - 1 / 3) * 255);
}

export function hexToHsl(hex: string): Hsl {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

export type Harmony =
  | "complementary" | "analogous" | "triad" | "split-complementary" | "monochrome" | "tetradic";

export const HARMONIES: { slug: Harmony; label: string; desc: string }[] = [
  { slug: "analogous", label: "Analogous", desc: "Neighbouring hues — calm, cohesive rooms." },
  { slug: "complementary", label: "Complementary", desc: "Opposite hues — high contrast accents." },
  { slug: "split-complementary", label: "Split complementary", desc: "Contrast, softened." },
  { slug: "triad", label: "Triad", desc: "Three evenly spaced hues — lively but balanced." },
  { slug: "tetradic", label: "Tetradic", desc: "Two complementary pairs — for layered schemes." },
  { slug: "monochrome", label: "Monochrome", desc: "One hue, many values — quiet and tonal." },
];

const OFFSETS: Record<Harmony, number[]> = {
  complementary: [0, 180, 0, 180, 0],
  analogous: [0, -30, 30, -60, 60],
  triad: [0, 120, 240, 120, 240],
  "split-complementary": [0, 150, 210, 150, 210],
  monochrome: [0, 0, 0, 0, 0],
  tetradic: [0, 90, 180, 270, 45],
};

const LIGHTNESS: Record<Harmony, number[]> = {
  complementary: [0, 0, 22, -18, 34],
  analogous: [0, 10, -10, 22, -20],
  triad: [0, 8, -8, 26, -24],
  "split-complementary": [0, 10, -10, 24, -22],
  monochrome: [0, 18, -16, 32, -28],
  tetradic: [0, 8, -8, 20, -18],
};

/** Build a 5-swatch palette from a base colour and a harmony rule. */
export function buildPalette(baseHex: string, harmony: Harmony): string[] {
  const base = hexToHsl(baseHex);
  return OFFSETS[harmony].map((off, i) =>
    hslToHex({
      h: base.h + off,
      s: harmony === "monochrome" ? base.s : Math.max(8, Math.min(96, base.s + (i % 2 ? -6 : 6))),
      l: Math.max(10, Math.min(94, base.l + (LIGHTNESS[harmony][i] ?? 0))),
    }),
  );
}

/** Nine-step value ladder for a single swatch. */
export function shadeLadder(hex: string): string[] {
  const { h, s } = hexToHsl(hex);
  return [95, 86, 76, 65, 54, 44, 34, 24, 14].map((l) => hslToHex({ h, s, l }));
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

export function readableOn(hex: string): string {
  return contrastRatio(hex, "#ffffff") >= 3.2 ? "#ffffff" : "#111111";
}

export function randomHex(): string {
  return hslToHex({ h: Math.random() * 360, s: 25 + Math.random() * 55, l: 35 + Math.random() * 35 });
}
