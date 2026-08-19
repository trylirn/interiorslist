import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listBlogPosts } from "@/lib/blog.functions";

const postsQuery = queryOptions({
  queryKey: ["blog-posts"],
  queryFn: () => listBlogPosts({ data: {} }),
});

export const Route = createFileRoute("/_site/blog/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  head: () => {
    const title = "Interior Design Blog | Intearior";
    const description =
      "Guides on hiring an interior designer, budgets, timelines and working with a studio — from the Intearior team.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://interiorslist.lovable.app/blog" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: "https://interiorslist.lovable.app/blog" }],
    };
  },
  errorComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl">Couldn't load the blog</h1>
      <p className="mt-3 text-muted-foreground">Please refresh and try again.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl">Not found</h1>
    </div>
  ),
  component: BlogIndex,
});

function fmt(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function BlogIndex() {
  const { data } = useSuspenseQuery(postsQuery);
  const [cat, setCat] = useState<string | null>(null);
  const posts = (data.posts ?? []).filter((p: any) => !cat || p.category === cat);
  const [lead, ...rest] = posts;

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">The Intearior Blog</p>
        <h1 className="mt-3 font-display text-5xl leading-tight md:text-6xl">Advice for your next design project</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Practical guides on hiring a designer, setting budgets, and getting the most out of your studio.
        </p>
      </header>

      {data.categories?.length > 0 && (
        <nav aria-label="Blog categories" className="mt-8 flex flex-wrap gap-2">
          <button
            onClick={() => setCat(null)}
            className={`rounded-full border px-4 py-1.5 text-sm ${!cat ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground hover:border-brand"}`}
          >
            All
          </button>
          {data.categories.map((c: string) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-4 py-1.5 text-sm ${cat === c ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground hover:border-brand"}`}
            >
              {c}
            </button>
          ))}
        </nav>
      )}

      {posts.length === 0 ? (
        <p className="mt-16 rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No articles published yet — check back soon.
        </p>
      ) : (
        <>
          <Link
            to="/blog/$slug"
            params={{ slug: lead.slug }}
            className="mt-10 grid gap-6 overflow-hidden rounded-3xl border border-border bg-card transition hover:border-brand md:grid-cols-2"
          >
            {lead.cover_url ? (
              <img src={lead.cover_url} alt={`Cover image for ${lead.title}`} className="h-64 w-full object-cover md:h-full" loading="lazy" />
            ) : (
              <div className="h-64 w-full bg-secondary md:h-full" />
            )}
            <div className="p-7 md:py-10 md:pr-10">
              {lead.category && <span className="text-xs font-semibold uppercase tracking-widest text-brand">{lead.category}</span>}
              <h2 className="mt-3 font-display text-3xl leading-snug md:text-4xl">{lead.title}</h2>
              {lead.excerpt && <p className="mt-3 text-muted-foreground">{lead.excerpt}</p>}
              <p className="mt-5 text-sm text-muted-foreground">
                {lead.author_name ? `${lead.author_name} · ` : ""}{fmt(lead.published_at)}
              </p>
            </div>
          </Link>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p: any) => (
              <Link key={p.slug} to="/blog/$slug" params={{ slug: p.slug }} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-brand">
                {p.cover_url ? (
                  <img src={p.cover_url} alt={`Cover image for ${p.title}`} className="h-44 w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-44 w-full bg-secondary" />
                )}
                <div className="flex flex-1 flex-col p-5">
                  {p.category && <span className="text-[11px] font-semibold uppercase tracking-widest text-brand">{p.category}</span>}
                  <h3 className="mt-2 font-display text-xl leading-snug group-hover:text-brand">{p.title}</h3>
                  {p.excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.excerpt}</p>}
                  <p className="mt-4 text-xs text-muted-foreground">{p.author_name ? `${p.author_name} · ` : ""}{fmt(p.published_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
