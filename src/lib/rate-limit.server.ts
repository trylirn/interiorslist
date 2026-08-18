import { getRequestHeader } from "@tanstack/react-start/server";

/** Coarse caller fingerprint (proxy IP). Never stored raw — hashed below. */
function callerIp(): string {
  const fwd = getRequestHeader("x-forwarded-for") ?? "";
  return (
    getRequestHeader("cf-connecting-ip") ||
    fwd.split(",")[0]?.trim() ||
    getRequestHeader("x-real-ip") ||
    "unknown"
  );
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Rolling-window limiter backed by public.rate_limit_hits (server-only table).
 * Throws a friendly error when the caller exceeds `max` hits in `windowMinutes`.
 */
export async function enforceRateLimit(
  endpoint: string,
  { max = 5, windowMinutes = 60 }: { max?: number; windowMinutes?: number } = {},
): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bucket = `${endpoint}:${(await sha256(callerIp())).slice(0, 32)}`;
    const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();

    const client = supabaseAdmin as unknown as {
      from: (t: string) => any;
    };

    const { count } = await client
      .from("rate_limit_hits")
      .select("id", { count: "exact", head: true })
      .eq("bucket", bucket)
      .gte("created_at", since);

    if ((count ?? 0) >= max) {
      throw new RateLimitError();
    }

    await client.from("rate_limit_hits").insert({ bucket });
    // Opportunistic cleanup of old rows.
    if (Math.random() < 0.05) {
      await client
        .from("rate_limit_hits")
        .delete()
        .lt("created_at", new Date(Date.now() - 24 * 60 * 60_000).toISOString());
    }
  } catch (err) {
    if (err instanceof RateLimitError) throw new Error(err.message);
    // Never block a legitimate submission because the limiter itself failed.
    console.error("[rate-limit] check failed", err);
  }
}

class RateLimitError extends Error {
  constructor() {
    super("Too many submissions from this device. Please try again later.");
    this.name = "RateLimitError";
  }
}
