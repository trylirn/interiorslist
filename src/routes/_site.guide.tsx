import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_site/guide")({
  head: () => ({
    meta: [
      { title: "How to Hire an Interior Designer — Credentials, Fees & Contracts | Interiors List" },
      { name: "description", content: "What NCIDQ, ASID and IIDA actually mean, how designers charge, what belongs in the contract, and the questions to ask before you hire." },
      { property: "og:title", content: "How to Hire an Interior Designer" },
      { property: "og:description", content: "Credentials, fee models, contracts and the questions to ask before hiring." },
      { property: "og:url", content: "/guide" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/guide" }],
  }),
  component: GuidePage,
});

function GuidePage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">Hiring Guide</p>
      <h1 className="mt-2 flex items-center gap-3 font-display text-5xl"><ShieldCheck className="h-9 w-9 text-brand" /> Hiring a designer</h1>

      <Section title="Designer, decorator or architect?">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Interior decorator:</strong> furnishings, colour, textiles and styling. No construction.</li>
          <li><strong>Interior designer:</strong> layout, millwork, finishes and lighting, often coordinating with trades and permits.</li>
          <li><strong>Architect:</strong> structure, envelope and code-bearing changes. Needed for moving load-bearing walls or additions.</li>
        </ul>
      </Section>

      <Section title="Credentials worth checking">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>NCIDQ:</strong> the main professional certification for interior designers in the US.</li>
          <li><strong>ASID / IIDA:</strong> leading professional membership bodies with codes of conduct.</li>
          <li><strong>State registration or licensure:</strong> required in some states for commercial interiors and permit submissions.</li>
          <li><strong>Insurance:</strong> ask for general liability and, on larger jobs, professional indemnity.</li>
        </ul>
      </Section>

      <Section title="How designers charge">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Flat fee:</strong> a fixed price for a defined scope — easiest to budget.</li>
          <li><strong>Hourly:</strong> commonly $100–$300/hour; good for consultations and small scopes.</li>
          <li><strong>Cost-plus:</strong> a percentage (often 15–35%) added to furnishings and materials.</li>
          <li><strong>Per square foot:</strong> common on commercial fit-outs.</li>
        </ul>
      </Section>

      <Section title="What belongs in the contract">
        <ul className="list-disc space-y-1 pl-5">
          <li>Scope, deliverables and the number of revision rounds</li>
          <li>Fee model, payment schedule and what triggers extra charges</li>
          <li>Who owns the drawings, and how trade discounts are handled</li>
          <li>Procurement, delivery, storage and damaged-goods responsibility</li>
          <li>Timeline assumptions and a termination clause</li>
        </ul>
      </Section>

      <Section title="Questions to ask before you hire">
        <ul className="list-disc space-y-1 pl-5">
          <li>Have you done projects at my budget and square footage?</li>
          <li>Who will actually run my project day to day?</li>
          <li>How do you handle overruns, backorders and change orders?</li>
          <li>Can I speak to two recent clients?</li>
          <li>Do you keep trade discounts, pass them on, or split them?</li>
        </ul>
      </Section>

      <Section title="Red flags">
        <ul className="list-disc space-y-1 pl-5">
          <li>No written contract or no itemised budget</li>
          <li>Large upfront payment with no procurement schedule</li>
          <li>Portfolio images that can't be traced to real projects</li>
          <li>Reluctance to name the vendors or contractors they work with</li>
        </ul>
      </Section>

      <p className="mt-12 rounded-xl border border-border bg-card p-5 text-sm text-foreground/80">
        Interiors List is an independent directory. Nothing here is legal or financial advice — always review contracts yourself and confirm credentials directly with the issuing body.
      </p>

      <p className="mt-8"><Link to="/" className="text-brand underline">← Back home</Link></p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-3 text-base leading-relaxed text-foreground/85">{children}</div>
    </section>
  );
}
