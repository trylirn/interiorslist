import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { CompareDrawer } from "@/components/compare-drawer";
import { QuizPrompt } from "@/components/quiz-prompt";

export const Route = createFileRoute("/_site")({
  component: SiteLayout,
});

function SiteLayout() {
  const pathname = useLocation({ select: (s) => s.pathname });
  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isDashboard && <SiteFooter />}
      {!isDashboard && <CompareDrawer />}
      {!isDashboard && <QuizPrompt />}
    </div>
  );
}
