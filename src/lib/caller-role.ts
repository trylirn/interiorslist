// Shared helper: check whether the calling user has the admin role using the
// request-scoped Supabase client (RLS applies; has_role is security definer).
type RpcClient = { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };

export async function callerIsAdmin(supabase: RpcClient, userId: string): Promise<boolean> {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return data === true;
}

/** Super-admin only escape hatch (manual studio onboarding back door). */
export async function callerIsSuperAdmin(supabase: RpcClient, userId: string): Promise<boolean> {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "super_admin" });
  return data === true;
}

/**
 * Throwing admin guard used by every admin server function. Single source of
 * truth so the admin check can't drift between modules.
 */
export async function requireAdmin(userId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}
