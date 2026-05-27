import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Texas Aesthetics" },
      { name: "description", content: "How Texas Aesthetics collects, uses, and protects your information." },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Privacy Policy — Texas Aesthetics" },
      { property: "og:description", content: "How Texas Aesthetics handles your data." },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">Legal</p>
      <h1 className="mt-2 font-display text-5xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <Section title="Overview">
        Texas Aesthetics ("we", "us") operates a directory of aesthetic injectors in Texas. This policy explains what information we collect and how we use it.
      </Section>

      <Section title="Information we collect">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account information</strong> you provide when you create an account, save favorites, claim a listing, or submit a business.</li>
          <li><strong>Submission and claim data</strong> you provide about businesses you operate or recommend.</li>
          <li><strong>Usage data</strong> such as pages viewed and standard server/analytics logs.</li>
          <li><strong>Cookies</strong> for authentication sessions and preferences.</li>
        </ul>
      </Section>

      <Section title="Data sources for business listings">
        Business listings — including names, addresses, websites, email, and service descriptions — are sourced from publicly available information about Texas-licensed medspas and aesthetic clinics. Listings are reviewed and verified before publication. Business owners can request updates or removal via our <Link to="/contact" className="text-brand underline">contact</Link> or <Link to="/submit" className="text-brand underline">submission</Link> forms.
      </Section>

      <Section title="How we use information">
        <ul className="list-disc pl-5 space-y-1">
          <li>To operate the directory and provide search, favorites, and account features.</li>
          <li>To process listing submissions and ownership claims.</li>
          <li>To improve site quality, fix bugs, and prevent abuse.</li>
        </ul>
      </Section>

      <Section title="Sharing">
        We do not sell personal information. We share data only with infrastructure providers needed to run the site (hosting, database, authentication) under appropriate confidentiality terms.
      </Section>

      <Section title="Your choices">
        You can delete your account at any time from your dashboard. Contact us for data export or deletion requests.
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
