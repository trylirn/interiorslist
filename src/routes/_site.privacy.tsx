import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Intearior" },
      { name: "description", content: "How Intearior collects, uses, shares, retains, and protects your information — including CCPA and GDPR rights." },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Privacy Policy — Intearior" },
      { property: "og:description", content: "How Intearior handles your data." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/privacy" },
      { name: "twitter:card", content: "summary" },
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

      <Section title="1. Who we are">
        <p>
          Intearior, operated by Intearior LLC ("we," "us," or "our"), is a technology platform that helps homeowners and
          businesses discover and engage independent interior design professionals, including interior designers,
          interior decorators, interior architects, kitchen and bath designers, home stagers, space planners, and other
          design and furnishing professionals (collectively, "Studios"). This Privacy Policy explains how we collect,
          use, disclose, and protect your information when you use our platform, websites, and services (collectively,
          the "Services").
        </p>
        <p className="mt-3">
          By using the Services, you consent to the practices described in this policy. If you do not agree, please do
          not use our Services.
        </p>
        <p className="mt-3">Contact: contact@intearior.com | www.intearior.com</p>
      </Section>

      <Section title="2. Your rights relating to your personal data">
        Depending on your location, you may have the following rights regarding your personal data:
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Request access to your personal data.</li>
          <li>Request correction of inaccurate or incomplete information.</li>
          <li>Request erasure of your data where no legal reason exists for us to keep it.</li>
          <li>Object to processing of your data where we rely on legitimate interests.</li>
          <li>Request restriction of processing.</li>
          <li>Request data portability.</li>
          <li>Withdraw consent where we rely on consent to process personal data.</li>
        </ul>
        <p className="mt-3">
          To exercise any of these rights, contact us at contact@intearior.com or through our{" "}
          <Link to="/contact" className="text-brand underline">contact form</Link>. We will respond in accordance with
          applicable law and will not discriminate against you for exercising your privacy rights.
        </p>
      </Section>

      <Section title="3. What personal data we collect">
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><strong>Contact data</strong> — name, email address, and phone number (phone is required on consultation and match requests).</li>
          <li><strong>Studio profile data</strong> — business name, address, service areas, business hours, services, styles, typical project cost, photos, certifications, and any credential documents submitted when claiming or submitting a listing.</li>
          <li><strong>Review data</strong> — display name, rating, and review text. Where a studio imports reviews from Google or from its own website, we store the review text, author name, and source.</li>
          <li><strong>Financial data</strong> — payment information only from studios who purchase a premium listing. Payments are processed by Stripe; we do not store full card details.</li>
          <li><strong>Transaction data</strong> — records of payments, subscriptions, and billing history.</li>
          <li><strong>Lead and inquiry data</strong> — information submitted when you complete the Get Matched quiz, a consultation request, or a contact form, including project type, location, budget range, timeline, style preferences, and other self-reported details.</li>
          <li><strong>Marketing preferences</strong> — whether you have opted in to receive marketing emails.</li>
          <li><strong>Usage and analytics data</strong> — pages visited, studios viewed, searches run, time on site, referral source, browser type, device information, and approximate location derived from IP, collected via cookies and first-party analytics.</li>
        </ul>
      </Section>

      <Section title="4. How we use your personal data">
        We use personal data to:
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>provide, personalize, and improve our Services;</li>
          <li>generate Get Matched results based on your self-reported preferences;</li>
          <li>deliver your consultation request and contact details to the studios you select;</li>
          <li>manage studio accounts, listing claims, and customer support;</li>
          <li>conduct research, reporting, and analytics on platform usage and demand trends;</li>
          <li>facilitate payments and transactions;</li>
          <li>send transactional emails (sign-in links, claim status, new leads) and marketing emails to opted-in users;</li>
          <li>ensure platform security and prevent fraud;</li>
          <li>comply with legal and regulatory obligations.</li>
        </ul>
        <p className="mt-3">
          We rely on legitimate interests, user consent, and contractual obligations as our legal bases for processing
          data. We do not sell personal information.
        </p>
      </Section>

      <Section title="5. Data retention">
        We retain personal data for as long as necessary to fulfill the purposes described in this policy or as required
        by law. The following retention schedule applies:
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><strong>Review content</strong> — retained indefinitely while a studio is listed; deleted or anonymized within 2 years after a studio is removed or delisted.</li>
          <li><strong>Lead and inquiry data</strong> — retained indefinitely for legitimate business and analytics purposes, including reporting on platform usage and demand trends. You may request deletion of your personal identifiers (such as name, email, and phone) at any time by contacting contact@intearior.com, and we will honor such requests subject to applicable legal retention obligations.</li>
          <li><strong>Studio account data</strong> — retained indefinitely for legitimate business, legal, and compliance purposes, including maintaining records of studios that have been listed on the platform.</li>
          <li><strong>Studio payment and transaction data</strong> — retained for 7 years in accordance with IRS recordkeeping requirements. Payment data is processed and stored by our payment processor, Stripe.</li>
          <li><strong>Account closure survey responses</strong> — retained in de-identified form for product improvement.</li>
          <li><strong>Email marketing opt-in and opt-out records</strong> — retained for compliance and legal purposes.</li>
          <li><strong>Analytics and cookie data</strong> — retained for up to 26 months, consistent with industry standard.</li>
          <li><strong>General correspondence</strong>, including emails and support communications — retained for legitimate business and compliance purposes.</li>
        </ul>
        <p className="mt-3">
          Even if you request deletion, we may retain certain information where required by law, for fraud prevention,
          or to fulfill legitimate business obligations (such as the payment retention period above). In those cases we
          retain only the minimum data necessary.
        </p>
      </Section>

      <Section title="6. Third-party services and data collection">
        We use the following categories of third-party services to operate the platform. Each handles data
        independently under its own privacy policy. Intearior does not control how these third parties process user
        data, and we encourage you to review their policies:
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><strong>Cloud hosting, database, authentication, and file storage</strong> — platform infrastructure and account sign-in.</li>
          <li><strong>Stripe</strong> — payment processing for premium studio listings.</li>
          <li><strong>Google Maps Platform and Google Places</strong> — geocoding studio addresses and importing public Google reviews and ratings.</li>
          <li><strong>Transactional email delivery</strong> — sign-in links, claim updates, and lead notifications sent from our notification domain.</li>
          <li><strong>OpenAI</strong> — generating the adaptive questions used in the Get Matched flow.</li>
          <li><strong>First-party analytics</strong> — measuring page views, searches, and studio engagement.</li>
        </ul>
        <p className="mt-3">
          The platform and its service providers may use cookies and similar tracking technologies to enhance user
          experience, analyze trends, and manage performance. You can control cookie preferences through your browser
          settings; blocking essential cookies will break sign-in and other core features.
        </p>
        <p className="mt-3 font-medium">Do Not Track</p>
        <p>
          Some browsers offer a "Do Not Track" ("DNT") feature. Intearior does not currently respond to or honor DNT
          signals. We adhere to the standards described in this Privacy Policy and provide the opt-out and data rights
          mechanisms described herein. We honor Global Privacy Control signals where legally required.
        </p>
      </Section>

      <Section title="7. Aggregated data">
        We may collect aggregated data such as statistical or demographic data which does not identify individuals.
        However, if aggregated data is combined with personal data that can identify you, we treat the combined data as
        personal data under this policy.
      </Section>

      <Section title="8. How we protect your personal data">
        We implement industry-standard administrative and technical security measures to protect personal data,
        including HTTPS in transit, encryption at rest for our managed database, access controls, and audit logs. Data
        is stored using reputable third-party infrastructure providers, each of which maintains its own security
        controls. Despite these measures, no method of transmission or storage is 100% secure, and we cannot guarantee
        absolute security. You are responsible for maintaining the confidentiality of your account credentials.
      </Section>

      <Section title="9. Children's privacy">
        Intearior is intended for users who are 18 years of age or older. We do not knowingly collect personal data from
        children under 13. If we learn that we have inadvertently collected data from a child under 13, we will delete
        it immediately. If you believe a child has provided us with personal data, contact us at contact@intearior.com.
      </Section>

      <Section title="10. Google API services">
        Intearior's use and transfer of information received from Google APIs to any other application will adhere to
        the Google API Services User Data Policy, including the Limited Use requirements.
      </Section>

      <Section title="11. Links to other websites">
        Our Services may contain links to external websites, including studio websites. We are not responsible for the
        content, privacy policies, or data practices of those external sites.
      </Section>

      <Section title="12. California residents — CCPA rights">
        <p className="font-medium">Categories of personal information collected</p>
        <p className="mt-1">In the preceding 12 months, Intearior may have collected the following categories of personal information as defined by the CCPA:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><strong>Identifiers</strong> — name, email address, phone number, and account information.</li>
          <li><strong>Commercial information</strong> — payment records, subscription history, and platform interactions.</li>
          <li><strong>Internet and electronic network activity</strong> — browsing behavior on the platform, pages visited, and analytics data.</li>
          <li><strong>Professional or employment-related information</strong> — professional credentials and profile data submitted by studios.</li>
          <li><strong>Inferences</strong> — preferences and interests derived from usage data (for example, the design style or project type sought).</li>
        </ul>
        <p className="mt-3 font-medium">Your CCPA rights</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><strong>Right to know</strong> — request information about the categories and specific pieces of personal data we have collected, their sources, the purposes for use, and the categories of third parties with whom they are shared.</li>
          <li><strong>Right to delete</strong> — request deletion of personal data we have collected, subject to certain exceptions such as our legal retention obligations.</li>
          <li><strong>Right to opt out</strong> — opt out of the sale of your personal information. Intearior does not sell personal information.</li>
          <li><strong>Right to non-discrimination</strong> — we will not discriminate against you for exercising your CCPA rights.</li>
        </ul>
        <p className="mt-3">
          To exercise any of these rights, contact us at contact@intearior.com with the subject line "California Privacy
          Request."
        </p>
      </Section>

      <Section title="13. European residents — GDPR">
        <p>
          Intearior is operated in the United States and is primarily intended for U.S. residents. However, if you are
          located in the European Economic Area (EEA), the United Kingdom, or Switzerland, you may have additional
          rights under the General Data Protection Regulation (GDPR) or equivalent local laws.
        </p>
        <p className="mt-3">
          To the extent GDPR applies, we process your data on the following legal bases: performance of a contract (to
          provide our Services), legitimate interests (to operate and improve the platform), legal compliance, and
          consent where explicitly obtained.
        </p>
        <p className="mt-3">
          EEA residents may have the right to access, correct, delete, restrict, or port their personal data, and to
          object to certain processing. To exercise any of these rights, contact us at contact@intearior.com. You also
          have the right to lodge a complaint with your local data protection authority.
        </p>
        <p className="mt-3">
          By using the platform, any personal data we collect may be transferred to and processed in the United States,
          which may not provide the same level of data protection as your home country. By using our Services, you
          consent to such transfer and processing.
        </p>
      </Section>

      <Section title="14. Changes to this Privacy Policy">
        We reserve the right to update this Privacy Policy at any time. Changes take effect upon posting to the
        platform. Users will be notified of material updates via email or a prominent notice on the platform.
      </Section>

      <Section title="15. Contact us">
        For any privacy-related concerns or to exercise your rights, contact us at:
        <p className="mt-2">
          Intearior — Intearior LLC
          <br />
          Email: contact@intearior.com
          <br />
          Website: www.intearior.com
        </p>
        <p className="mt-2">
          You can also reach us through our <Link to="/contact" className="text-brand underline">contact form</Link>.
        </p>
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
