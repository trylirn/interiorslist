export type City = {
  slug: string;
  name: string;
  state: string; // two-letter code, lowercase in URLs
  stateName: string;
  tagline: string;
  geo: { lat: number; lng: number };
  neighbors: string[];
  intro: string;
};

export const CITIES: City[] = [
  {
    slug: "new-york-ny", name: "New York", state: "NY", stateName: "New York",
    tagline: "Townhouses, lofts and pre-war classics",
    geo: { lat: 40.7128, lng: -74.006 },
    neighbors: ["Brooklyn", "Queens", "Hoboken", "Westchester", "The Hamptons"],
    intro: "Serving Manhattan, Brooklyn, Queens and the surrounding metro area.",
  },
  {
    slug: "los-angeles-ca", name: "Los Angeles", state: "CA", stateName: "California",
    tagline: "Indoor-outdoor living, done well",
    geo: { lat: 34.0522, lng: -118.2437 },
    neighbors: ["Santa Monica", "Pasadena", "Silver Lake", "Malibu", "Beverly Hills"],
    intro: "Serving Los Angeles, the Westside, the Valley and the South Bay.",
  },
  {
    slug: "chicago-il", name: "Chicago", state: "IL", stateName: "Illinois",
    tagline: "Greystones, high-rises and warm modernism",
    geo: { lat: 41.8781, lng: -87.6298 },
    neighbors: ["Evanston", "Oak Park", "Wicker Park", "Naperville", "Hinsdale"],
    intro: "Serving Chicago, the North Shore and the western suburbs.",
  },
  {
    slug: "houston-tx", name: "Houston", state: "TX", stateName: "Texas",
    tagline: "Gracious rooms built for entertaining",
    geo: { lat: 29.7604, lng: -95.3698 },
    neighbors: ["The Woodlands", "Sugar Land", "Katy", "Pearland", "Bellaire"],
    intro: "Serving Houston, River Oaks, The Heights and the surrounding suburbs.",
  },
  {
    slug: "dallas-tx", name: "Dallas", state: "TX", stateName: "Texas",
    tagline: "New builds and tailored renovations",
    geo: { lat: 32.7767, lng: -96.797 },
    neighbors: ["Plano", "Frisco", "Highland Park", "Southlake", "Fort Worth"],
    intro: "Serving Dallas, Highland Park, Preston Hollow and the greater DFW metroplex.",
  },
  {
    slug: "austin-tx", name: "Austin", state: "TX", stateName: "Texas",
    tagline: "Hill Country modern",
    geo: { lat: 30.2672, lng: -97.7431 },
    neighbors: ["Westlake", "Round Rock", "Cedar Park", "Dripping Springs", "Lakeway"],
    intro: "Serving Austin, Westlake, Round Rock and the Texas Hill Country.",
  },
  {
    slug: "miami-fl", name: "Miami", state: "FL", stateName: "Florida",
    tagline: "Tropical modern and waterfront living",
    geo: { lat: 25.7617, lng: -80.1918 },
    neighbors: ["Coral Gables", "Miami Beach", "Coconut Grove", "Fort Lauderdale", "Key Biscayne"],
    intro: "Serving Miami, Coral Gables, Miami Beach and Broward County.",
  },
  {
    slug: "atlanta-ga", name: "Atlanta", state: "GA", stateName: "Georgia",
    tagline: "Southern classicism, updated",
    geo: { lat: 33.749, lng: -84.388 },
    neighbors: ["Buckhead", "Decatur", "Marietta", "Alpharetta", "Sandy Springs"],
    intro: "Serving Atlanta, Buckhead, Decatur and the northern suburbs.",
  },
  {
    slug: "seattle-wa", name: "Seattle", state: "WA", stateName: "Washington",
    tagline: "Daylight, cedar and calm",
    geo: { lat: 47.6062, lng: -122.3321 },
    neighbors: ["Bellevue", "Kirkland", "Ballard", "Tacoma", "Mercer Island"],
    intro: "Serving Seattle, the Eastside and the greater Puget Sound region.",
  },
  {
    slug: "denver-co", name: "Denver", state: "CO", stateName: "Colorado",
    tagline: "Mountain modern with real durability",
    geo: { lat: 39.7392, lng: -104.9903 },
    neighbors: ["Boulder", "Golden", "Littleton", "Cherry Creek", "Fort Collins"],
    intro: "Serving Denver, Boulder, Cherry Creek and the Front Range.",
  },
  {
    slug: "phoenix-az", name: "Phoenix", state: "AZ", stateName: "Arizona",
    tagline: "Desert modern, heat-smart materials",
    geo: { lat: 33.4484, lng: -112.074 },
    neighbors: ["Scottsdale", "Tempe", "Paradise Valley", "Mesa", "Chandler"],
    intro: "Serving Phoenix, Scottsdale, Paradise Valley and the East Valley.",
  },
  {
    slug: "boston-ma", name: "Boston", state: "MA", stateName: "Massachusetts",
    tagline: "Historic bones, contemporary comfort",
    geo: { lat: 42.3601, lng: -71.0589 },
    neighbors: ["Cambridge", "Brookline", "Somerville", "Newton", "The North Shore"],
    intro: "Serving Boston, Cambridge, Brookline and the surrounding towns.",
  },
];

export const STATES = Array.from(
  new Map(CITIES.map((c) => [c.state, { code: c.state, name: c.stateName }])).values(),
).sort((a, b) => a.name.localeCompare(b.name));

// Back-compat lookups used across the app
export const CITY_NEIGHBORS: Record<string, string[]> = Object.fromEntries(
  CITIES.map((c) => [c.slug, c.neighbors]),
);
export const CITY_GEO: Record<string, { lat: number; lng: number }> = Object.fromEntries(
  CITIES.map((c) => [c.slug, c.geo]),
);
export const CITY_INTRO: Record<string, string> = Object.fromEntries(
  CITIES.map((c) => [c.slug, c.intro]),
);

export const SERVICES = [
  { slug: "full-home-design", name: "Full-Home Design" },
  { slug: "kitchen-design", name: "Kitchen Design" },
  { slug: "bathroom-design", name: "Bathroom Design" },
  { slug: "living-dining", name: "Living & Dining" },
  { slug: "bedroom-design", name: "Bedroom Design" },
  { slug: "home-office", name: "Home Office" },
  { slug: "outdoor-patio", name: "Outdoor & Patio" },
  { slug: "commercial-office", name: "Commercial & Office" },
  { slug: "retail-hospitality", name: "Retail & Hospitality" },
  { slug: "home-staging", name: "Home Staging" },
  { slug: "e-design", name: "E-Design / Virtual" },
  { slug: "space-planning", name: "Space Planning" },
  { slug: "custom-millwork", name: "Custom Millwork" },
  { slug: "lighting-design", name: "Lighting Design" },
  { slug: "window-treatments", name: "Window Treatments" },
  { slug: "furniture-sourcing", name: "Furniture Sourcing" },
  { slug: "color-consultation", name: "Color Consultation" },
  { slug: "renovation-management", name: "Renovation Management" },
  { slug: "primary-suite", name: "Primary Suite Design" },
  { slug: "kids-nursery", name: "Kids & Nursery Design" },
  { slug: "remodel-consulting", name: "Kitchen & Bath Remodel Consulting" },
  { slug: "closet-storage", name: "Closet & Storage Design" },
  { slug: "media-theatre", name: "Media & Home Theatre" },
  { slug: "basement-finishing", name: "Basement Finishing" },
  { slug: "adu-small-space", name: "ADU & Small-Space Design" },
  { slug: "art-curation", name: "Art Curation & Framing" },
  { slug: "textiles-soft-furnishing", name: "Textile & Soft Furnishing Design" },
  { slug: "cabinetry-joinery", name: "Cabinetry & Joinery Specification" },
  { slug: "flooring-tile", name: "Flooring & Tile Selection" },
  { slug: "wallpaper-wall-treatments", name: "Wallpaper & Wall Treatments" },
  { slug: "sustainable-design", name: "Sustainable & Eco Design" },
  { slug: "accessible-design", name: "Aging-in-Place & Accessible Design" },
  { slug: "wellness-feng-shui", name: "Feng Shui & Wellness Design" },
  { slug: "model-home-multifamily", name: "Model Home & Multi-Family Design" },
  { slug: "restaurant-bar", name: "Restaurant & Bar Design" },
  { slug: "healthcare-interiors", name: "Healthcare & Wellness Interiors" },
  { slug: "short-term-rental-styling", name: "Vacation & Short-Term Rental Styling" },
  { slug: "procurement", name: "Procurement & Project Purchasing" },
  { slug: "3d-rendering", name: "3D Rendering & Visualisation" },
  { slug: "move-in-unpacking", name: "Move-In & Unpacking Services" },
];

export const STYLES: { slug: string; label: string; intro: string }[] = [
  { slug: "modern", label: "Modern", intro: "Clean lines, honest materials and uncluttered rooms that still feel warm." },
  { slug: "mid-century", label: "Mid-Century", intro: "Walnut, tapered legs, graphic pattern and 1950s–60s optimism." },
  { slug: "traditional", label: "Traditional", intro: "Classic proportions, millwork, antiques and layered textiles." },
  { slug: "transitional", label: "Transitional", intro: "The middle ground — traditional bones with contemporary furnishings." },
  { slug: "farmhouse", label: "Modern Farmhouse", intro: "Shiplap, natural wood, matte black and generous kitchens." },
  { slug: "industrial", label: "Industrial", intro: "Exposed brick, steel, concrete and loft-scale volumes." },
  { slug: "coastal", label: "Coastal", intro: "Light woods, breezy fabrics and a sun-washed palette." },
  { slug: "minimalist", label: "Minimalist", intro: "Restraint, storage that disappears, and a very short material list." },
  { slug: "maximalist", label: "Maximalist", intro: "Saturated colour, pattern-on-pattern and collected objects." },
  { slug: "scandinavian", label: "Scandinavian", intro: "Pale timber, wool, daylight and quiet functionality." },
  { slug: "eclectic", label: "Eclectic", intro: "Mixed eras and provenances, held together by a confident eye." },
  { slug: "contemporary-luxury", label: "Contemporary Luxury", intro: "Stone, bespoke joinery and hotel-grade detailing." },
  { slug: "contemporary", label: "Contemporary", intro: "Of-the-moment forms, soft neutrals and sculptural furniture." },
  { slug: "bohemian", label: "Bohemian", intro: "Layered rugs, rattan, plants and a relaxed, collected feel." },
  { slug: "art-deco", label: "Art Deco", intro: "Brass, lacquer, fluting and bold geometric symmetry." },
  { slug: "rustic", label: "Rustic & Mountain Lodge", intro: "Timber beams, stone hearths and hard-wearing natural textures." },
  { slug: "mediterranean", label: "Mediterranean", intro: "Plaster walls, terracotta, arches and sun-baked warmth." },
  { slug: "french-country", label: "French Country", intro: "Limewash, patina, toile and gently faded elegance." },
  { slug: "japandi", label: "Japandi", intro: "Japanese calm meets Nordic craft — low forms and quiet palettes." },
  { slug: "shaker", label: "Shaker", intro: "Honest joinery, peg rails and unfussy, useful beauty." },
  { slug: "hollywood-regency", label: "Hollywood Regency", intro: "High-gloss drama, mirror, velvet and theatrical colour." },
  { slug: "southwestern", label: "Southwestern", intro: "Desert tones, woven textiles, clay and hand-made detail." },
  { slug: "english-country", label: "English Country", intro: "Chintz, deep sofas, layered pattern and lived-in comfort." },
  { slug: "organic-modern", label: "Organic Modern", intro: "Curved forms, raw plaster, oak and earthy neutrals." },
  { slug: "victorian", label: "Victorian & Historic Restoration", intro: "Period detail restored — cornices, joinery and rich colour." },
  { slug: "tropical", label: "Tropical", intro: "Cane, palm prints, louvres and indoor-outdoor living." },
  { slug: "grandmillennial", label: "Grandmillennial", intro: "Skirted tables, scallops and heirloom pattern, freshly styled." },
  { slug: "biophilic", label: "Biophilic", intro: "Daylight, greenery and natural materials designed for wellbeing." },
  { slug: "warm-minimalism", label: "Warm Minimalism", intro: "Minimal forms softened with wool, oak and warm plaster." },
  { slug: "urban-loft", label: "Urban Loft", intro: "Open volumes, blackened steel and gallery-like walls." },
];

export const PROJECT_TYPES = [
  { slug: "new-build", label: "New build", desc: "Designing from architectural plans" },
  { slug: "full-renovation", label: "Full renovation", desc: "Gut or major remodel of an existing space" },
  { slug: "single-room", label: "Single room refresh", desc: "One space, start to finish" },
  { slug: "furnishing-only", label: "Furnishing only", desc: "No construction — furniture, art and styling" },
  { slug: "commercial-fitout", label: "Commercial fit-out", desc: "Office, retail, restaurant or hospitality" },
  { slug: "rental", label: "Rental or short-term let", desc: "Renter-friendly or income-property design" },
  { slug: "kitchen-remodel", label: "Kitchen-only remodel", desc: "Just the kitchen, cabinetry to finishes" },
  { slug: "bathroom-remodel", label: "Bathroom-only remodel", desc: "One or more bathrooms" },
  { slug: "addition", label: "Addition or extension", desc: "Adding square footage to an existing home" },
  { slug: "outdoor-living", label: "Outdoor living", desc: "Patios, terraces and landscape-adjacent spaces" },
  { slug: "staging", label: "Staging for sale", desc: "Preparing a property to sell" },
  { slug: "office-relocation", label: "Office relocation or fit-out", desc: "Moving or building out a workplace" },
  { slug: "historic-restoration", label: "Historic restoration", desc: "Period-sensitive repair and renewal" },
  { slug: "second-home", label: "Second home or vacation property", desc: "A holiday house or pied-à-terre" },
  { slug: "multi-unit", label: "Multi-unit or developer package", desc: "Repeatable schemes across units" },
  { slug: "e-design-only", label: "E-design only (remote)", desc: "Fully remote design, delivered digitally" },
];


export const BUDGET_BANDS = [
  { slug: "under-10k", label: "Under $10k", tier: "budget" },
  { slug: "10-25k", label: "$10k – $25k", tier: "budget" },
  { slug: "25-75k", label: "$25k – $75k", tier: "moderate" },
  { slug: "75-150k", label: "$75k – $150k", tier: "premium" },
  { slug: "150k-plus", label: "$150k+", tier: "premium" },
  { slug: "not-sure", label: "Not sure yet", tier: "flexible" },
];

export function cityFromSlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function styleFromSlug(slug: string) {
  return STYLES.find((s) => s.slug === slug);
}

export function serviceName(slug: string) {
  return SERVICES.find((s) => s.slug === slug)?.name ?? slug.replace(/-/g, " ");
}

export function styleLabel(slug: string) {
  return STYLES.find((s) => s.slug === slug)?.label ?? slug.replace(/-/g, " ");
}

export function projectTypeLabel(slug: string) {
  return PROJECT_TYPES.find((p) => p.slug === slug)?.label ?? slug.replace(/-/g, " ");
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
