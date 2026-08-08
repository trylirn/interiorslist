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
};

export function styleImage(slug: string): string {
  return STYLE_IMAGES[slug] ?? modern.url;
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

/** Alias used by city/state pages. */
export const cityImage = fallbackPhoto;
