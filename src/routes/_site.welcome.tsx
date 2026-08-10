import { createFileRoute, redirect } from "@tanstack/react-router";

// The standalone welcome splash duplicated /match and /for-business and was not
// linked from anywhere. Keep the URL working by redirecting to the homepage.
export const Route = createFileRoute("/_site/welcome")({
  beforeLoad: () => {
    throw redirect({ to: "/", statusCode: 301 });
  },
});
