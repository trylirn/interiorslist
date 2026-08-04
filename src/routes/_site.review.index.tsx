import { createFileRoute } from "@tanstack/react-router";
import { ReviewWizard } from "@/components/review-wizard";

export const Route = createFileRoute("/_site/review/")({
  head: () => ({
    meta: [
      { title: "Write a Med Spa Review | Texas Aesthetics" },
      { name: "description", content: "Share your experience with a Texas med spa — treatments, results, communication and value — in a quick guided review." },
      { property: "og:title", content: "Write a Med Spa Review | Texas Aesthetics" },
      { property: "og:description", content: "Help others choose with confidence. Rate communication, results, cleanliness and value." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ReviewWizard />,
});
