import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type QA = { q: string; a: string };
type Section = { id: string; title: string; items: QA[] };

const SECTIONS: Section[] = [
  {
    id: "about",
    title: "About Intearior",
    items: [
      {
        q: "What is Intearior?",
        a: "Intearior is an independent nationwide directory of interior design studios. We gather and check listings, organise them by city, service and style, and let you contact studios directly. We are not a design firm and we don't manage projects.",
      },
      {
        q: "Who is Intearior for?",
        a: "Homeowners and renters looking for a designer for anything from a single room to a full renovation — and the design studios who want to be found by them.",
      },
      {
        q: "Is Intearior free to use?",
        a: "Yes. Browsing, searching, comparing studios, getting matched and contacting a studio are all free for homeowners. Studios can also claim and complete their listing for free.",
      },
      {
        q: "Do you take a cut of a studio's fees?",
        a: "No. When you hire a studio, your agreement and payment are entirely between you and them. We never take a percentage of a project.",
      },
      {
        q: "How do you make money?",
        a: "Studios can pay for an optional featured placement on the directory. That's it — no commissions, no fees to homeowners.",
      },
      {
        q: "Are studios paying for placement?",
        a: "A studio can pay to be featured, and featured studios are shown first — but only when they genuinely fit what you asked for. Paying never makes a studio appear for a project it doesn't match, and it never changes a studio's reviews or rating.",
      },
      {
        q: "How do I report a bug, a wrong listing, or give feedback?",
        a: "Use the contact form and tell us what you saw and where. Listing corrections, duplicate profiles and closed businesses are all worth flagging — it's how the directory stays accurate.",
      },
    ],
  },
  {
    id: "homeowners",
    title: "For Home Owners",
    items: [
      {
        q: "How does Intearior work?",
        a: "Search by city, service or style — or take the match quiz. Open a studio's profile to see their services, styles, typical job cost, team, hours and client reviews, then send them a consultation request. The studio replies to you directly.",
      },
      {
        q: "Can I browse on my own without taking the quiz?",
        a: "Absolutely. The quiz is a shortcut, not a gate. You can browse every studio in the directory by city, state, service or style at any time.",
      },
      {
        q: "How does Get Matched work, and how many studios will I see?",
        a: "You answer a short set of questions about your project — location, rooms, timeline, budget and the look you want. We then recommend up to 3 studios that fit the brief, with a short note on why each one matched.",
      },
      {
        q: "Why do I need to enter my details to see matches?",
        a: "Your name, email and phone go to the studios you choose to contact, so they can actually reply to you. We only pass your details to the studios you select — nobody else.",
      },
      {
        q: "How do I know a studio is legit?",
        a: "We check that each listing is a real, currently operating business with valid contact details before it's published, and we surface any certifications and memberships a studio lists. Still confirm licensing, insurance and a written contract yourself before hiring.",
      },
      {
        q: "What's the difference between an interior designer and a decorator?",
        a: "A decorator focuses on the finishes you can see — paint, furniture, textiles, styling. A designer also handles space planning and construction-level decisions such as layouts, built-ins, lighting and working with contractors. Many studios do both; the services listed on their profile tell you which.",
      },
      {
        q: "Do I need a designer for a small project?",
        a: "Plenty of studios take on single rooms, refreshes and consultation-only or e-design packages. Filter by service to find the ones that do smaller scopes rather than full-home work.",
      },
      {
        q: "What does interior design typically cost?",
        a: "It varies by scope, city and how a studio bills — flat fee per room, hourly, or a percentage of the project. Studios that have completed their listing show a typical job cost, and the service pages give realistic ranges. Always get the fee structure in writing.",
      },
      {
        q: "What happens after I contact a studio?",
        a: "Your request lands in that studio's dashboard with your project brief and contact details. They get in touch to discuss scope, timing and fees. We're not in the middle of that conversation.",
      },
      {
        q: "How quickly will someone respond?",
        a: "Most studios reply within a couple of business days. Contacting two or three at once is the fastest way to get a conversation going.",
      },
      {
        q: "What if I'm not happy with my matches?",
        a: "Retake the quiz with a different budget, style or timeline, or browse the directory directly and reach out to whoever appeals. There's no limit on how many studios you can contact.",
      },
      {
        q: "Can I leave a review?",
        a: "Yes — you can write a review for any studio you've worked with. Reviews are tied to a real experience, published on the studio's profile, and the studio can post a public response.",
      },
    ],
  },
  {
    id: "professionals",
    title: "For Interior Design Professionals",
    items: [
      {
        q: "How do I get listed?",
        a: "If your studio isn't already in the directory, submit it and we'll review the details before publishing. Listing is free.",
      },
      {
        q: "How do I claim an existing profile?",
        a: "Open your studio's page and use the claim link. We verify that you're connected to the business, and once approved the listing appears in your dashboard for you to edit.",
      },
      {
        q: "How does matching work — how do clients find me?",
        a: "Clients find you through search, city and state pages, service and style pages, and the match quiz. Matching reads your listing: the services you offer, the styles you work in, project types, location and typical job cost. Featured studios are shown first among those that fit the brief, then verified studios, then everyone else.",
      },
      {
        q: "How many leads can I expect?",
        a: "It depends on your city, how competitive it is, and how complete your listing is. We don't promise a number — a filled-out profile with photos, services, styles and reviews gets contacted far more often than a bare one.",
      },
      {
        q: "How are leads delivered?",
        a: "Every consultation request appears in your dashboard with the client's name, contact details and project brief. You reply to the client directly — we don't sell leads or charge per enquiry.",
      },
      {
        q: "How do I optimize my profile?",
        a: "Add a portfolio, write a real description of how you work, tick every service and style you actually offer, set your typical job cost, list your team, keep your address and hours current, and ask past clients for reviews. Complete profiles rank better in search and match more often.",
      },
      {
        q: "How do reviews work on my profile, and can I respond?",
        a: "Clients post reviews to your profile and you can publish a response to each one from your dashboard. We don't remove reviews for being unflattering, but tell us if one is fake or breaches our terms and we'll look into it.",
      },
      {
        q: "Can I edit my address, hours, services and team?",
        a: "Yes. Once your claim is approved, the dashboard lets you edit your description, address, business hours, services, styles, typical job cost, social links, photos and team members. Changes go live on your public profile.",
      },
      {
        q: "How do I remove my listing?",
        a: "Contact us from the email associated with the business and we'll unpublish it. If you only want to step back from managing it, you can close your account and the listing returns to unclaimed.",
      },
    ],
  },
];

const TITLE = "FAQ | Intearior";
const DESCRIPTION =
  "Answers about how Intearior works — for homeowners looking for an interior designer and for design studios listed in the directory.";

export const Route = createFileRoute("/_site/faq")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: SECTIONS.flatMap((s) =>
            s.items.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          ),
        }),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">FAQ</p>
      <h1 className="mt-3 font-display text-5xl md:text-6xl">Questions, answered.</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        How the directory works, what it costs, and what to expect — whether you're looking for a
        designer or you run a studio.
      </p>

      <nav className="mt-8 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-brand hover:text-brand"
          >
            {s.title}
          </a>
        ))}
      </nav>

      <div className="mt-16 space-y-16">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-28">
            <h2 className="font-display text-3xl">{s.title}</h2>
            <Accordion type="single" collapsible className="mt-4 w-full">
              {s.items.map((f, i) => (
                <AccordionItem key={f.q} value={`${s.id}-${i}`}>
                  <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </div>

      <div className="mt-20 rounded-2xl border border-border bg-secondary/40 p-8">
        <h2 className="font-display text-2xl">Still have a question?</h2>
        <p className="mt-2 text-muted-foreground">
          Start browsing, get matched to studios that fit your project, or claim your studio's
          listing.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link to="/search">Find a designer</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <Link to="/match">Get matched</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <Link to="/claim">Claim your studio</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="rounded-full">
            <Link to="/contact">Contact us</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
