import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Texas Aesthetics" },
      { name: "description", content: "Terms governing your use of Texas Aesthetics, including third-party data sources and medical disclaimers." },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Terms of Service — Texas Aesthetics" },
      { property: "og:description", content: "Terms of use, third-party data, and medical disclaimers." },
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

      <Section title="Third-party data">
        Business listing information on the Site — including names, addresses, contact details, hours, photos, ratings, and reviews — is sourced from <strong>Google Maps Platform</strong> (Places API) and is refreshed periodically. We display this data in accordance with Google's terms. We do not author, edit, or moderate the underlying patient reviews. Use of Google-sourced data is also subject to <a href="https://cloud.google.com/maps-platform/terms" target="_blank" rel="noopener noreferrer" className="text-brand underline">Google Maps Platform Terms of Service</a>.
        <p className="mt-3">If you are a business owner and information appears outdated or inaccurate, please update it directly with Google, or use our <Link to="/submit" className="text-brand underline">submission</Link> form to request a correction.</p>
      </Section>

      <Section title="Medical disclaimer">
        Texas Aesthetics is an informational directory. Nothing on the Site is medical advice, diagnosis, or treatment. Always verify a provider's licensure (e.g., Texas Medical Board, Texas Board of Nursing) and consult a qualified healthcare professional before any cosmetic procedure. We make no warranty regarding the safety, qualifications, or outcomes of any listed provider.
      </Section>

      <Section title="No endorsement">
        Inclusion of a provider in the directory is not an endorsement. Rankings reflect aggregated public ratings and do not constitute a recommendation.
      </Section>

      <Section title="User submissions and claims">
        If you submit a business or claim a listing, you represent that the information is accurate and that you have the right to submit it. We may approve, reject, or remove submissions at our discretion.
      </Section>

      <Section title="Takedown requests">
        Business owners may request removal or correction of their listing by contacting us. We will respond to legitimate requests within a reasonable time.
      </Section>

      <Section title="Limitation of liability">
        The Site is provided "as is" without warranties of any kind. To the maximum extent permitted by law, Texas Aesthetics is not liable for any damages arising from your use of the Site or reliance on listed information.
      </Section>

      <Section title="Changes">
        We may update these Terms periodically. Continued use of the Site after changes constitutes acceptance.
      </Section>

      <Section title="Contact">
        Questions about these Terms? <Link to="/contact" className="text-brand underline">Contact us</Link>.
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
