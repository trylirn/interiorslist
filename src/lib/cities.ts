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
  { slug: "southlake", name: "Southlake", state: "TX", tagline: "DFW luxury" },
  { slug: "the-woodlands", name: "The Woodlands", state: "TX", tagline: "Forested polish" },
  { slug: "waxahachie", name: "Waxahachie", state: "TX", tagline: "Historic charm" },
];

export const SERVICES = [
  { slug: "botox", name: "Botox" },
  { slug: "dysport", name: "Dysport" },
  { slug: "xeomin", name: "Xeomin" },
  { slug: "jeuveau", name: "Jeuveau" },
  { slug: "fillers", name: "Dermal Fillers" },
  { slug: "lip-filler", name: "Lip Filler" },
  { slug: "cheek-filler", name: "Cheek Filler" },
  { slug: "jawline-filler", name: "Jawline Filler" },
  { slug: "sculptra", name: "Sculptra" },
  { slug: "kybella", name: "Kybella" },
  { slug: "prp", name: "PRP / PRF" },
  { slug: "microneedling", name: "Microneedling" },
  { slug: "morpheus8", name: "Morpheus8" },
  { slug: "chemical-peels", name: "Chemical Peels" },
  { slug: "hydrafacial", name: "HydraFacial" },
  { slug: "dermaplaning", name: "Dermaplaning" },
  { slug: "laser-hair-removal", name: "Laser Hair Removal" },
  { slug: "ipl-photofacial", name: "IPL Photofacial" },
  { slug: "laser-resurfacing", name: "Laser Resurfacing" },
  { slug: "halo-laser", name: "Halo Laser" },
  { slug: "bbl", name: "BBL" },
  { slug: "coolsculpting", name: "CoolSculpting" },
  { slug: "emsculpt", name: "Emsculpt" },
  { slug: "body-contouring", name: "Body Contouring" },
  { slug: "skin-tightening", name: "Skin Tightening" },
  { slug: "microblading", name: "Microblading" },
  { slug: "permanent-makeup", name: "Permanent Makeup" },
  { slug: "lash-extensions", name: "Lash Extensions" },
  { slug: "iv-therapy", name: "IV Therapy" },
  { slug: "weight-loss", name: "Weight Loss" },
  { slug: "hormone-therapy", name: "Hormone Therapy" },
  { slug: "prp-hair", name: "PRP for Hair" },
  { slug: "vampire-facial", name: "Vampire Facial" },
  { slug: "ultherapy", name: "Ultherapy" },
];

export const CONCERNS: { slug: string; label: string; intro: string }[] = [
  { slug: "wrinkles", label: "Fine lines & wrinkles", intro: "Soften forehead lines, crow's feet, and 11s with neuromodulators and skin treatments." },
  { slug: "lip-volume", label: "Lip volume & shape", intro: "Restore or enhance lip shape with hyaluronic-acid fillers and lip flips." },
  { slug: "jawline", label: "Jawline definition", intro: "Sharpen the jawline with fillers, Kybella, and skin tightening." },
  { slug: "acne-scars", label: "Acne scars", intro: "Resurface and rebuild collagen with microneedling, lasers, and peels." },
  { slug: "pigmentation", label: "Sun damage & pigment", intro: "Lift melasma and sun spots with IPL, BBL, and medical-grade peels." },
  { slug: "hair-loss", label: "Hair thinning", intro: "PRP for hair and prescription protocols to restore density." },
  { slug: "glow", label: "Healthy glow", intro: "Hydrafacials, dermaplaning, and IV drips for radiant skin." },
  { slug: "body-contouring", label: "Body contouring", intro: "Non-surgical fat reduction and muscle toning with CoolSculpting and Emsculpt." },
];

export function cityFromSlug(slug: string): TexasCity | undefined {
  return TEXAS_CITIES.find((c) => c.slug === slug);
}

export function concernFromSlug(slug: string) {
  return CONCERNS.find((c) => c.slug === slug);
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
