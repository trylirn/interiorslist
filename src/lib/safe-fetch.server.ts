// Server-only: guards outbound fetches against SSRF (internal hosts, cloud
// metadata endpoints, and redirects that hop onto private addresses).

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata",
  "metadata.google.internal",
  "instance-data",
]);

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a = 0, b = 0] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 169 && b === 254) return true; // link-local / metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && (b === 168 || b === 0)) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isPrivateIPv6(raw: string): boolean {
  const ip = raw.replace(/^\[|\]$/g, "").toLowerCase();
  if (ip === "::" || ip === "::1") return true;
  if (ip.startsWith("fe80") || ip.startsWith("fc") || ip.startsWith("fd")) return true;
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) return isPrivateIPv4(mapped[1]);
  return false;
}

/** Resolve a hostname via DNS-over-HTTPS and reject private destinations. */
async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (
    BLOCKED_HOSTNAMES.has(host) ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".localhost") ||
    !host.includes(".")
  ) {
    throw new Error("That address isn't a public website.");
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    if (isPrivateIPv4(host)) throw new Error("That address isn't a public website.");
    return;
  }
  if (host.includes(":")) {
    if (isPrivateIPv6(host)) throw new Error("That address isn't a public website.");
    return;
  }

  const addresses: string[] = [];
  for (const type of ["A", "AAAA"]) {
    try {
      const res = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`,
        { headers: { accept: "application/dns-json" } },
      );
      if (!res.ok) continue;
      const json = (await res.json()) as { Answer?: Array<{ type: number; data: string }> };
      for (const a of json.Answer ?? []) {
        if (a.type === 1 || a.type === 28) addresses.push(a.data);
      }
    } catch {
      // treated as "unresolved" below
    }
  }

  if (!addresses.length) throw new Error("We couldn't reach that address.");
  for (const ip of addresses) {
    if (ip.includes(":") ? isPrivateIPv6(ip) : isPrivateIPv4(ip)) {
      throw new Error("That address isn't a public website.");
    }
  }
}

/**
 * Fetch a user-supplied URL, validating every hop (including redirects) so the
 * request can only ever reach a public internet host over http/https.
 */
export async function safePublicFetch(
  rawUrl: string,
  init: RequestInit = {},
  maxRedirects = 3,
): Promise<{ response: Response; finalUrl: string }> {
  let current = new URL(rawUrl);

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    if (current.protocol !== "https:" && current.protocol !== "http:") {
      throw new Error("Please use a normal web address.");
    }
    await assertPublicHost(current.hostname);

    const response = await fetch(current.toString(), { ...init, redirect: "manual" });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return { response, finalUrl: current.toString() };
      current = new URL(location, current);
      continue;
    }
    return { response, finalUrl: current.toString() };
  }

  throw new Error("That page redirects too many times.");
}
