import hero from "@/assets/hero.jpg.asset.json";
import modern from "@/assets/modern.jpg.asset.json";
import midCentury from "@/assets/mid-century.jpg.asset.json";
import traditional from "@/assets/traditional.jpg.asset.json";
import farmhouse from "@/assets/farmhouse.jpg.asset.json";
import coastal from "@/assets/coastal.jpg.asset.json";
import minimalist from "@/assets/minimalist.jpg.asset.json";
import industrial from "@/assets/industrial.jpg.asset.json";
import luxury from "@/assets/luxury.jpg.asset.json";
import transitional from "@/assets/transitional.jpg.asset.json";
import maximalist from "@/assets/maximalist.jpg.asset.json";
import scandinavian from "@/assets/scandinavian.jpg.asset.json";
import eclectic from "@/assets/eclectic.jpg.asset.json";
import studio from "@/assets/studio.jpg.asset.json";
import consult from "@/assets/consult.jpg.asset.json";
import contemporary from "@/assets/contemporary.jpg.asset.json";
import bohemian from "@/assets/bohemian.jpg.asset.json";
import artDeco from "@/assets/art-deco.jpg.asset.json";
import rustic from "@/assets/rustic.jpg.asset.json";
import mediterranean from "@/assets/mediterranean.jpg.asset.json";
import frenchCountry from "@/assets/french-country.jpg.asset.json";
import japandi from "@/assets/japandi.jpg.asset.json";
import shaker from "@/assets/shaker.jpg.asset.json";
import hollywoodRegency from "@/assets/hollywood-regency.jpg.asset.json";
import southwestern from "@/assets/southwestern.jpg.asset.json";
import englishCountry from "@/assets/english-country.jpg.asset.json";
import organicModern from "@/assets/organic-modern.jpg.asset.json";
import victorian from "@/assets/victorian.jpg.asset.json";
import tropical from "@/assets/tropical.jpg.asset.json";
import grandmillennial from "@/assets/grandmillennial.jpg.asset.json";
import biophilic from "@/assets/biophilic.jpg.asset.json";
import warmMinimalism from "@/assets/warm-minimalism.jpg.asset.json";
import urbanLoft from "@/assets/urban-loft.jpg.asset.json";

export const HERO_IMAGE = hero.url;
/** Designers at work — material boards, plans, samples. */
export const STUDIO_IMAGE = studio.url;
/** Designer meeting clients — used on guide / how-it-works / match. */
export const CONSULT_IMAGE = consult.url;

/** Editorial photography — one bespoke shot per design style. */
export const STYLE_IMAGES: Record<string, string> = {
  modern: modern.url,
  "mid-century": midCentury.url,
  traditional: traditional.url,
  transitional: transitional.url,
  farmhouse: farmhouse.url,
  industrial: industrial.url,
  coastal: coastal.url,
  minimalist: minimalist.url,
  maximalist: maximalist.url,
  scandinavian: scandinavian.url,
  eclectic: eclectic.url,
  "contemporary-luxury": luxury.url,
  contemporary: contemporary.url,
  bohemian: bohemian.url,
  "art-deco": artDeco.url,
  rustic: rustic.url,
  mediterranean: mediterranean.url,
  "french-country": frenchCountry.url,
  japandi: japandi.url,
  shaker: shaker.url,
  "hollywood-regency": hollywoodRegency.url,
  southwestern: southwestern.url,
  "english-country": englishCountry.url,
  "organic-modern": organicModern.url,
  victorian: victorian.url,
  tropical: tropical.url,
  grandmillennial: grandmillennial.url,
  biophilic: biophilic.url,
  "warm-minimalism": warmMinimalism.url,
  "urban-loft": urbanLoft.url,

};

export function styleImage(slug: string): string {
  return STYLE_IMAGES[slug] ?? modern.url;
}

/** Keyword aliases so free-text option labels resolve to a known style slug. */
const STYLE_ALIASES: Array<[string, string[]]> = [
  ["mid-century", ["mid century", "mid-century", "midcentury", "retro", "1950", "1960"]],
  ["contemporary-luxury", ["luxur", "glam", "opulent", "high-end", "high end", "upscale", "elevated luxe"]],
  ["farmhouse", ["farmhouse", "rustic", "country", "shiplap", "cottage"]],
  ["scandinavian", ["scandi", "nordic", "hygge"]],
  ["minimalist", ["minimal", "pared back", "pared-back", "spare", "zen"]],
  ["maximalist", ["maximal", "bold pattern", "colorful", "colourful", "more is more"]],
  ["industrial", ["industrial", "loft", "brick", "concrete", "warehouse"]],
  ["coastal", ["coastal", "beach", "seaside", "nautical", "hamptons"]],
  ["traditional", ["traditional", "classic", "formal", "antique", "heritage"]],
  ["transitional", ["transitional", "in between", "in-between", "mix of classic and modern"]],
  ["eclectic", ["eclectic", "boho", "bohemian", "collected", "global"]],
  ["modern", ["modern", "contemporary", "clean lines", "sleek"]],
];

/** Best-effort mapping of a free-text style label to a known style slug. */
export function matchStyleSlug(label: string): string | undefined {
  const l = label.toLowerCase();
  for (const [slug, keys] of STYLE_ALIASES) {
    if (keys.some((k) => l.includes(k))) return slug;
  }
  return undefined;
}


/** Editorial photography per service slug, for page banners. */
const SERVICE_IMAGES: Record<string, string> = {
  "full-home-design": modern.url,
  "kitchen-design": farmhouse.url,
  "bathroom-design": minimalist.url,
  "living-dining": traditional.url,
  "bedroom-design": scandinavian.url,
  "home-office": midCentury.url,
  "outdoor-patio": coastal.url,
  "commercial-office": industrial.url,
  "retail-hospitality": maximalist.url,
  "home-staging": transitional.url,
  "e-design": consult.url,
  "space-planning": studio.url,
  "custom-millwork": luxury.url,
  "lighting-design": eclectic.url,
  "window-treatments": traditional.url,
  "furniture-sourcing": eclectic.url,
  "color-consultation": maximalist.url,
  "renovation-management": studio.url,
};

export function serviceImage(slug: string): string {
  return SERVICE_IMAGES[slug] ?? modern.url;
}

/** Deterministic photo for a listing or city that has no photography of its own. */
const ROTATION = [
  modern.url, midCentury.url, traditional.url, farmhouse.url, coastal.url,
  minimalist.url, industrial.url, luxury.url, transitional.url, maximalist.url,
  scandinavian.url, eclectic.url,
];

export function fallbackPhoto(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return ROTATION[h % ROTATION.length]!;
}



/* ------------------------------------------------------------------ */
/* Location photography — deliberately distinct from the style grid.   */
/* ------------------------------------------------------------------ */
import place1 from "@/assets/place-1.jpg.asset.json";
import place2 from "@/assets/place-2.jpg.asset.json";
import place3 from "@/assets/place-3.jpg.asset.json";
import place4 from "@/assets/place-4.jpg.asset.json";

const PLACE_ROTATION = [place1.url, place2.url, place3.url, place4.url, studio.url, consult.url];

/** Deterministic editorial photo for a city or state page. */
export function placeImage(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  return PLACE_ROTATION[h % PLACE_ROTATION.length]!;
}

/** Alias used by city/state pages. */
export const cityImage = placeImage;
