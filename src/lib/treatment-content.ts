export type TreatmentContent = {
  what: string;
  benefits: string[];
  risks: string[];
  recovery: string;
  avgCost: string;
  candidate: string;
  faqs: { q: string; a: string }[];
};

// Default content template used as fallback for any treatment slug.
function defaultContent(name: string): TreatmentContent {
  return {
    what: `${name} is a non-surgical aesthetic treatment offered at medspas across Texas. A licensed provider will assess your goals, review your medical history, and tailor a treatment plan for your skin and anatomy.`,
    benefits: [
      "Minimally invasive with little to no downtime",
      "Performed by a licensed provider in a medical setting",
      "Results typically visible within days to weeks",
      "Customizable to your goals and anatomy",
    ],
    risks: [
      "Temporary redness, swelling, or bruising at the treatment site",
      "Rare allergic reactions — always disclose allergies and medications",
      "Suboptimal results if performed by an inexperienced injector",
      "Follow all pre- and post-care instructions to reduce risk",
    ],
    recovery: `Most patients return to normal activities the same day. Avoid strenuous exercise, alcohol, and blood thinners for 24 hours. Follow provider-specific aftercare for optimal results.`,
    avgCost: `Pricing varies by clinic, area treated, and provider experience. Request a consultation with a verified Texas medspa for a personalized quote.`,
    candidate: `Adults in good general health with realistic expectations. Not recommended if you are pregnant, nursing, or have certain autoimmune conditions. A licensed provider will confirm candidacy at consultation.`,
    faqs: [
      { q: `How long does ${name} last?`, a: `Duration varies by individual, product, and treatment area. Your provider will discuss expected longevity at your consultation.` },
      { q: `Is ${name} painful?`, a: `Most patients tolerate ${name} well. Topical numbing or ice is used at many clinics to keep the experience comfortable.` },
      { q: `How do I choose a provider for ${name} in Texas?`, a: `Look for a licensed MD, DO, NP, PA, or RN operating under a Medical Director. Verified listings on Texas Aesthetics link directly to provider websites and reviews.` },
    ],
  };
}

const OVERRIDES: Record<string, Partial<TreatmentContent>> = {
  botox: {
    what: "Botox (onabotulinumtoxinA) is an FDA-approved neuromodulator injected in small doses to temporarily relax the facial muscles that cause dynamic wrinkles — forehead lines, crow's feet, and the '11s' between the brows.",
    benefits: [
      "Softens forehead lines, crow's feet, and glabellar '11s'",
      "Quick 10–15 minute appointment with no downtime",
      "Results in 3–7 days, lasting 3–4 months",
      "Preventative benefits when started early",
    ],
    recovery: "Return to normal activities immediately. Avoid lying flat, rubbing the area, and strenuous exercise for 4 hours. Bruising, if any, resolves in a few days.",
    avgCost: "In Texas, Botox typically costs $12–$18 per unit. A typical treatment uses 20–60 units depending on the areas treated.",
    faqs: [
      { q: "How long does Botox last?", a: "Results usually last 3–4 months. With regular treatment, some patients need less product over time." },
      { q: "Does Botox hurt?", a: "Injections use a tiny needle and feel like a small pinch. Ice or topical numbing is available at most Texas clinics." },
      { q: "When will I see Botox results?", a: "Initial effects appear in 3–5 days, with full results by day 14." },
    ],
  },
  "lip-filler": {
    what: "Lip filler uses hyaluronic-acid (HA) gel injected into the lips to restore volume, refine shape, and improve symmetry. Results are immediate and reversible with hyaluronidase.",
    benefits: ["Adds subtle to dramatic volume", "Reversible with hyaluronidase", "Improves shape, border, and symmetry", "Immediate visible results"],
    recovery: "Expect swelling for 2–4 days and mild bruising possible. Ice on/off the first evening. Avoid strenuous exercise 24 hours.",
    avgCost: "Lip filler in Texas typically costs $600–$1,000 per syringe of a hyaluronic-acid product such as Juvederm or Restylane.",
  },
  microneedling: {
    what: "Microneedling (collagen induction therapy) uses fine needles to create controlled micro-injuries in the skin, triggering collagen and elastin production. Often combined with PRP or serums.",
    benefits: ["Reduces acne scars and fine lines", "Improves skin texture and pore size", "Minimal downtime — pink for 24–48h", "Works on face, neck, chest, hands"],
    recovery: "Skin looks sunburned for 24–48 hours. Avoid makeup, sun, and active skincare (retinoids, acids) for 3–5 days.",
    avgCost: "$250–$500 per session in Texas. A series of 3–6 spaced 4 weeks apart is typical for scar or texture goals.",
  },
  "laser-hair-removal": {
    what: "Laser hair removal uses concentrated light to target the melanin in hair follicles, disabling their ability to grow new hair. Best results come from a series of 6–8 sessions.",
    benefits: ["Long-term hair reduction", "Fast — underarms take minutes", "Safe on most skin tones with the right laser", "Reduces ingrown hairs"],
    recovery: "Redness and mild swelling for a few hours. Avoid sun exposure and active skincare for 24–48 hours.",
    avgCost: "In Texas, single sessions run $75 (small area like upper lip) to $400+ (full legs). Packages of 6 sessions save 15–25%.",
  },
  hydrafacial: {
    what: "HydraFacial is a medical-grade 3-in-1 facial that cleanses, exfoliates, and infuses hydrating serums using patented vortex-fusion technology. No downtime.",
    benefits: ["Immediate glow", "Improves texture, tone, and hydration", "No downtime — great before an event", "Customizable boosters"],
    recovery: "None. Skin looks radiant immediately. Can wear makeup the same day.",
    avgCost: "$150–$300 per treatment in Texas depending on add-ons and boosters.",
  },
  "prp-hair": {
    what: "PRP (platelet-rich plasma) for hair uses your own concentrated platelets — drawn, spun in a centrifuge, and injected into the scalp — to stimulate follicle activity and thicken thinning hair.",
    benefits: ["Uses your own blood — no synthetic drugs", "Thickens miniaturizing hair", "Complements finasteride, minoxidil, LLLT", "Series of 3–4 initial sessions"],
    recovery: "Mild scalp tenderness for 24 hours. Wash hair the next day. Avoid alcohol and NSAIDs before treatment.",
    avgCost: "$500–$1,200 per session in Texas. Most protocols include 3–4 initial sessions spaced 4 weeks apart plus maintenance every 6 months.",
  },
  coolsculpting: {
    what: "CoolSculpting is FDA-cleared, non-surgical fat reduction using controlled cooling (cryolipolysis) to freeze and eliminate stubborn fat cells in areas like the abdomen, flanks, thighs, and chin.",
    benefits: ["No needles, no surgery, no downtime", "Permanent fat cell reduction in treated areas", "Multiple areas per session", "Return to normal activities same day"],
    recovery: "Numbness, redness, or bruising for a few days. Occasional soreness for 1–2 weeks. Return to normal activities immediately.",
    avgCost: "$700–$1,500 per applicator/cycle in Texas. Most areas need 2–4 cycles for visible results at 8–12 weeks.",
  },
  "chemical-peels": {
    what: "Chemical peels apply an acid solution (glycolic, salicylic, TCA, or Jessner's) to exfoliate damaged surface skin and stimulate new, healthier skin underneath.",
    benefits: ["Improves tone, texture, and pigmentation", "Softens fine lines and acne scars", "Custom strength — superficial to deep", "Series or one-off treatments"],
    recovery: "Superficial peels: mild flaking 2–5 days. Medium/deep: peeling and redness for 5–10 days. Strict sun protection required.",
    avgCost: "$150 (superficial) to $600+ (medium-depth) per session in Texas.",
  },
};

export function getTreatmentContent(slug: string, name: string): TreatmentContent {
  const base = defaultContent(name);
  const override = OVERRIDES[slug];
  if (!override) return base;
  return {
    ...base,
    ...override,
    faqs: override.faqs ?? base.faqs,
  };
}
