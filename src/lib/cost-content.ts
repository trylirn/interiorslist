/**
 * Curated cost-hub content. Deliberately hand-written and finite: the
 * estimator itself never generates indexable result URLs. Each entry below is
 * a real, repeated search intent that deserves a permanent page.
 */

import type { RoomSlug, ScopeSlug } from "@/lib/cost-model";

export type CostTopic = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  room: RoomSlug;
  scope: ScopeSlug;
  sections: { heading: string; body: string[] }[];
  faqs: { q: string; a: string }[];
};

export const COST_TOPICS: CostTopic[] = [
  {
    slug: "kitchen-remodel-cost",
    title: "Kitchen Remodel Cost (2026 Estimator) | Intearior",
    h1: "How much does a kitchen remodel cost?",
    description:
      "Estimate a kitchen remodel by size, scope, finish level and state — with a plain breakdown of design fees, cabinetry, materials and labour.",
    intro:
      "Kitchens are the most expensive room per square foot in most homes: cabinetry, appliances, plumbing and electrical all land in one space. Use the estimator to get a range for your own kitchen, then read what actually moves the number.",
    room: "kitchen",
    scope: "remodel",
    sections: [
      {
        heading: "What you are paying for",
        body: [
          "Cabinetry and joinery are usually the single largest line — stock, semi-custom and fully bespoke can differ by three or four times for the same footprint.",
          "Appliances, worktops and tile sit next. Moving plumbing or gas, or taking out a wall, pushes a remodel toward gut-renovation pricing because trades and permits enter the picture.",
          "A designer's fee is typically a modest share of the total but is where most of the savings come from: fewer change orders, fewer wrong orders, and a layout that works before anything is installed.",
        ],
      },
      {
        heading: "Ways the number changes",
        body: [
          "Keeping the existing layout is the biggest single saving available on a kitchen.",
          "Semi-custom cabinetry with a small run of bespoke pieces usually reads as fully custom for a fraction of the cost.",
          "Regional labour rates matter: the same kitchen can differ by 30–40% between a low-cost state and a coastal metro.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is a designer worth it on a kitchen?",
        a: "On a remodel with new cabinetry, most homeowners find the design fee is offset by avoided mistakes — layout changes on paper cost nothing, layout changes on site cost a great deal.",
      },
      {
        q: "How long does a kitchen remodel take?",
        a: "Design and procurement usually runs longer than the build. Cabinetry lead times of 8–14 weeks are common, so plan the order before demolition rather than after.",
      },
    ],
  },
  {
    slug: "bathroom-remodel-cost",
    title: "Bathroom Remodel Cost (2026 Estimator) | Intearior",
    h1: "How much does a bathroom remodel cost?",
    description:
      "Estimate a bathroom or primary-bath remodel by size, scope, finish level and state, with a breakdown of tiling, fixtures, labour and design.",
    intro:
      "Bathrooms are small but dense — waterproofing, tiling, plumbing and ventilation in a handful of square feet. That is why cost per square foot is high even when the total looks modest.",
    room: "bathroom",
    scope: "remodel",
    sections: [
      {
        heading: "Where the budget goes",
        body: [
          "Tile and its labour, sanitaryware, vanity joinery and glazing account for most of a bathroom budget.",
          "Relocating a soil stack or shower drain is the classic cost surprise; keeping wet services where they are keeps a remodel out of gut territory.",
          "Underfloor heating, steam and bespoke stone are the usual upgrades that move a standard bath into primary-suite pricing.",
        ],
      },
    ],
    faqs: [
      {
        q: "Why is a small bathroom so expensive per square foot?",
        a: "Every trade still has to attend, and the waterproofing and tiling work is the same regardless of how few square feet there are.",
      },
    ],
  },
  {
    slug: "living-room-design-cost",
    title: "Living Room Interior Design Cost | Intearior",
    h1: "How much does living room interior design cost?",
    description:
      "Estimate a living room refresh or full furnishing package, including the designer's fee, furniture, lighting and installation.",
    intro:
      "Most living-room projects are furnishing and styling rather than construction, so the split is very different from a kitchen: furniture dominates and labour is small.",
    room: "living-room",
    scope: "refresh",
    sections: [
      {
        heading: "Furnishing versus renovating",
        body: [
          "A furnishing-only package covers sofas, rugs, lighting, art and window treatments, plus the design fee and installation day.",
          "Adding joinery, replacing flooring or reworking lighting circuits moves the project into refresh or remodel pricing.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I furnish a room in phases?",
        a: "Yes, and many studios plan for it — the scheme is designed in full, then bought in stages so the room stays coherent.",
      },
    ],
  },
  {
    slug: "whole-home-interior-design-cost",
    title: "Whole-Home Interior Design Cost | Intearior",
    h1: "How much does whole-home interior design cost?",
    description:
      "Estimate a whole-home design project by square footage, scope, finish level and state, with a transparent cost breakdown.",
    intro:
      "Whole-home projects earn a lower cost per square foot than a single kitchen or bath, because circulation, bedrooms and living space cost far less per foot than wet rooms.",
    room: "whole-home",
    scope: "remodel",
    sections: [
      {
        heading: "How studios price whole-home work",
        body: [
          "Flat design fees, percentage-of-project fees and hourly rates are all common. Ask which model a studio uses before comparing two proposals.",
          "Procurement and project management are often separate line items. A proposal without them is not necessarily cheaper.",
        ],
      },
    ],
    faqs: [
      {
        q: "Should I hire one studio for the whole house?",
        a: "It usually costs less overall than room-by-room engagements, and the scheme reads as one home rather than a series of unrelated rooms.",
      },
    ],
  },
  {
    slug: "interior-designer-fees-explained",
    title: "Interior Designer Fees Explained | Intearior",
    h1: "Interior designer fees, explained",
    description:
      "Flat fee, hourly, cost-plus and percentage-of-project: how interior designers charge, what is usually excluded, and what to ask before signing.",
    intro:
      "Two proposals can look wildly different simply because the fee models differ. Here is how each one works and what tends to sit outside the quoted number.",
    room: "living-room",
    scope: "refresh",
    sections: [
      {
        heading: "The four common fee models",
        body: [
          "Flat fee: one price for a defined scope. Easiest to compare, but check exactly which deliverables are inside it.",
          "Hourly: billed as worked, often with an estimated ceiling. Suits small or open-ended jobs.",
          "Cost-plus: the studio buys furnishings at trade price and adds a percentage. Ask what the percentage is and whether trade discounts are passed on.",
          "Percentage of project: a share of construction and furnishing spend, common on larger renovations.",
        ],
      },
      {
        heading: "What is usually excluded",
        body: [
          "Furniture and materials themselves, freight and installation, structural or MEP engineering, permits, and site surveys are often quoted separately.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is a free consultation normal?",
        a: "An introductory call is common. A full paid concept or measured survey is a different thing and is normally chargeable.",
      },
    ],
  },
  {
    slug: "e-design-vs-full-service-cost",
    title: "E-Design vs Full-Service Interior Design: Cost Compared | Intearior",
    h1: "E-design vs full-service: what each really costs",
    description:
      "Compare online e-design packages with full-service interior design — what each includes, who each suits, and how the costs differ.",
    intro:
      "E-design gives you a scheme and a shopping list; full service gives you a team that buys, schedules and installs it. The price gap reflects the labour, not the taste.",
    room: "bedroom",
    scope: "styling",
    sections: [
      {
        heading: "What you get for the money",
        body: [
          "E-design typically delivers a mood board, a layout, a furniture list with links and a short revision window. You place the orders and manage delivery.",
          "Full service adds site measurement, procurement, trade pricing, delivery consolidation, snagging and installation day.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is e-design good value?",
        a: "For a single room where you are happy to buy and coordinate deliveries yourself, it is usually the cheapest route to a coherent scheme.",
      },
    ],
  },
  {
    slug: "budget-interior-design-ideas",
    title: "How to Cut Interior Design Costs Without Cutting Quality | Intearior",
    h1: "How to spend less without the room looking like it",
    description:
      "Practical ways to reduce an interior design budget — scope choices, phasing, finish substitutions and where not to economise.",
    intro:
      "Most savings come from scope and sequencing decisions made early, not from haggling over a sofa at the end.",
    room: "living-room",
    scope: "refresh",
    sections: [
      {
        heading: "Where the savings actually are",
        body: [
          "Keep plumbing and structure where they are. This is the single biggest lever in any renovation.",
          "Spend on the things you touch daily — seating, mattresses, taps, handles — and economise on decorative pieces that are easy to swap later.",
          "Phase the buy. Design the whole scheme, then purchase over two or three stages.",
          "Do not economise on waterproofing, electrics or anything buried behind a finish.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is it cheaper to hire a designer late in the project?",
        a: "Rarely. Bringing one in after decisions are made usually means paying twice for the same choices.",
      },
    ],
  },
];

export function topicBySlug(slug: string): CostTopic | undefined {
  return COST_TOPICS.find((t) => t.slug === slug);
}
