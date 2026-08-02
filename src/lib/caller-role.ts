// Shared helper: check whether the calling user has the admin role using the
// request-scoped Supabase client (RLS applies; has_role is security definer).
type RpcClient = { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };

export async function callerIsAdmin(supabase: RpcClient, userId: string): Promise<boolean> {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return data === true;
}
