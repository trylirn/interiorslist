export type TexasCity = {
  slug: string;
  name: string;
  state: string;
  population?: string;
  tagline: string;
};

export const TEXAS_CITIES: TexasCity[] = [
  { slug: "houston", name: "Houston", state: "TX", tagline: "Bayou City glow" },
  { slug: "dallas", name: "Dallas", state: "TX", tagline: "Big D refinement" },
  { slug: "austin", name: "Austin", state: "TX", tagline: "Capital cool" },
  { slug: "san-antonio", name: "San Antonio", state: "TX", tagline: "Alamo elegance" },
  { slug: "fort-worth", name: "Fort Worth", state: "TX", tagline: "Cowtown polish" },
  { slug: "el-paso", name: "El Paso", state: "TX", tagline: "Sun City radiance" },
  { slug: "arlington", name: "Arlington", state: "TX", tagline: "Mid-cities glow" },
  { slug: "plano", name: "Plano", state: "TX", tagline: "North Dallas elite" },
  { slug: "corpus-christi", name: "Corpus Christi", state: "TX", tagline: "Coastal beauty" },
  { slug: "lubbock", name: "Lubbock", state: "TX", tagline: "West Texas wow" },
];

export const SERVICES = [
  { slug: "botox", name: "Botox" },
  { slug: "fillers", name: "Dermal Fillers" },
  { slug: "lip-filler", name: "Lip Filler" },
  { slug: "sculptra", name: "Sculptra" },
  { slug: "kybella", name: "Kybella" },
  { slug: "prp", name: "PRP / PRF" },
  { slug: "microneedling", name: "Microneedling" },
  { slug: "chemical-peels", name: "Chemical Peels" },
  { slug: "iv-therapy", name: "IV Therapy" },
];

export function cityFromSlug(slug: string): TexasCity | undefined {
  return TEXAS_CITIES.find((c) => c.slug === slug);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}
