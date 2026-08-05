import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/credentials")({
  head: () => ({
    meta: [
      { title: "Provider Credentials Guide | Discover Medspa" },
      { name: "description", content: "Understand MD, DO, NP, PA, RN, and Esthetician credentials — what each can do legally in Texas medspas." },
      { property: "og:title", content: "Credentials Guide | Discover Medspa" },
      { property: "og:description", content: "Understand who can legally treat you in a Texas medspa." },
    ],
    links: [{ rel: "canonical", href: "/credentials" }],
  }),
  component: Credentials,
});

function Credentials() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">Credentials</p>
      <h1 className="mt-3 font-display text-5xl md:text-6xl">Who can treat you?</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        In Texas, the practice of medical aesthetics is regulated by the Texas Medical Board and the Texas Board of Nursing. Here's a quick guide to the credentials you'll see on Discover Medspa profiles.
      </p>

      <div className="mt-12 space-y-8">
        {CREDS.map((c) => (
          <div key={c.abbr} className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">{c.abbr}</p>
            <h2 className="mt-1 font-display text-2xl">{c.full}</h2>
            <p className="mt-2 text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-border bg-secondary/40 p-6">
        <p className="text-sm">
          <strong>Important:</strong> Always verify a provider's license before treatment.{" "}
          <a className="text-brand underline" href="https://www.tmb.state.tx.us/page/look-up-a-license" target="_blank" rel="noreferrer">Texas Medical Board lookup</a>{" "}
          or{" "}
          <a className="text-brand underline" href="https://www.bon.texas.gov/licensure_verification.asp" target="_blank" rel="noreferrer">Texas Board of Nursing verification</a>.
        </p>
      </div>

      <p className="mt-12 text-sm text-muted-foreground">
        See also: <Link to="/safety" className="text-brand underline">Patient safety guide</Link>.
      </p>
    </div>
  );
}

const CREDS = [
  { abbr: "MD", full: "Medical Doctor", desc: "Licensed physician. Can perform and supervise all medical aesthetic procedures including neuromodulators, fillers, lasers, and prescription protocols." },
  { abbr: "DO", full: "Doctor of Osteopathic Medicine", desc: "Fully licensed physician with the same prescriptive and supervisory authority as an MD in Texas." },
  { abbr: "NP / APRN", full: "Nurse Practitioner / Advanced Practice Registered Nurse", desc: "Advanced practice nurses who can inject neuromodulators and fillers under a delegating physician's protocol in Texas." },
  { abbr: "PA", full: "Physician Assistant", desc: "Licensed to perform aesthetic procedures under physician supervision per Texas Medical Board rules." },
  { abbr: "RN", full: "Registered Nurse", desc: "Can administer injectables under direct physician delegation and protocol. Must work within their scope of practice." },
  { abbr: "Esthetician", full: "Licensed Esthetician", desc: "Performs non-injection skincare treatments — facials, peels, dermaplaning, microneedling (depending on device classification). Cannot inject neuromodulators or fillers." },
];
