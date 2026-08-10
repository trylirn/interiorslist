import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getBlogPost } from "@/lib/blog.functions";
import { Markdown, readingTime } from "@/components/markdown";

const postQuery = (slug: string) =>
  queryOptions({
    queryKey: ["blog-post", slug],
    queryFn: () => getBlogPost({ data: { slug } }),
  });

export const Route = createFileRoute("/_site/blog/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(postQuery(params.slug)),
  head: ({ params, loaderData }) => {
    const post = (loaderData as { post?: any } | undefined)?.post;
    const canonical = `https://interiorslist.lovable.app/blog/${params.slug}`;
    const clamp = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`);
    const title = clamp(post?.title ? `${post.title} | Intearior` : "Article | Intearior", 60);
    const description = clamp(
      post?.excerpt || "An article from the Intearior interior design directory.",
      160,
    );
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: canonical },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (post?.cover_url && String(post.cover_url).startsWith("https://")) {
      meta.push({ property: "og:image", content: post.cover_url });
      meta.push({ name: "twitter:image", content: post.cover_url });
    }
    const scripts = post
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.title,
              description,
              datePublished: post.published_at,
              dateModified: post.updated_at ?? post.published_at,
              author: { "@type": "Person", name: post.author_name ?? "Intearior" },
              publisher: { "@type": "Organization", name: "Intearior" },
              mainEntityOfPage: canonical,
              ...(post.cover_url ? { image: post.cover_url } : {}),
            }),
          },
        ]
      : [];
    return { meta, links: [{ rel: "canonical", href: canonical }], scripts };
  },
  errorComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl">Couldn't load this article</h1>
      <Link to="/blog" className="mt-4 inline-block text-brand hover:underline">Back to the blog</Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl">Article not found</h1>
      <Link to="/blog" className="mt-4 inline-block text-brand hover:underline">Back to the blog</Link>
    </div>
  ),
  component: BlogPost,
});

function fmt(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function BlogPost() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(postQuery(slug));
  const post = data.post as any;

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Article not found</h1>
        <Link to="/blog" className="mt-4 inline-block text-brand hover:underline">Back to the blog</Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <Link to="/blog" className="text-sm text-muted-foreground hover:text-brand">← All articles</Link>

      {post.category && (
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-brand">{post.category}</p>
      )}
      <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{post.title}</h1>
      {post.excerpt && <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>}
      <p className="mt-6 border-b border-border pb-6 text-sm text-muted-foreground">
        {post.author_name ? `By ${post.author_name} · ` : ""}
        {fmt(post.published_at)} · {readingTime(post.body_md ?? "")} min read
      </p>

      {post.cover_url && (
        <img src={post.cover_url} alt="" className="mt-8 w-full rounded-3xl border border-border object-cover" />
      )}

      <div className="mt-4">
        <Markdown source={post.body_md ?? ""} />
      </div>

      {Array.isArray(post.tags) && post.tags.length > 0 && (
        <ul className="mt-12 flex flex-wrap gap-2">
          {post.tags.map((t: string) => (
            <li key={t} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">{t}</li>
          ))}
        </ul>
      )}

      {data.related?.length > 0 && (
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="font-display text-2xl">Related posts</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {data.related.map((r: any) => (
              <Link key={r.slug} to="/blog/$slug" params={{ slug: r.slug }} className="group rounded-2xl border border-border bg-card p-4 transition hover:border-brand">
                {r.cover_url && <img src={r.cover_url} alt="" loading="lazy" className="mb-3 h-28 w-full rounded-xl object-cover" />}
                <h3 className="font-display text-lg leading-snug group-hover:text-brand">{r.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{fmt(r.published_at)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-14 rounded-3xl border border-border bg-secondary/40 p-8 text-center">
        <h2 className="font-display text-2xl">Ready to find your designer?</h2>
        <p className="mt-2 text-sm text-muted-foreground">Answer a few questions and we'll match you with studios that fit your project.</p>
        <Link to="/match" className="mt-5 inline-block rounded-full bg-brand px-6 py-3 text-sm font-medium text-brand-foreground hover:opacity-90">
          Get matched
        </Link>
      </div>
    </article>
  );
}
