import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Texas Aesthetics" },
      { name: "description", content: "How Texas Aesthetics collects, uses, and protects your information, including third-party data sources." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-20 prose-neutral">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">Legal</p>
      <h1 className="mt-2 font-display text-5xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <Section title="Overview">
        Texas Aesthetics ("we", "us") operates a directory of aesthetic injectors in Texas. This policy explains what information we collect, how we use it, and the third-party services we rely on.
      </Section>

      <Section title="Information we collect">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account information</strong> you provide when you create an account, save favorites, claim a listing, or submit a business (email, name, contact details).</li>
          <li><strong>Submission and claim data</strong> you provide about businesses you operate or recommend.</li>
          <li><strong>Usage data</strong> such as pages viewed, search terms, and device/browser metadata via standard server and analytics logs.</li>
          <li><strong>Cookies</strong> for authentication sessions and preference storage.</li>
        </ul>
      </Section>

      <Section title="Data sources for business listings">
        Business listing information — including names, addresses, phone numbers, websites, hours, photos, ratings, and patient reviews — is sourced from <strong>Google Maps Platform</strong> (Places API) and refreshed periodically. This data is publicly available and is displayed in accordance with Google's terms. We do not modify reviews or ratings. If you are a business owner and want a listing updated or removed, contact us or use the claim flow.
        <p className="mt-3 text-sm text-muted-foreground">Use of Google Maps data is subject to Google's <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand underline">Privacy Policy</a> and <a href="https://cloud.google.com/maps-platform/terms" target="_blank" rel="noopener noreferrer" className="text-brand underline">Maps Platform Terms</a>.</p>
      </Section>

      <Section title="How we use information">
        <ul className="list-disc pl-5 space-y-1">
          <li>To operate the directory and provide search, favorites, and account features.</li>
          <li>To process listing submissions and ownership claims.</li>
          <li>To improve site quality, fix bugs, and prevent abuse.</li>
          <li>To communicate with you about your account or submissions.</li>
        </ul>
      </Section>

      <Section title="Sharing">
        We do not sell personal information. We share data only with infrastructure providers needed to run the site (hosting, database, authentication) and with Google when fetching listing data, all under appropriate confidentiality and data-protection terms.
      </Section>

      <Section title="Your choices">
        You can delete your account at any time from your dashboard. You may request data export or deletion by contacting us.
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
