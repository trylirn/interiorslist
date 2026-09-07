// Server-only: enforces the "one studio per owner" rule.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const ONE_STUDIO_MESSAGE = "This account already manages a studio on Intearior.";

/**
 * Throws when the given account (by user id or contact email) already owns a
 * studio or already has an approved claim.
 */
export async function assertNoExistingStudio(
  ownerId: string | null | undefined,
  email: string | null | undefined,
  opts: { ignoreClaimId?: string } = {},
) {
  const normalizedEmail = email?.trim().toLowerCase() || null;

  let resolvedOwnerId = ownerId ?? null;
  if (!resolvedOwnerId && normalizedEmail) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();
    resolvedOwnerId = profile?.id ?? null;
  }

  if (resolvedOwnerId) {
    const { count } = await supabaseAdmin
      .from("providers")
      .select("place_id", { count: "exact", head: true })
      .eq("claimed_by", resolvedOwnerId);
    if ((count ?? 0) > 0) throw new Error(ONE_STUDIO_MESSAGE);
  }

  if (normalizedEmail) {
    let q = supabaseAdmin
      .from("claims")
      .select("id")
      .eq("contact_email", normalizedEmail)
      .eq("status", "approved");
    if (opts.ignoreClaimId) q = q.neq("id", opts.ignoreClaimId);
    const { data: approved } = await q.limit(1);
    if ((approved ?? []).length > 0) throw new Error(ONE_STUDIO_MESSAGE);
  }
}
