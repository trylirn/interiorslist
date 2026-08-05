import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Discover Medspa" },
      { name: "description", content: "How Discover Medspa collects, uses, shares, and protects your information — including CCPA, GDPR, and Texas TDPSA rights." },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Privacy Policy — Discover Medspa" },
      { property: "og:description", content: "How Discover Medspa handles your data." },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">Legal</p>
      <h1 className="mt-2 font-display text-5xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <p className="mt-6 rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-xs italic text-muted-foreground">
        This document is a general template. It is not legal advice. Please have qualified counsel review and adapt it to your specific data practices before relying on it.
      </p>

      <Section title="1. Overview">
        Discover Medspa ("we", "us", or "our") operates a consumer-facing directory of Texas medspas and aesthetic injectors at texas-beauty-glow.lovable.app (the "Site"). This Privacy Policy explains what information we collect, how we use it, who we share it with, and the choices and rights you have. It applies to visitors, account holders, business owners who claim or submit listings, and reviewers.
      </Section>

      <Section title="2. HIPAA and health information — please do not send us PHI">
        Discover Medspa is <strong>not a Covered Entity or Business Associate</strong> under HIPAA. We do not knowingly collect protected health information ("PHI"), medical records, diagnosis codes, prescription information, or treatment history. Please do not include health-related details in reviews, contact forms, submission forms, claim forms, or any messages you send through the Site. If you voluntarily submit such information, it is not protected by HIPAA in our hands and is governed by these terms and by the Terms of Service. Communicate with healthcare providers directly through their own HIPAA-compliant channels.
      </Section>

      <Section title="3. Information we collect">
        <p className="font-medium">Information you provide:</p>
        <ul className="mt-1 list-disc pl-5 space-y-1">
          <li><strong>Account information</strong>: email address, display name, and authentication credentials when you create an account.</li>
          <li><strong>Business submissions and claims</strong>: business name, address, website, contact email, contact phone, license type and number, NPI, uploaded license or credential documents, and any notes you provide.</li>
          <li><strong>Reviews and messages</strong>: your display name, email, star rating, and review text; details you send through a provider contact form.</li>
          <li><strong>Preferences</strong>: favorites, saved comparisons, and quiz answers such as treatment category and city.</li>
        </ul>

        <p className="mt-4 font-medium">Information collected automatically:</p>
        <ul className="mt-1 list-disc pl-5 space-y-1">
          <li><strong>Usage data</strong>: pages viewed, provider profiles opened, searches, referring URL, and timestamps.</li>
          <li><strong>Device and log data</strong>: IP address, user-agent string, browser, OS, approximate location derived from IP, and standard server logs.</li>
          <li><strong>Cookies and similar technologies</strong>: session cookies for authentication and preferences, and (where applicable) analytics identifiers. See Section 8.</li>
        </ul>

        <p className="mt-4 font-medium">Information from third parties:</p>
        <ul className="mt-1 list-disc pl-5 space-y-1">
          <li><strong>Publicly available business data</strong> about Texas-licensed medspas and aesthetic clinics used to populate the directory (business name, address, phone, website, hours, public reviews on the open web, and content ingested via automated tools).</li>
          <li><strong>Sign-in providers</strong>: if you sign in with Google, we receive your name and email as authorized by you.</li>
        </ul>
      </Section>

      <Section title="4. What we do NOT collect">
        We do not knowingly collect: PHI, medical diagnoses or treatment history, financial-account or full payment-card numbers, Social Security numbers, biometric identifiers, precise real-time device location, or information from children (see Section 12).
      </Section>

      <Section title="5. How we use information">
        We use information to:
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>operate the directory: search, provider profiles, favorites, comparisons, reviews, articles, and maps;</li>
          <li>authenticate users and secure accounts;</li>
          <li>process listing submissions and ownership claims, including verification;</li>
          <li>deliver messages you send to providers through the contact form;</li>
          <li>send transactional emails (verification, password reset, claim status);</li>
          <li>measure usage, debug, prevent abuse, and improve the Site;</li>
          <li>comply with law and enforce our Terms.</li>
        </ul>
        We do <strong>not</strong> sell personal information for money. We do not use your information to train third-party AI models.
      </Section>

      <Section title="6. Legal bases (EEA / UK visitors)">
        Where GDPR or UK GDPR applies, we rely on: (a) <em>contract</em> — to provide features you request; (b) <em>legitimate interests</em> — to operate, secure, and improve the Site, aggregate the directory, and prevent abuse, balanced against your rights; (c) <em>consent</em> — for optional analytics or marketing cookies where required; and (d) <em>legal obligation</em> — to comply with applicable law.
      </Section>

      <Section title="7. How we share information">
        We share information only as needed:
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><strong>Providers you contact.</strong> When you use a provider contact form, we deliver your message and contact details to that specific provider. Once delivered, the provider is an independent controller of that information.</li>
          <li><strong>Service providers (subprocessors).</strong> Hosting, database, authentication, email delivery, error monitoring, analytics, maps and geocoding, and content ingestion vendors, bound by confidentiality and data-processing obligations.</li>
          <li><strong>Business owners.</strong> Aggregate view counts and lead counts related to their own listing.</li>
          <li><strong>Legal and safety.</strong> To comply with a lawful subpoena, court order, or government request; to enforce our Terms; to protect the rights, safety, or property of Discover Medspa, users, or the public; or in connection with fraud investigations.</li>
          <li><strong>Corporate transactions.</strong> If we're involved in a merger, acquisition, financing, or sale of assets, information may transfer as part of that transaction, subject to reasonable confidentiality protections.</li>
        </ul>
        We do not sell or rent your personal information to third parties for their independent marketing.
      </Section>

      <Section title="8. Cookies, analytics, and tracking">
        We use essential cookies for authentication and preferences, and (where applicable) first-party analytics cookies to understand aggregate usage. You can block or delete cookies in your browser; blocking essential cookies will break sign-in and other core features. We respect the Global Privacy Control ("GPC") signal where legally required as an opt-out of "sale" and "sharing" for cross-context behavioral advertising.
      </Section>

      <Section title="9. Data retention">
        We retain personal information only as long as needed for the purposes described above, unless a longer retention period is required by law. Typical retention:
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Account data — until you delete your account, then deleted or de-identified within 30 days (backups may persist up to 90 days).</li>
          <li>Reviews and public User Content — retained as part of the directory unless removed for policy violation or at your request.</li>
          <li>Submission and claim records — up to 24 months for audit and abuse prevention.</li>
          <li>Server and analytics logs — up to 12 months, then aggregated or deleted.</li>
        </ul>
      </Section>

      <Section title="10. Security">
        We use commercially reasonable administrative, technical, and physical safeguards to protect information — including HTTPS in transit, encryption at rest for our managed database, access controls, and audit logs. No system is perfectly secure; we cannot guarantee absolute security. If you believe your account has been compromised, contact us immediately.
      </Section>

      <Section title="11. Data breach notification">
        If we experience a security incident that materially affects your personal information, we will notify affected users and applicable regulators as required by law, and describe the nature of the incident, the categories of information involved, and the steps we're taking in response.
      </Section>

      <Section title="12. Children">
        The Site is not intended for anyone under 18. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided personal information, contact us and we will delete it.
      </Section>

      <Section title="13. Your rights">
        Depending on where you live, you may have some or all of the following rights:
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><strong>Access</strong> — request a copy of the personal information we hold about you.</li>
          <li><strong>Correction</strong> — ask us to correct inaccurate information.</li>
          <li><strong>Deletion</strong> — ask us to delete your personal information, subject to legal exceptions.</li>
          <li><strong>Portability</strong> — receive your information in a machine-readable format.</li>
          <li><strong>Restriction / objection</strong> — object to certain processing based on legitimate interests.</li>
          <li><strong>Withdraw consent</strong> — where processing is based on consent.</li>
          <li><strong>Opt out of "sale" or "sharing"</strong> — as those terms are defined under state law. We do not sell your personal information; we honor GPC signals where required.</li>
          <li><strong>Non-discrimination</strong> — we will not deny service, charge different prices, or provide a lower quality of service because you exercised a privacy right.</li>
        </ul>
        <p className="mt-3">To exercise a right, use our <Link to="/contact" className="text-brand underline">contact form</Link>. We may need to verify your identity before responding. If you use an authorized agent, we may require written authorization. We will respond within the timeframes required by applicable law (typically 30–45 days).</p>
        <p className="mt-3"><strong>California residents (CCPA/CPRA)</strong>, <strong>EEA/UK residents (GDPR)</strong>, and <strong>Texas residents (Texas Data Privacy and Security Act)</strong> have specific rights described above and the right to appeal a denial of a rights request or lodge a complaint with a supervisory authority (in the EEA/UK) or the Texas Attorney General.</p>
      </Section>

      <Section title="14. International data transfers">
        We are based in the United States and our service providers may process information in the U.S. and other countries. Where we transfer personal information from the EEA, UK, or Switzerland, we rely on appropriate safeguards such as the European Commission's Standard Contractual Clauses.
      </Section>

      <Section title="15. Do Not Track and GPC">
        Our Site does not respond to browser Do Not Track signals as a general opt-out because there is no consensus standard. Where required by law, we treat a GPC signal as an opt-out of "sale" and "sharing".
      </Section>

      <Section title="16. Third-party links">
        The Site links to provider websites and other third-party services. Their privacy practices are governed by their own policies. We are not responsible for their content or practices.
      </Section>

      <Section title="17. Changes to this Policy">
        We may update this Policy from time to time. If a change is material, we will post a notice on the Site or update the "Last updated" date above. Your continued use of the Site after changes take effect constitutes acceptance of the updated Policy.
      </Section>

      <Section title="18. Contact">
        Questions, rights requests, or complaints? <Link to="/contact" className="text-brand underline">Contact us</Link>.
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
