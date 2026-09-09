import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Intearior" },
      { name: "description", content: "The terms that govern your use of Intearior, the independent directory of interior design studios." },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Terms of Service — Intearior" },
      { property: "og:description", content: "The rules for using the Intearior directory." },
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
        This document is a general template. It is not legal advice. Please have qualified counsel review and adapt it
        before relying on it.
      </p>

      <Section title="1. Overview of services">
        <p>
          Intearior is a platform operated by Intearior LLC ("Company," "we," "our," or "us"). These Terms of Service
          ("Terms") govern your use of www.intearior.com and any related services (collectively, the "Platform"). By
          accessing or using Intearior, you agree to these Terms.
        </p>
        <ul className="mt-3 list-disc pl-5 space-y-1">
          <li>Intearior is a technology platform that helps people discover and engage independent interior design professionals, including interior designers, decorators, interior architects, kitchen and bath designers, home stagers, space planners, and related furnishing and renovation professionals (collectively, "Studios").</li>
          <li>Intearior does not provide interior design, architectural, engineering, contracting, or construction services.</li>
          <li>Intearior is not a party to any agreement, contract, or project between you and a Studio, and does not supervise any Studio's work.</li>
          <li>Intearior does not decide who you hire. Get Matched results are suggestions based on the preferences you enter; you independently decide which Studios you contact and engage.</li>
        </ul>
      </Section>

      <Section title="2. Studio review process and user responsibilities">
        <p>
          We review listing claims and submissions from Studios before marking them verified, and we check certain
          details where possible. However, users are solely responsible for conducting their own due diligence before
          engaging any Studio. Before you hire, we encourage you to:
        </p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>confirm any state or local licence or registration your project requires (requirements for interior designers and contractors vary widely by state);</li>
          <li>request proof of general liability insurance and, where applicable, workers' compensation coverage;</li>
          <li>ask for references and examples of completed projects comparable to yours;</li>
          <li>get a written scope of work, fee structure, and timeline before any money changes hands.</li>
        </ul>
      </Section>

      <Section title="3. Studio responsibilities">
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Studios listed on Intearior must hold any licences or registrations required for their practice and comply with all applicable regulatory and ethical guidelines.</li>
          <li>Studios are responsible for ensuring that all information on their profile — services, service areas, pricing indications, credentials, photos, and business hours — is accurate, and must update any changes within 7 days.</li>
          <li>Studios must own or have permission to use every photograph, project image, and logo they upload.</li>
          <li>Studios may only claim a business they are authorized to represent, and each account may manage one Studio.</li>
          <li>Intearior does not verify ongoing licensing or regulatory compliance after initial acceptance.</li>
        </ul>
      </Section>

      <Section title="4. Licensing and advertising compliance">
        Design and construction-related advertising rules differ by state and municipality. Studios using the Platform
        are solely responsible for:
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>determining which titles they may lawfully use in their jurisdiction (for example, restrictions on "interior architect" or on "registered" or "certified" designations);</li>
          <li>ensuring any required licence numbers or disclosures appear clearly on their profile and in their marketing;</li>
          <li>compliance with FTC endorsement and testimonial guidance in relation to reviews displayed on their profile;</li>
          <li>accurately describing their relationship with Intearior in client and prospect communications;</li>
          <li>maintaining current registrations, licences, and insurance.</li>
        </ul>
        <p className="mt-3">
          Intearior does not verify these matters and makes no representations regarding any Studio's regulatory status,
          qualifications, or compliance.
        </p>
      </Section>

      <Section title="5. Compensation disclosure and conflicts of interest">
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Intearior operates a tiered visibility system. Every accepted Studio receives a free profile page where it can collect and display client reviews. Studios on a premium plan receive enhanced placement and visibility, including priority placement in Get Matched results and in directory listings. Current pricing is disclosed at the time of enrollment.</li>
          <li>Premium Studios are indicated on cards and profiles throughout the browsing experience, and paid prioritization is disclosed within the Get Matched flow.</li>
          <li>Paid placement affects visibility and ordering only. No Studio can pay to modify, suppress, or remove client reviews, and review content and ordering are never influenced by payment tier.</li>
          <li>Users should independently assess all Studios regardless of placement tier or visibility.</li>
        </ul>
      </Section>

      <Section title="6. User content and license grant">
        Intearior may allow users to submit reviews, comments, profile information, photographs, and other content
        ("User Content"). By submitting User Content, you:
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>grant Intearior LLC a worldwide, perpetual, irrevocable, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, display, distribute, adapt, and otherwise exploit such content in any media in connection with operating the Platform;</li>
          <li>represent and warrant that you own or have all necessary rights to the content, that it is accurate, and that its submission does not violate any third-party rights;</li>
          <li>acknowledge that User Content is non-confidential and non-proprietary;</li>
          <li>acknowledge that Intearior may remove or decline to publish any User Content in its sole discretion, including content that is false, misleading, defamatory, incentivized, submitted by a competitor, or otherwise in violation of these Terms.</li>
        </ul>
        <p className="mt-3">
          Reviews must reflect genuine first-hand experience with the Studio. Intearior is not responsible or liable for
          the content or accuracy of any User Content, including reviews imported from Google or from a Studio's own
          website at that Studio's request.
        </p>
      </Section>

      <Section title="7. Intellectual property">
        <p>
          All content on the Platform — including text, software, design, images, data, and the overall look and feel —
          is owned by Intearior LLC or its licensors and is protected by U.S. and international intellectual property
          laws. All rights not expressly granted are reserved.
        </p>
        <p className="mt-3">
          The Intearior name, logo, and all related names, logos, product and service names, designs, and slogans are
          trademarks of Intearior LLC. You may not use them without prior written permission.
        </p>
        <p className="mt-3">
          Subject to these Terms, you are granted a limited, revocable, non-exclusive, non-transferable license to
          access and use the Platform solely for its intended purpose. You may not reproduce, distribute, modify, create
          derivative works of, or commercially exploit any portion of the Platform without express written permission.
        </p>
      </Section>

      <Section title="8. Prohibited uses">
        You may use the Platform only for lawful purposes and in accordance with these Terms. You agree not to:
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>scrape, harvest, or systematically collect data from the Platform by automated or manual means without express written consent;</li>
          <li>misrepresent your identity, credentials, or affiliation with any person or business;</li>
          <li>post false, misleading, defamatory, incentivized, or fraudulent reviews or content;</li>
          <li>use the Platform to solicit users for competing services or for any unauthorized commercial purpose;</li>
          <li>circumvent any security measure, access control, or authentication system;</li>
          <li>transmit malware, viruses, or harmful code;</li>
          <li>interfere with or disrupt the Platform or its servers;</li>
          <li>violate any applicable federal, state, local, or international law or regulation;</li>
          <li>use the Platform in any manner that could damage the reputation of Intearior or its users.</li>
        </ul>
      </Section>

      <Section title="9. Account security">
        Registered accounts, including Studio accounts, are personal to the account holder. You are responsible for:
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>maintaining the confidentiality of your login credentials and sign-in links;</li>
          <li>all activity that occurs under your account;</li>
          <li>notifying us immediately at contact@intearior.com of any unauthorized access or security breach.</li>
        </ul>
        <p className="mt-3">
          Intearior reserves the right to terminate or suspend any account at any time for violation of these Terms.
        </p>
      </Section>

      <Section title="10. Digital Millennium Copyright Act (DMCA)">
        <p>
          Intearior respects intellectual property rights and complies with the Digital Millennium Copyright Act (17
          U.S.C. § 512). If you believe content on the Platform infringes your copyright, send a written notice to our
          designated DMCA agent at: Intearior LLC, contact@intearior.com.
        </p>
        <p className="mt-3">
          Your notice must include: (1) an electronic or physical signature of the copyright owner or authorized agent;
          (2) a description of the copyrighted work claimed to have been infringed; (3) the URL or location of the
          allegedly infringing material; (4) your contact information; (5) a statement that you have a good faith belief
          the use is not authorized; and (6) a statement under penalty of perjury that the information in your notice is
          accurate.
        </p>
        <p className="mt-3">
          We will respond to valid DMCA notices by removing or disabling access to the allegedly infringing content. It
          is our policy to terminate, in appropriate circumstances, the accounts of repeat infringers.
        </p>
      </Section>

      <Section title="11. Disclaimers and warranties">
        <p className="uppercase">
          The Platform and all content and services provided through it are provided on an "as is," "as available," and
          "with all faults" basis, without warranties of any kind, either express or implied, including but not limited
          to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
        </p>
        <p className="mt-3">
          Intearior does not warrant that: (a) the Platform will be uninterrupted, error-free, or secure; (b) any
          information provided is accurate, complete, or current; or (c) the Platform is free of viruses or other
          harmful components. You assume all risk for your use of the Platform.
        </p>
        <p className="mt-3">
          Intearior does not verify ongoing licensing or regulatory compliance of Studios after initial acceptance and
          makes no representations or warranties regarding the quality, accuracy, reliability, pricing, or suitability
          of any Studio's services.
        </p>
      </Section>

      <Section title="12. Limitation of liability">
        <p className="uppercase">
          To the maximum extent permitted by applicable law, in no event shall Intearior LLC or its affiliates,
          officers, directors, employees, or agents be liable for any indirect, incidental, special, consequential,
          exemplary, or punitive damages, including but not limited to loss of profits, data, goodwill, or business
          interruption, even if advised of the possibility of such damages.
        </p>
        <p className="mt-3 uppercase">
          To the maximum extent permitted by applicable law, the total aggregate liability of Intearior LLC for all
          claims arising out of or relating to these Terms or the Platform shall not exceed the greater of: (a) $25; or
          (b) the total fees paid by you to Intearior in the three (3) months immediately preceding the event giving
          rise to the claim.
        </p>
        <p className="mt-3">
          This limitation applies to all theories of liability (contract, tort, negligence, strict liability, or
          otherwise) and survives the termination of these Terms.
        </p>
      </Section>

      <Section title="13. Indemnification">
        You agree to defend, indemnify, and hold harmless Intearior LLC and its affiliates, officers, directors,
        employees, agents, and licensors from and against any third-party claims, losses, liabilities, damages, costs,
        and expenses (including reasonable attorneys' fees) arising out of or related to:
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>your breach of these Terms;</li>
          <li>any User Content you submit to the Platform, including photographs you do not own;</li>
          <li>your violation of any applicable law or regulation, including licensing and advertising rules;</li>
          <li>your interactions, agreements, or projects with other users or Studios;</li>
          <li>any misrepresentation of your identity, qualifications, or services.</li>
        </ul>
        <p className="mt-3">
          Intearior reserves the right to assume the exclusive defense and control of any matter subject to
          indemnification, in which case you agree to cooperate with our defense.
        </p>
      </Section>

      <Section title="14. No endorsements or guarantees">
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Intearior does not endorse, recommend, or guarantee the services of any Studio listed on the Platform.</li>
          <li>Being listed on Intearior does not constitute an endorsement, approval, or verification of any Studio's qualifications, experience, or services.</li>
          <li>Users engage Studios at their own discretion and risk.</li>
          <li>Intearior does not guarantee any project outcome, budget, or timeline resulting from engaging a listed Studio.</li>
        </ul>
      </Section>

      <Section title="15. Third-party services and links">
        <p>
          Intearior uses third-party services to operate the Platform, including cloud hosting and database
          infrastructure, Stripe for payments, Google Maps Platform and Google Places for location data and public
          reviews, a transactional email provider, OpenAI for the Get Matched question flow, and first-party analytics.
          These services handle data according to their own privacy policies, which we do not control.
        </p>
        <p className="mt-3">
          The Platform may contain links to external websites, including Studio websites. Intearior is not responsible
          for the content, privacy policies, or data practices of any third-party website.
        </p>
      </Section>

      <Section title="16. Termination and modifications">
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Intearior may terminate access to the Platform for users or Studios who violate these Terms, without notice and without liability.</li>
          <li>We reserve the right to update these Terms at any time. Notice of material changes will be provided via email or on the Platform. Continued use after updates constitutes acceptance of the revised Terms.</li>
        </ul>
      </Section>

      <Section title="17. Dispute resolution and arbitration">
        <p className="font-medium">Governing law</p>
        <p>These Terms are governed by the laws of the State of Delaware, without regard to conflict-of-law principles.</p>
        <p className="mt-3 font-medium">Arbitration</p>
        <p>
          Any dispute arising from these Terms shall be resolved through binding arbitration in New York, NY, under the
          rules of the American Arbitration Association (AAA). The arbitrator's decision shall be final and binding and
          may be entered as a judgment in any court of competent jurisdiction.
        </p>
        <p className="mt-3 font-medium">Class action waiver</p>
        <p>
          Users agree to resolve disputes individually and waive the right to participate in any class action or
          collective proceeding against Intearior.
        </p>
        <p className="mt-3 font-medium">Limitation on time to file claims</p>
        <p className="uppercase">
          Any cause of action or claim arising out of or relating to these Terms or the Platform must be commenced
          within one (1) year after the cause of action accrues, whether in arbitration or court. Any claim not brought
          within this period is permanently and irrevocably barred.
        </p>
        <p className="mt-3 font-medium">Small claims exception</p>
        <p>
          Either party may bring an individual claim in small claims court in lieu of arbitration for disputes within
          that court's jurisdiction.
        </p>
      </Section>

      <Section title="18. General provisions">
        <p className="font-medium">Force majeure</p>
        <p>
          Intearior shall not be liable for any failure or delay in performance resulting from causes beyond its
          reasonable control, including acts of God, natural disasters, pandemics, government actions, internet or
          infrastructure outages, cyberattacks, or other events outside its reasonable control.
        </p>
        <p className="mt-3 font-medium">No agency or joint venture</p>
        <p>
          Nothing in these Terms creates a joint venture, partnership, franchise, agency, employer/employee, or similar
          relationship between Intearior and any user or Studio. Users and Studios are independent parties and are not
          authorized to act as agents of Intearior in any capacity.
        </p>
        <p className="mt-3 font-medium">Electronic communications</p>
        <p>
          By using the Platform or creating an account, you consent to receive disclosures, notices, agreements, and
          other communications electronically, including via email and notices posted on the Platform. You agree that
          electronic communications satisfy any legal requirement that such communications be in writing, and you are
          responsible for maintaining a valid email address.
        </p>
        <p className="mt-3 font-medium">Geographic restrictions</p>
        <p>
          Intearior is intended for use by residents of the United States only. We make no representation that the
          Platform or its content is appropriate, available, or legally permitted outside the United States. If you
          access the Platform from elsewhere, you do so at your own risk and are solely responsible for compliance with
          local laws.
        </p>
        <p className="mt-3 font-medium">Entire agreement</p>
        <p>
          These Terms, together with the <Link to="/privacy" className="text-brand underline">Privacy Policy</Link> and
          any applicable Studio agreement, constitute the entire agreement between you and Intearior LLC relating to
          your use of the Platform and supersede all prior agreements and understandings.
        </p>
        <p className="mt-3 font-medium">Severability</p>
        <p>
          If any provision is held invalid, illegal, or unenforceable, it shall be modified to the minimum extent
          necessary to make it enforceable, and the remaining provisions shall continue in full force and effect.
        </p>
        <p className="mt-3 font-medium">Waiver</p>
        <p>
          No waiver of any term shall be deemed a continuing waiver, and any failure to assert a right or provision
          shall not constitute a waiver of it.
        </p>
        <p className="mt-3 font-medium">Survival</p>
        <p>
          The following survive termination: Section 6 (User Content), Section 7 (Intellectual Property), Section 10
          (DMCA), Section 11 (Disclaimers), Section 12 (Limitation of Liability), Section 13 (Indemnification), and
          Section 17 (Dispute Resolution).
        </p>
        <p className="mt-3 font-medium">Assignment</p>
        <p>
          You may not assign or transfer these Terms without our prior written consent. Intearior may freely assign
          these Terms, including in connection with a merger, acquisition, or sale of assets.
        </p>
      </Section>

      <Section title="19. Contact information">
        For any questions about these Terms, contact:
        <p className="mt-2">
          Intearior — Intearior LLC
          <br />
          Email: contact@intearior.com
          <br />
          Website: www.intearior.com
        </p>
        <p className="mt-2">
          Or use our <Link to="/contact" className="text-brand underline">contact form</Link>.
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
