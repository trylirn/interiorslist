import { createFileRoute, redirect } from "@tanstack/react-router";

// The Hiring Guide page has been retired. Keep the URL working for old links
// and search results by permanently redirecting to How it works.
export const Route = createFileRoute("/_site/guide")({
  beforeLoad: () => {
    throw redirect({ to: "/how-it-works", statusCode: 301 });
  },
});
