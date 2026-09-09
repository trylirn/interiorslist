import { trackingDisabled } from "@/lib/analytics";

export type ToolUsage = {
  tool: "budget-estimator" | "room-planner" | "color-palette";
  room_type?: string;
  scope?: string;
  state_code?: string;
  style_slug?: string;
  budget_band?: string;
};

/**
 * Anonymous, non-identifying record of how the free tools are used. No visitor
 * id, no free text — just the combination, so the admin "Tool demand" view can
 * show which indexable pages are worth building next.
 */
export function logToolUsage(u: ToolUsage) {
  if (typeof window === "undefined" || trackingDisabled()) return;
  try {
    const body = JSON.stringify(u);
    if ("sendBeacon" in navigator) {
      const ok = navigator.sendBeacon("/api/public/tool-usage", new Blob([body], { type: "application/json" }));
      if (ok) return;
    }
    fetch("/api/public/tool-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never break the tool over analytics */
  }
}
