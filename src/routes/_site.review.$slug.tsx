import { createFileRoute, Link } from "@tanstack/react-router";
import { getProviderBySlug } from "@/lib/providers.functions";
import { ReviewWizard } from "@/components/review-wizard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_site/review/$slug")({
  head: ({ loaderData }) => {
    const name = loaderData?.provider?.name;
    const title = name ? `Review ${name} | Texas Aesthetics` : "Write a review | Texas Aesthetics";
    return {
      meta: [
        { title },
        { name: "description", content: name ? `Share your experience with ${name} — treatments, results, communication and value.` : "Share your med spa experience." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Help others choose with confidence." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  loader: ({ params }) => getProviderBySlug({ data: { slug: params.slug } }),
  component: ReviewForProvider,
});

function ReviewForProvider() {
  const { provider } = Route.useLoaderData();
  if (!provider) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Listing not found</h1>
        <Button asChild className="mt-6"><Link to="/review">Search for a med spa</Link></Button>
      </div>
    );
  }
  return (
    <ReviewWizard
      initialProvider={{
        place_id: provider.place_id,
        slug: provider.slug,
        name: provider.name,
        city: provider.city,
      }}
    />
  );
}
