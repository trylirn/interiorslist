/**
 * Google Maps Platform gateway helpers (server-only).
 * Used by the seed route and detail-page refresh.
 */
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

function gatewayHeaders(): HeadersInit {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!mapsKey) throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": mapsKey,
    "Content-Type": "application/json",
  };
}

const PLACE_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.businessStatus",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.regularOpeningHours",
  "places.photos",
  "places.addressComponents",
  "places.types",
  "places.editorialSummary",
].join(",");

const DETAIL_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "shortFormattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "priceLevel",
  "businessStatus",
  "nationalPhoneNumber",
  "websiteUri",
  "googleMapsUri",
  "regularOpeningHours",
  "photos",
  "addressComponents",
  "reviews",
  "editorialSummary",
].join(",");

export type PlaceSearchResult = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  businessStatus?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
    openNow?: boolean;
  };
  photos?: Array<{ name: string; widthPx: number; heightPx: number }>;
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
  types?: string[];
  editorialSummary?: { text: string };
};

export async function searchPlacesText(
  textQuery: string,
  opts?: { locationBias?: { lat: number; lng: number; radiusM?: number }; pageSize?: number }
): Promise<PlaceSearchResult[]> {
  const body: Record<string, unknown> = {
    textQuery,
    pageSize: opts?.pageSize ?? 20,
    regionCode: "US",
  };
  if (opts?.locationBias) {
    body.locationBias = {
      circle: {
        center: { latitude: opts.locationBias.lat, longitude: opts.locationBias.lng },
        radius: opts.locationBias.radiusM ?? 25000,
      },
    };
  }
  const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
    method: "POST",
    headers: { ...gatewayHeaders(), "X-Goog-FieldMask": PLACE_FIELDS },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places searchText failed [${res.status}]: ${text}`);
  }
  const data = (await res.json()) as { places?: PlaceSearchResult[] };
  return data.places ?? [];
}

export async function fetchPlaceDetails(placeId: string): Promise<
  PlaceSearchResult & {
    reviews?: Array<{
      name: string;
      relativePublishTimeDescription?: string;
      rating?: number;
      text?: { text: string };
      authorAttribution?: { displayName?: string; photoUri?: string };
      publishTime?: string;
    }>;
  }
> {
  const res = await fetch(`${GATEWAY_URL}/places/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { ...gatewayHeaders(), "X-Goog-FieldMask": DETAIL_FIELDS },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Place details failed [${res.status}]: ${text}`);
  }
  return res.json();
}

/** Build a CDN-served photo URL via the gateway. */
export function placePhotoUrl(photoName: string, maxWidthPx = 1200): string {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
  // Server-side helper returning a URL the client cannot reach. We resolve
  // and cache photos at seed time into a redirect URL stored in DB.
  return `${GATEWAY_URL}/places/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&skipHttpRedirect=true`;
}

export async function resolvePhotoUri(photoName: string, maxWidthPx = 1600): Promise<string | null> {
  try {
    const res = await fetch(placePhotoUrl(photoName, maxWidthPx), {
      headers: gatewayHeaders(),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { photoUri?: string };
    return data.photoUri ?? null;
  } catch {
    return null;
  }
}
