import { createFileRoute, Link } from "@tanstack/react-router";
import { RoomPlanner } from "@/components/tools/room-planner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_site/tools/room-planner")({
  head: () => ({
    meta: [
      { title: "Free 2D Room Planner | Intearior" },
      {
        name: "description",
        content:
          "Sketch a room to scale, add doors and windows, and drag furniture to test layouts. Free, no sign-up, saved in your browser.",
      },
      { property: "og:title", content: "Free 2D Room Planner | Intearior" },
      { property: "og:description", content: "Sketch a room to scale and test furniture layouts — free and no sign-up." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/tools/room-planner" }],
  }),
  component: RoomPlannerPage,
});

function RoomPlannerPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">
        <Link to="/tools" className="hover:underline">Free tools</Link>
      </p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">2D Room Planner</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Set your room dimensions, add doors and windows, then drag furniture around until the layout works.
        Everything stays in your browser — nothing is uploaded and no account is needed.
      </p>

      <div className="mt-10">
        <RoomPlanner />
      </div>

      <section className="mt-16 max-w-3xl space-y-4">
        <h2 className="font-display text-2xl">Getting a layout right</h2>
        <p className="text-muted-foreground">
          Leave about 30–36 inches for main walkways and 14–18 inches between a sofa and a coffee table. A
          dining chair needs roughly 36 inches behind it to pull out comfortably, and a door swing needs its
          full arc kept clear.
        </p>
        <p className="text-muted-foreground">
          Plan the seating and circulation first, then place the pieces that anchor the room — rug, sofa, bed
          — and finally the smaller items. If the walkways stop working, the room is over-furnished.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild className="rounded-none"><Link to="/match">Get matched with a studio</Link></Button>
          <Button asChild variant="outline" className="rounded-none">
            <Link to="/tools/budget-estimator">Estimate the budget</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
