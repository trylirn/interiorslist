// Client-side analytics tracker. Anonymous visitor_id + session_id.
// Fire-and-forget batched POSTs to /api/public/track.

const VISITOR_KEY = "tx_v";
const SESSION_KEY = "tx_s";
const SESSION_LAST_KEY = "tx_sl";
const SESSION_TTL_MS = 30 * 60 * 1000;
const IMPRESSION_KEY = "tx_imp";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function getVisitorId(): string {
  if (!isBrowser()) return "";
  let v = localStorage.getItem(VISITOR_KEY);
  if (!v) {
    v = uuid();
    localStorage.setItem(VISITOR_KEY, v);
  }
  return v;
}

function getSessionId(): { id: string; isNew: boolean } {
  if (!isBrowser()) return { id: "", isNew: false };
  const now = Date.now();
  const last = Number(sessionStorage.getItem(SESSION_LAST_KEY) || "0");
  let id = sessionStorage.getItem(SESSION_KEY);
  const expired = !id || now - last > SESSION_TTL_MS;
  if (expired) {
    id = uuid();
    sessionStorage.setItem(SESSION_KEY, id);
    // clear impression dedup on new session
    sessionStorage.removeItem(IMPRESSION_KEY);
  }
  sessionStorage.setItem(SESSION_LAST_KEY, String(now));
  return { id: id!, isNew: expired };
}

function isMobile(): boolean {
  if (!isBrowser()) return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

type EventInput = {
  event_type: "page_view" | "search" | "impression" | "listing_click" | "lead_action";
  lead_type?: "phone" | "website" | "directions";
  provider_place_id?: string;
  city_slug?: string;
  query?: string;
  path?: string;
  metadata?: Record<string, unknown>;
};

let queue: EventInput[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, 1500);
}

function inferEntryMethod(path: string): "search" | "browse" | "direct" {
  if (path.startsWith("/search")) return "search";
  if (
    path.startsWith("/tx/") ||
    path.startsWith("/best/") ||
    path.startsWith("/treatment/") ||
    path.startsWith("/concern/") ||
    path.startsWith("/provider/")
  ) return "browse";
  return "direct";
}

function flush() {
  flushTimer = null;
  if (!isBrowser() || queue.length === 0) return;
  const { id: sessionId, isNew } = getSessionId();
  const visitorId = getVisitorId();
  if (!sessionId || !visitorId) return;
  const events = queue.splice(0, queue.length);
  const path = window.location.pathname + window.location.search;

  const body = JSON.stringify({
    visitor_id: visitorId,
    session_id: sessionId,
    session_new: isNew,
    entry_path: isNew ? path : undefined,
    entry_method: isNew ? inferEntryMethod(window.location.pathname) : undefined,
    referrer: isNew ? document.referrer || undefined : undefined,
    user_agent: isNew ? navigator.userAgent : undefined,
    is_mobile: isMobile(),
    events: events.map((e) => ({ ...e, path: e.path ?? path })),
  });

  try {
    if ("sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/public/track", blob);
      if (ok) return;
    }
  } catch {
    /* fall through */
  }
  fetch("/api/public/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

function enqueue(e: EventInput) {
  if (!isBrowser()) return;
  queue.push(e);
  scheduleFlush();
  if (queue.length >= 10) flush();
}

export function trackPageView(path?: string, city_slug?: string) {
  enqueue({ event_type: "page_view", path, city_slug });
}

export function trackSearch(query: string, city_slug?: string) {
  enqueue({ event_type: "search", query: query.slice(0, 120), city_slug });
}

export function trackImpressions(placeIds: string[], city_slug?: string) {
  if (!isBrowser() || placeIds.length === 0) return;
  const raw = sessionStorage.getItem(IMPRESSION_KEY) || "";
  const seen = new Set(raw ? raw.split(",") : []);
  const fresh = placeIds.filter((id) => id && !seen.has(id));
  if (fresh.length === 0) return;
  for (const id of fresh) seen.add(id);
  sessionStorage.setItem(IMPRESSION_KEY, Array.from(seen).slice(-500).join(","));
  for (const id of fresh) enqueue({ event_type: "impression", provider_place_id: id, city_slug });
}

export function trackListingClick(placeId: string, city_slug?: string) {
  enqueue({ event_type: "listing_click", provider_place_id: placeId, city_slug });
  flush();
}

export function trackLeadAction(
  placeId: string,
  leadType: "phone" | "website" | "directions",
  city_slug?: string,
) {
  enqueue({ event_type: "lead_action", provider_place_id: placeId, lead_type: leadType, city_slug });
  flush();
}

// Called on route change to keep session alive & log page view.
export function trackRouteChange(path: string) {
  getSessionId(); // updates last_seen
  trackPageView(path);
}
