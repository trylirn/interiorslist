export type ServiceContent = {
  what: string;
  benefits: string[];
  considerations: string[];
  process: string;
  avgCost: string;
  candidate: string;
  faqs: { q: string; a: string }[];
};

function defaultContent(name: string): ServiceContent {
  return {
    what: `${name} is a service offered by interior design studios across the country. A designer will walk your space, learn how you live or work in it, and build a plan covering layout, materials, furniture and lighting.`,
    benefits: [
      "A layout and material plan made for your actual space",
      "Access to trade-only furniture, fabric and lighting sources",
      "Fewer costly mistakes and returns",
      "One point of contact between you, contractors and vendors",
    ],
    considerations: [
      "Fees are quoted flat, hourly, or cost-plus — ask which model applies",
      "Lead times on custom furniture can run 8–16 weeks",
      "Trade discounts vary by vendor and may be shared or retained",
      "Confirm who manages installation, delivery and punch list",
    ],
    process: `Most studios start with a paid consultation, then move through concept and mood boards, space planning, material and furniture selection, procurement, and finally installation and styling.`,
    avgCost: `Fees depend on scope, square footage and city. Studios typically charge a flat design fee, an hourly rate of roughly $100–$300, or a cost-plus percentage on furnishings. Request quotes from a few studios to compare.`,
    candidate: `Anyone who wants a considered result and would rather not manage sourcing, trades and logistics alone. Even a single consultation can save money on a project you plan to run yourself.`,
    faqs: [
      { q: `How long does ${name.toLowerCase()} take?`, a: `Timelines depend on scope. A single room typically runs 8–16 weeks including procurement; whole-home and renovation work often runs 6–18 months.` },
      { q: `What does ${name.toLowerCase()} cost?`, a: `Studios quote flat fees, hourly rates or a percentage of the furnishings budget. Every listing on Interiors List shows a typical project budget so you can shortlist studios at your scale.` },
      { q: `Do I need to have a budget ready?`, a: `A rough range is enough to start. Designers use it to steer sourcing, so an honest number leads to a better fit.` },
    ],
  };
}

const OVERRIDES: Record<string, Partial<ServiceContent>> = {
  "full-home-design": {
    what: "Full-home design covers every room in a house or apartment — layout, finishes, built-ins, furniture, lighting, textiles and art — coordinated into one consistent scheme rather than room-by-room decisions.",
    benefits: [
      "A single coherent palette and material story across the home",
      "Efficient sourcing — one procurement round rather than several",
      "Better coordination with architects, builders and trades",
      "Long-term plan you can phase over time if needed",
    ],
    avgCost: "Full-home projects commonly start around $30k in design fees for a mid-size home, with furnishings budgets typically running $75k and up depending on scope and city.",
  },
  "kitchen-design": {
    what: "Kitchen design covers layout and workflow, cabinetry and millwork, counters and backsplash, appliance planning, lighting, and the electrical and plumbing coordination that goes with them.",
    benefits: [
      "Workflow planned around how you actually cook",
      "Cabinet and appliance specs checked before anything is ordered",
      "Coordinated lighting, ventilation and electrical plan",
      "Material choices tested for wear, not just looks",
    ],
    avgCost: "Kitchen design fees typically run $5k–$20k. Construction and cabinetry usually run $30k–$150k+ depending on scope, cabinetry grade and appliances.",
  },
  "bathroom-design": {
    what: "Bathroom design covers fixture layout, waterproofing and tile detail, vanity and storage design, lighting, ventilation, and accessible or ageing-in-place adjustments where needed.",
    avgCost: "Bathroom design fees typically run $3k–$12k, with construction commonly $20k–$80k depending on size and finishes.",
  },
  "e-design": {
    what: "E-design (virtual design) delivers a complete room plan remotely — measurements you supply, then a floor plan, mood board, shopping list and setup instructions delivered as a package.",
    benefits: [
      "Far lower cost than full-service design",
      "Available anywhere in the country",
      "You buy and install on your own schedule",
      "Great fit for single rooms and rentals",
    ],
    avgCost: "E-design packages typically run $300–$2,500 per room depending on the number of revisions and the depth of the deliverables.",
  },
  "home-staging": {
    what: "Home staging prepares a property for sale — editing, rearranging or renting furniture and styling each room so buyers can read the space quickly in photos and in person.",
    avgCost: "Consultations typically run $200–$600; full staging with rented inventory commonly runs $2k–$8k per month depending on the size of the home.",
  },
  "commercial-office": {
    what: "Commercial and office design covers space planning, workplace zoning, acoustics, furniture systems, branding within the environment, and compliance with building and accessibility codes.",
    considerations: [
      "Commercial work often requires stamped drawings and code review",
      "Many states register or license designers for commercial interiors",
      "Lead times on contract furniture can be long — plan early",
      "Landlord approvals and building rules affect scope",
    ],
    avgCost: "Commercial fees are often quoted per square foot — commonly $5–$20/sq ft for design services, separate from construction and furniture.",
  },
  "renovation-management": {
    what: "Renovation management puts the designer in charge of the build phase — drawings, contractor bidding, site visits, schedule tracking, change orders and the final punch list.",
    avgCost: "Typically billed hourly or as 10–20% of construction cost.",
  },
};

export function getServiceContent(slug: string, name: string): ServiceContent {
  return { ...defaultContent(name), ...(OVERRIDES[slug] ?? {}) };
}
