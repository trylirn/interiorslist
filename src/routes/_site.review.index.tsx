import { createFileRoute } from "@tanstack/react-router";
import { ReviewWizard } from "@/components/review-wizard";

export const Route = createFileRoute("/_site/review/")({
  head: () => ({
    meta: [
      { title: "Write a Studio Review | Interiors List" },
      { name: "description", content: "Share your experience with a design studio — project results, communication and value — in a quick guided review." },
      { property: "og:title", content: "Write a Studio Review | Interiors List" },
      { property: "og:description", content: "Help others choose with confidence. Rate communication, design results, project management and value." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ReviewWizard />,
});
