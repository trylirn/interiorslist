import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const manageableRole = z.enum(["admin", "super_admin"]);

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (data ?? []).map((r) => r.role as string);
    const isSuperAdmin = roles.includes("super_admin");
    return { roles, isAdmin: roles.includes("admin") || isSuperAdmin, isSuperAdmin };
  });

async function assertSuperAdmin(supabase: unknown, userId: string) {
  const client = supabase as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };
  const { data } = await client.rpc("has_role", { _user_id: userId, _role: "super_admin" });
  if (data !== true) throw new Error("Forbidden — super admin only");
}

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: mine } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const myRoles = (mine ?? []).map((r) => r.role as string);
    if (!myRoles.includes("admin") && !myRoles.includes("super_admin")) {
      throw new Error("Forbidden");
    }

    const { data: rows, error } = await supabaseAdmin
      .from("user_roles")
      .select("id, user_id, role, created_at")
      .in("role", ["admin", "super_admin"])
      .order("created_at");
    if (error) throw new Error(error.message);

    const ids = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, email, display_name").in("id", ids)
      : { data: [] as { id: string; email: string | null; display_name: string | null }[] };
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));

    const { data: invites } = await supabaseAdmin
      .from("admin_invites")
      .select("id, email, role, created_at, accepted_at")
      .is("accepted_at", null)
      .order("created_at", { ascending: false });

    return {
      isSuperAdmin: myRoles.includes("super_admin"),
      members: (rows ?? []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        role: r.role as string,
        grantedAt: r.created_at as string,
        email: map.get(r.user_id)?.email ?? null,
        name: map.get(r.user_id)?.display_name ?? null,
        isMe: r.user_id === context.userId,
      })),
      invites: (invites ?? []).map((i) => ({
        id: i.id,
        email: i.email as string,
        role: i.role as string,
        createdAt: i.created_at as string,
      })),
    };
  });

export const grantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ email: z.string().trim().email().max(255), role: manageableRole }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (profile) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: profile.id, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
      // super admins also carry the everyday admin role
      if (data.role === "super_admin") {
        await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: profile.id, role: "admin" }, { onConflict: "user_id,role" });
      }
      return { ok: true, invited: false };
    }

    const { error } = await supabaseAdmin
      .from("admin_invites")
      .upsert(
        { email, role: data.role, invited_by: context.userId, accepted_at: null },
        { onConflict: "email,role" },
      );
    if (error) throw new Error(error.message);
    return { ok: true, invited: true };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ userId: z.string().uuid(), role: manageableRole }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("You can't change your own access");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.role === "super_admin") {
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "super_admin");
      if ((count ?? 0) <= 1) throw new Error("There must be at least one super admin");
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("admin_invites").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
