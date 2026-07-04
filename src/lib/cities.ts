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

// Nearby cities/neighborhoods for local-intent SEO ("near me" queries and areaServed).
export const CITY_NEIGHBORS: Record<string, string[]> = {
  houston: ["The Woodlands", "Sugar Land", "Katy", "Pearland", "Cypress", "Spring"],
  dallas: ["Plano", "Frisco", "Irving", "Richardson", "Garland", "Highland Park"],
  austin: ["Round Rock", "Cedar Park", "Pflugerville", "Lakeway", "Georgetown", "Bee Cave"],
  "san-antonio": ["Alamo Heights", "Stone Oak", "Boerne", "New Braunfels", "Schertz"],
  "fort-worth": ["Arlington", "Southlake", "Keller", "Grapevine", "Colleyville"],
  "el-paso": ["Horizon City", "Socorro", "Canutillo"],
  arlington: ["Fort Worth", "Grand Prairie", "Mansfield", "Kennedale"],
  plano: ["Frisco", "Allen", "McKinney", "Richardson", "Dallas"],
  "corpus-christi": ["Portland", "Rockport", "Kingsville"],
  lubbock: ["Wolfforth", "Shallowater", "Idalou"],
  southlake: ["Grapevine", "Colleyville", "Keller", "Westlake"],
  "the-woodlands": ["Spring", "Conroe", "Magnolia", "Tomball"],
  waxahachie: ["Midlothian", "Red Oak", "Ennis", "Ovilla", "Dallas"],
};

// City centroid approx lat/lng for LocalBusiness/CollectionPage geo hints.
export const CITY_GEO: Record<string, { lat: number; lng: number }> = {
  houston: { lat: 29.7604, lng: -95.3698 },
  dallas: { lat: 32.7767, lng: -96.797 },
  austin: { lat: 30.2672, lng: -97.7431 },
  "san-antonio": { lat: 29.4241, lng: -98.4936 },
  "fort-worth": { lat: 32.7555, lng: -97.3308 },
  "el-paso": { lat: 31.7619, lng: -106.485 },
  arlington: { lat: 32.7357, lng: -97.1081 },
  plano: { lat: 33.0198, lng: -96.6989 },
  "corpus-christi": { lat: 27.8006, lng: -97.3964 },
  lubbock: { lat: 33.5779, lng: -101.8552 },
  southlake: { lat: 32.9412, lng: -97.1342 },
  "the-woodlands": { lat: 30.1658, lng: -95.4613 },
  waxahachie: { lat: 32.3865, lng: -96.8483 },
};

// Short local intro copy for each city (visible + description meta).
export const CITY_INTRO: Record<string, string> = {
  houston: "Serving Houston and the surrounding communities of The Woodlands, Sugar Land, Katy, and Pearland.",
  dallas: "Serving Dallas, Highland Park, Uptown, Preston Hollow, and the greater DFW metroplex.",
  austin: "Serving Austin, Westlake, Round Rock, Cedar Park, and the Texas Hill Country.",
  "san-antonio": "Serving San Antonio, Alamo Heights, Stone Oak, Boerne, and New Braunfels.",
  "fort-worth": "Serving Fort Worth, Southlake, Keller, Grapevine, and the western DFW metroplex.",
  "el-paso": "Serving El Paso, Horizon City, Socorro, and the Sun City region.",
  arlington: "Serving Arlington, Grand Prairie, Mansfield, and the Mid-Cities.",
  plano: "Serving Plano, Frisco, Allen, McKinney, and North Dallas.",
  "corpus-christi": "Serving Corpus Christi, Portland, Rockport, and the Texas Coastal Bend.",
  lubbock: "Serving Lubbock, Wolfforth, Shallowater, and the South Plains region.",
  southlake: "Serving Southlake, Westlake, Grapevine, Colleyville, and DFW luxury communities.",
  "the-woodlands": "Serving The Woodlands, Spring, Conroe, Magnolia, and North Houston.",
  waxahachie: "Serving Waxahachie, Midlothian, Red Oak, Ennis, and Southern Dallas County.",
};

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
