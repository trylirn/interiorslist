import { createFileRoute, redirect } from "@tanstack/react-router";

// Studios now sign up for an account to list their business — the old
// standalone submission form is retired and this page redirects to sign up.
export const Route = createFileRoute("/_site/submit")({
  beforeLoad: () => {
    throw redirect({ to: "/login", search: { tab: "business" } });
  },
});
