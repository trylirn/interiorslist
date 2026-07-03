// Idempotent Google Maps JS API loader (browser-only).
/// <reference types="google.maps" />

let mapsPromise: Promise<typeof google.maps> | undefined;

declare global {
  interface Window {
    __lovableInitGoogleMaps?: () => void;
  }
}

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only be loaded in the browser"));
  }
  if (typeof google !== "undefined" && google.maps) return Promise.resolve(google.maps);
  if (mapsPromise) return mapsPromise;

  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;
  if (!key) return Promise.reject(new Error("Missing Google Maps browser key"));

  mapsPromise = new Promise((resolve, reject) => {
    window.__lovableInitGoogleMaps = () => {
      if (typeof google !== "undefined" && google.maps) resolve(google.maps);
      else reject(new Error("Google Maps failed to initialize"));
    };
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key,
      loading: "async",
      callback: "__lovableInitGoogleMaps",
    });
    if (channel) params.set("channel", channel);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(s);
  });

  return mapsPromise;
}
