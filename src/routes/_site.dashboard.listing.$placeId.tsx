import { createFileRoute } from "@tanstack/react-router";
import { ListingManager } from "@/components/listing-manager";

export const Route = createFileRoute("/_site/dashboard/listing/$placeId")({
  head: () => ({ meta: [{ title: "Manage listing | Discover Medspa" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ManageListingRoute,
});

function ManageListingRoute() {
  const { placeId } = Route.useParams();
  return <ListingManager placeId={placeId} />;
}
