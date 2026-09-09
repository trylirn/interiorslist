/**
 * Studio photos live in private storage and are stored as long-lived signed links.
 * Rewrite them to a first-party /photo/... address so visitors never see a
 * storage URL — and so the link keeps working when the signature expires.
 */
export function photoUrl(url: string | null | undefined): string {
  if (!url) return "";
  const m = url.match(/\/storage\/v1\/object\/(?:sign|public|authenticated)\/provider-photos\/([^?]+)/);
  if (!m || !m[1]) return url;
  return `/photo/${m[1]}`;
}
