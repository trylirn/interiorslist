import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Texas Aesthetics" },
      { name: "description", content: "Terms governing use of Texas Aesthetics, including medical disclaimers." },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Terms of Service — Texas Aesthetics" },
      { property: "og:description", content: "Terms of use and medical disclaimers." },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">Legal</p>
      <h1 className="mt-2 font-display text-5xl">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <Section title="Acceptance">
        By accessing or using Texas Aesthetics (the "Site"), you agree to these Terms. If you do not agree, do not use the Site.
      </Section>

      <Section title="Use of the Site">
        The Site is provided for personal, informational use. You may not scrape, resell, or republish listing data in bulk, attempt to circumvent security controls, or use the Site to harass any provider.
      </Section>

      <Section title="Directory content">
        Business listings — names, addresses, websites, contact details, and service descriptions — are compiled from publicly available information about Texas-licensed medspas and aesthetic clinics, and are verified before publication. Information may be incomplete or outdated. If you are a business owner, please <Link to="/contact" className="text-brand underline">contact us</Link> or use our <Link to="/submit" className="text-brand underline">submission</Link> form to request corrections or removal.
      </Section>

      <Section title="Medical disclaimer">
        Texas Aesthetics is an informational directory. Nothing on the Site is medical advice, diagnosis, or treatment. Always verify a provider's licensure (Texas Medical Board, Texas Board of Nursing) and consult a qualified healthcare professional before any cosmetic procedure. We make no warranty regarding the safety, qualifications, or outcomes of any listed provider.
      </Section>

      <Section title="No endorsement">
        Inclusion of a provider in the directory is not an endorsement.
      </Section>

      <Section title="User submissions and claims">
        If you submit a business or claim a listing, you represent that the information is accurate and that you have the right to submit it. We may approve, reject, or remove submissions at our discretion.
      </Section>

      <Section title="Takedown requests">
        Business owners may request removal or correction of their listing by contacting us. We respond to legitimate requests within a reasonable time.
      </Section>

      <Section title="Limitation of liability">
        The Site is provided "as is" without warranties of any kind. To the maximum extent permitted by law, Texas Aesthetics is not liable for any damages arising from your use of the Site or reliance on listed information.
      </Section>

      <Section title="Changes">
        We may update these Terms periodically. Continued use of the Site after changes constitutes acceptance.
      </Section>

      <Section title="Contact">
        Questions? <Link to="/contact" className="text-brand underline">Contact us</Link>.
      </Section>

      <p className="mt-12"><Link to="/" className="text-brand underline">← Back home</Link></p>
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
