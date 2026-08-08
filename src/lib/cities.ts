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
];

export const PROJECT_TYPES = [
  { slug: "new-build", label: "New build", desc: "Designing from architectural plans" },
  { slug: "full-renovation", label: "Full renovation", desc: "Gut or major remodel of an existing space" },
  { slug: "single-room", label: "Single room refresh", desc: "One space, start to finish" },
  { slug: "furnishing-only", label: "Furnishing only", desc: "No construction — furniture, art and styling" },
  { slug: "commercial-fitout", label: "Commercial fit-out", desc: "Office, retail, restaurant or hospitality" },
  { slug: "rental", label: "Rental or short-term let", desc: "Renter-friendly or income-property design" },
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
