import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BudgetEstimator } from "@/components/tools/budget-estimator";
import { Button } from "@/components/ui/button";
import { COST_TOPICS, topicBySlug } from "@/lib/cost-content";

export const Route = createFileRoute("/_site/cost-estimator/$slug")({
  loader: ({ params }) => {
    const topic = topicBySlug(params.slug);
    if (!topic) throw notFound();
    return { topic };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Cost guide not found | Intearior" }, { name: "robots", content: "noindex" }] };
    }
    const t = loaderData.topic;
    return {
      meta: [
        { title: t.title },
        { name: "description", content: t.description },
        { property: "og:title", content: t.title },
        { property: "og:description", content: t.description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: `/cost-estimator/${t.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: t.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        },
      ],
    };
  },
  notFoundComponent: TopicNotFound,
  component: TopicPage,
});

function TopicNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24">
      <h1 className="font-display text-3xl">We don't have that cost guide.</h1>
      <p className="mt-3 text-muted-foreground">Try the cost hub for every guide we publish.</p>
      <Button asChild className="mt-6 rounded-none"><Link to="/cost-estimator">All cost guides</Link></Button>
    </div>
  );
}

function TopicPage() {
  const { topic } = Route.useLoaderData();
  const others = COST_TOPICS.filter((t) => t.slug !== topic.slug).slice(0, 4);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">
        <Link to="/cost-estimator" className="hover:underline">Cost guides</Link>
      </p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">{topic.h1}</h1>
      <p className="mt-5 text-lg text-muted-foreground">{topic.intro}</p>

      <div className="mt-10">
        <BudgetEstimator defaultRoom={topic.room} defaultScope={topic.scope} />
      </div>

      {topic.sections.map((s) => (
        <section key={s.heading} className="mt-14">
          <h2 className="font-display text-2xl">{s.heading}</h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            {s.body.map((p) => <p key={p}>{p}</p>)}
          </div>
        </section>
      ))}

      <section className="mt-14">
        <h2 className="font-display text-2xl">Common questions</h2>
        <dl className="mt-4 space-y-5">
          {topic.faqs.map((f) => (
            <div key={f.q}>
              <dt className="font-medium">{f.q}</dt>
              <dd className="mt-1 text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-14 border border-border bg-secondary/30 p-6">
        <h2 className="font-display text-2xl">Get real numbers from real studios</h2>
        <p className="mt-2 text-muted-foreground">
          An estimate narrows the field. A studio that has done this exact job in your area gives you a price.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild className="rounded-none"><Link to="/match">Get matched with 3 studios</Link></Button>
          <Button asChild variant="outline" className="rounded-none"><Link to="/search">Browse the directory</Link></Button>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="font-display text-2xl">More cost guides</h2>
        <ul className="mt-4 space-y-2">
          {others.map((t) => (
            <li key={t.slug}>
              <Link to="/cost-estimator/$slug" params={{ slug: t.slug }} className="hover:text-brand">
                {t.h1}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
