import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_site/safety")({
  head: () => ({
    meta: [
      { title: "Patient Safety Guide | Discover Medspa" },
      { name: "description", content: "Risks, recovery expectations, and how to verify your aesthetic injector's credentials in Texas." },
      { property: "og:title", content: "Patient Safety Guide" },
      { property: "og:description", content: "Risks, recovery, and credential verification for Texas aesthetic patients." },
      { property: "og:url", content: "/safety" },
    ],
    links: [{ rel: "canonical", href: "/safety" }],
  }),
  component: SafetyPage,
});

function SafetyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">Patient Safety</p>
      <h1 className="mt-2 flex items-center gap-3 font-display text-5xl"><ShieldCheck className="h-9 w-9 text-brand" /> Safety Guide</h1>

      <Section title="Verify the injector's credentials">
        In Texas, neurotoxins and dermal fillers must be administered by a licensed medical professional or under the supervision of one. Verify your provider with the Texas Medical Board (TMB) or Texas Board of Nursing (BON) before treatment.
      </Section>

      <Section title="Common risks">
        <ul className="list-disc pl-5 space-y-1">
          <li>Bruising, swelling, redness, and tenderness at the injection site (typically 1–7 days)</li>
          <li>Headache or mild flu-like symptoms after neurotoxin injection</li>
          <li>Asymmetry or product migration (uncommon with experienced injectors)</li>
          <li>Rare but serious: vascular occlusion with filler — go to ER immediately if you notice severe pain, blanching, or vision changes</li>
        </ul>
      </Section>

      <Section title="Recovery & downtime">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Botox / neurotoxins:</strong> minimal downtime; full result in 7–14 days</li>
          <li><strong>Lip filler:</strong> swelling 2–5 days; final shape at 2 weeks</li>
          <li><strong>Cheek / jaw filler:</strong> mild swelling 3–7 days</li>
          <li><strong>Microneedling / peels:</strong> redness and peeling for several days</li>
        </ul>
      </Section>

      <Section title="Questions to ask before treatment">
        <ul className="list-disc pl-5 space-y-1">
          <li>Are you a licensed medical professional in Texas?</li>
          <li>What product are you using, and is it FDA-approved?</li>
          <li>How will you handle complications?</li>
          <li>Can I see before/after photos of your work?</li>
        </ul>
      </Section>

      <p className="mt-12 rounded-xl border border-border bg-card p-5 text-sm text-foreground/80">
        Discover Medspa is an informational directory. Nothing on this page is medical advice. Always consult a qualified healthcare professional before any cosmetic procedure.
      </p>

      <p className="mt-8"><Link to="/" className="text-brand underline">← Back home</Link></p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-3 text-base text-foreground/85 leading-relaxed">{children}</div>
    </section>
  );
}
