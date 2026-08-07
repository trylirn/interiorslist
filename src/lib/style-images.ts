import hero from "@/assets/hero.jpg.asset.json";
import modern from "@/assets/modern.jpg.asset.json";
import midCentury from "@/assets/mid-century.jpg.asset.json";
import traditional from "@/assets/traditional.jpg.asset.json";
import farmhouse from "@/assets/farmhouse.jpg.asset.json";
import coastal from "@/assets/coastal.jpg.asset.json";
import minimalist from "@/assets/minimalist.jpg.asset.json";
import industrial from "@/assets/industrial.jpg.asset.json";
import luxury from "@/assets/luxury.jpg.asset.json";

export const HERO_IMAGE = hero.url;

/** Editorial photography per design style slug. Styles without a bespoke
 *  shot fall back to the closest visual relative. */
export const STYLE_IMAGES: Record<string, string> = {
  modern: modern.url,
  "mid-century": midCentury.url,
  traditional: traditional.url,
  transitional: traditional.url,
  farmhouse: farmhouse.url,
  industrial: industrial.url,
  coastal: coastal.url,
  minimalist: minimalist.url,
  maximalist: traditional.url,
  scandinavian: minimalist.url,
  eclectic: midCentury.url,
  "contemporary-luxury": luxury.url,
};

export function styleImage(slug: string): string {
  return STYLE_IMAGES[slug] ?? modern.url;
}

/** Deterministic photo for a listing that has no photography of its own. */
const ROTATION = [modern.url, midCentury.url, traditional.url, farmhouse.url, coastal.url, minimalist.url, industrial.url, luxury.url];

export function fallbackPhoto(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return ROTATION[h % ROTATION.length]!;
}
