import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listRelatedPostsForProvider } from "@/lib/blog.functions";

export function RelatedPosts({ tags }: { tags: string[] }) {
  const key = tags.slice(0, 12).join(",");
  const { data } = useQuery({
    queryKey: ["related-posts", key],
    queryFn: () => listRelatedPostsForProvider({ data: { tags: tags.slice(0, 12), limit: 6 } }),
  });
  const posts = data?.posts ?? [];
  if (!posts.length) return null;

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl">Related reading</h2>
      <p className="mt-1 text-sm text-muted-foreground">Guides to help you brief, budget and hire with confidence.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {posts.map((p: any) => (
          <Link
            key={p.slug}
            to="/blog/$slug"
            params={{ slug: p.slug }}
            className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-brand"
          >
            {p.cover_url ? (
              <img src={p.cover_url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
            ) : (
              <div className="aspect-square w-full bg-secondary" />
            )}
            <div className="p-3">
              {p.category && <span className="text-[11px] font-semibold uppercase tracking-widest text-brand">{p.category}</span>}
              <h3 className="mt-1.5 font-display text-base leading-snug group-hover:text-brand">{p.title}</h3>
              {p.excerpt && <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{p.excerpt}</p>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
