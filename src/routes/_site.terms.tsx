import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Intearior" },
      { name: "description", content: "Terms governing use of Intearior, including disclaimers, user content, and dispute resolution." },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Terms of Service — Intearior" },
      { property: "og:description", content: "Terms, disclaimers, and dispute resolution for Intearior." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/terms" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">Legal</p>
      <h1 className="mt-2 font-display text-5xl">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <p className="mt-6 rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-xs italic text-muted-foreground">
        This document is a general template. It is not legal advice. Please have qualified counsel review and adapt it to your specific operation before relying on it.
      </p>

      <Section title="1. Agreement to these Terms">
        These Terms of Service ("Terms") form a binding agreement between you and Intearior ("Intearior", "we", "us", or "our") governing your access to and use of our website and any related services, features, and content (collectively, the "Site"). By accessing or using the Site — including by browsing, searching, creating an account, submitting a claim or business listing, posting a review, or contacting a studio through the Site — you agree to be bound by these Terms and by our <Link to="/privacy" className="text-brand underline">Privacy Policy</Link>, which is incorporated by reference. If you do not agree, do not use the Site.
      </Section>

      <Section title="2. Eligibility">
        You must be at least 18 years old and legally able to form a binding contract to use the Site. The Site is intended for use by residents of the United States. If you use the Site from outside the U.S., you are responsible for compliance with any local laws that apply to you.
      </Section>

      <Section title="3. Nature of the service — informational directory only">
        Intearior is a consumer-facing informational directory that lists interior design studios across the United States. We are not an interior design firm, architectural firm, general contractor, or party to any contract between a client and a studio. We do not:
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>design, build, renovate, or provide any professional design, architectural, or engineering service;</li>
          <li>form a client–designer relationship with you;</li>
          <li>refer you to any specific studio, or receive compensation for individual referrals;</li>
          <li>guarantee the qualifications, licensing, insurance, availability, pricing, or outcomes of any listed studio.</li>
        </ul>
        Inclusion of a business in the directory is not an endorsement. Verified badges reflect our own basic verification checks and are not a substitute for your own diligence.
      </Section>

      <Section title="4. No professional advice">
        The content on the Site — including design guides, editorial articles, studio descriptions, FAQs, service listings, and any information linked from studio websites — is for general informational purposes only. It is <strong>not professional, architectural, or engineering advice</strong>. Always verify a studio's licensing, insurance, and professional credentials and certifications, and review any proposed contract carefully — with your own legal counsel if needed — before engaging a studio for any project.
      </Section>

      <Section title="5. Verify licensing, insurance, and contracts yourself">
        We do not verify, on an ongoing basis, that any listed studio maintains current business licensing, contractor licensing, or insurance coverage required in its jurisdiction. You are solely responsible for confirming a studio's licensing, insurance, references, and contract terms before hiring them. Do not rely on the Site as a substitute for that diligence.
      </Section>

      <Section title="6. Accounts and account security">
        Some features require an account. You agree to provide accurate information, keep your credentials confidential, and promptly notify us of any unauthorized use. You are responsible for all activity under your account. We may suspend or terminate accounts that violate these Terms.
      </Section>

      <Section title="7. Acceptable use">
        You agree not to:
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>scrape, spider, crawl, or use any automated means to access the Site except as expressly permitted by our robots.txt;</li>
          <li>republish, resell, sublicense, or create derivative databases from listing data in bulk;</li>
          <li>reverse engineer, decompile, or attempt to bypass any security or rate-limiting mechanism;</li>
          <li>submit false, misleading, defamatory, harassing, or unlawful content, including fake reviews, impersonation, or content that infringes another person's rights;</li>
          <li>use the Site to send unsolicited communications to studios or other users;</li>
          <li>use the Site to violate any law, regulation, or third-party right, including advertising, consumer protection, and telemarketing laws.</li>
        </ul>
      </Section>

      <Section title="8. User content and reviews">
        You retain ownership of any content you submit (reviews, photos, submissions, claim materials, messages) ("User Content"). By submitting User Content, you grant Intearior a worldwide, non-exclusive, royalty-free, perpetual, irrevocable, sublicensable license to host, store, reproduce, modify (for formatting), publish, display, and distribute the User Content in connection with operating and promoting the Site. You represent and warrant that (a) you own or control all rights to the User Content, (b) it is accurate and not misleading, and (c) it does not violate these Terms or any law.<br /><br />
        Reviews must reflect your genuine, first-hand experience. We may remove any User Content at our sole discretion, including for suspected fake, incentivized, defamatory, or off-topic reviews.
      </Section>

      <Section title="9. Studio listings, claims, and accuracy">
        Business listings — names, addresses, websites, contact details, service descriptions, articles, and hours — are compiled from publicly available information about interior design studios, from information provided by owners who claim their listing, and from third-party sources such as public web content ingested via automated tools. Information may be incomplete, outdated, or contain errors. If you are a business owner or authorized representative, you may claim or update your listing via our <Link to="/claim/$slug" params={{ slug: "your-listing" }} className="text-brand underline">claim flow</Link>, our <Link to="/submit" className="text-brand underline">submission form</Link>, or by contacting us. We may approve, reject, edit, delist, or remove any listing or claim at our sole discretion.
      </Section>

      <Section title="9a. Consultation and match requests">
        Our Get Matched flow and studio consultation forms let you send your project brief and contact details to studios you choose. We pass those details on as a courtesy introduction only: we do not vet the request, we are not paid for individual introductions, and we do not guarantee that any studio will reply, quote, or take on your project. You are responsible for the accuracy of what you submit, and for not using these forms to send unsolicited marketing or bulk enquiries.
      </Section>

      <Section title="10. Third-party sites, off-platform engagements, and studio communications">
        The Site links to third-party websites and services, and enables you to contact studios directly. Once you leave the Site or communicate with a studio (whether through our contact form or a link to the studio's website, phone, or booking system), any subsequent interaction — including consultations, proposals, contracts, payments, project work, and disputes — is solely between you and that studio. We are not a party to that relationship. We are not responsible for studio availability, pricing, workmanship, safety, refund policies, or the content and privacy practices of any third-party site.
      </Section>

      <Section title="11. Intellectual property">
        The Site, including its design, code, editorial content, aggregated data, trademarks, and logos, is owned by Intearior or its licensors and protected by U.S. and international intellectual-property laws. Studio names, brands, and logos are the property of their respective owners and are used for identification purposes only. Except for the limited license to use the Site for personal, non-commercial purposes, we grant you no rights in our intellectual property.
      </Section>

      <Section title="12. DMCA copyright policy">
        If you believe content on the Site infringes your copyright, send a notice under 17 U.S.C. § 512(c) to our designated agent that includes: (i) a physical or electronic signature of the copyright owner or authorized agent; (ii) identification of the copyrighted work; (iii) identification of the material claimed to be infringing and its location on the Site; (iv) your contact information; (v) a good-faith statement that the use is not authorized; and (vi) a statement, under penalty of perjury, that the notice is accurate and you are authorized to act. Send notices to the contact address in Section 20. We may remove content and terminate repeat infringers.
      </Section>

      <Section title="13. Disclaimers of warranties">
        THE SITE, INCLUDING ALL CONTENT, LISTINGS, USER CONTENT, ARTICLES, AND FEATURES, IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, AND UNINTERRUPTED OR ERROR-FREE OPERATION. WE DO NOT WARRANT THE QUALIFICATIONS, LICENSING, INSURANCE, SAFETY, PRICING, AVAILABILITY, OR RESULTS OF ANY LISTED STUDIO. NO ADVICE OR INFORMATION OBTAINED FROM THE SITE CREATES ANY WARRANTY NOT EXPRESSLY STATED HERE.
      </Section>

      <Section title="14. Limitation of liability">
        TO THE FULLEST EXTENT PERMITTED BY LAW, INTEARIOR AND ITS OFFICERS, EMPLOYEES, AGENTS, AND LICENSORS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO YOUR USE OF THE SITE, ANY LISTED STUDIO, ANY USER CONTENT, OR THESE TERMS, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR AGGREGATE LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THE SITE WILL NOT EXCEED THE GREATER OF (A) ONE HUNDRED U.S. DOLLARS ($100) OR (B) THE AMOUNTS YOU PAID US IN THE TWELVE MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM. SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS; IN THOSE JURISDICTIONS OUR LIABILITY IS LIMITED TO THE MAXIMUM EXTENT PERMITTED.
      </Section>

      <Section title="15. Indemnification">
        You will indemnify, defend, and hold harmless Intearior and its officers, employees, and agents from and against any claims, damages, liabilities, and reasonable expenses (including attorneys' fees) arising out of or related to (a) your User Content, (b) your use of the Site, (c) your interactions with any studio, (d) your violation of these Terms or any law, or (e) your violation of any third-party right.
      </Section>

      <Section title="16. Termination">
        We may suspend or terminate your access to the Site or any feature at any time, with or without notice, for any reason including suspected violation of these Terms. Sections that by their nature should survive termination will survive, including Sections 4, 5, 8, 11–15, 17, and 18.
      </Section>

      <Section title="17. Governing law">
        These Terms are governed by the laws of the state in which we maintain our principal place of business, without regard to conflict-of-laws principles. Subject to Section 18, any dispute not subject to arbitration will be brought exclusively in the state or federal courts located in the county where we maintain our principal place of business, and you consent to personal jurisdiction and venue there.
      </Section>

      <Section title="18. Binding arbitration and class-action waiver">
        <strong>Please read this section carefully. It affects your legal rights.</strong><br /><br />
        You and Intearior agree that any dispute, claim, or controversy arising out of or relating to these Terms or the Site ("Dispute") will be resolved by <strong>binding, individual arbitration</strong> administered by the American Arbitration Association ("AAA") under its Consumer Arbitration Rules, and not in court, except that (a) either party may bring an individual action in small-claims court, and (b) either party may seek injunctive or other equitable relief in court for infringement or misuse of intellectual property. Arbitration will take place in the county where we maintain our principal place of business, or another location the parties agree on. Judgment on the award may be entered in any court of competent jurisdiction. The arbitrator, not any court, has exclusive authority to resolve threshold issues of arbitrability.<br /><br />
        <strong>Class-action waiver.</strong> You and Intearior agree that each may bring claims against the other only in an individual capacity, and <strong>not as a plaintiff or class member in any purported class, collective, consolidated, or representative proceeding</strong>. The arbitrator may not consolidate claims of multiple persons and may not preside over any form of representative or class proceeding. If this class-action waiver is found unenforceable as to a particular claim, that claim will be severed and heard in court, and the rest of this Section 18 will remain in force.<br /><br />
        <strong>30-day opt-out.</strong> You may opt out of this Section 18 by sending written notice to the contact address in Section 20 within 30 days after first accepting these Terms. The notice must include your name, address, and a clear statement that you opt out of arbitration.
      </Section>

      <Section title="19. Changes to these Terms">
        We may update these Terms from time to time. If a change is material, we will post a notice on the Site or update the "Last updated" date above. Your continued use of the Site after changes take effect constitutes acceptance of the updated Terms.
      </Section>

      <Section title="20. Miscellaneous and contact">
        These Terms, together with the Privacy Policy, are the entire agreement between you and Intearior with respect to the Site and supersede prior agreements. If any provision is held unenforceable, the remaining provisions remain in effect. Our failure to enforce any right is not a waiver of that right. You may not assign these Terms; we may assign them freely. Questions, notices, and legal contact: <Link to="/contact" className="text-brand underline">use our contact form</Link>.
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
