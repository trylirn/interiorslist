import { fail } from "@/lib/errors";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BUCKET = "business-docs";

/**
 * A claim thread is private: the signed-in user must be the claimant (linked
 * account or the email the claim was filed with) or an admin. The private link
 * token alone is no longer enough to read or reply.
 */
async function loadClaim(claimId: string, token: string, userId: string, userEmail: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("claims")
    .select(
      "id, provider_place_id, user_id, contact_name, contact_email, status, decision_reason, proof_notes, submitted_at, access_token",
    )
    .eq("id", claimId)
    .maybeSingle();
  if (error) fail(error);
  if (!data || data.access_token !== token) throw new Error("Claim not found");

  const email = (userEmail ?? "").toLowerCase();
  const isClaimant =
    data.user_id === userId || (!!email && (data.contact_email ?? "").toLowerCase() === email);

  let allowed = isClaimant;
  if (!allowed) {
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin"])
      .maybeSingle();
    allowed = !!role;
  }
  if (!allowed) throw new Error("You don't have access to this claim.");

  // Bind the claim to the signed-in account the first time they open it.
  if (!data.user_id && isClaimant) {
    await supabaseAdmin.from("claims").update({ user_id: userId }).eq("id", data.id);
  }

  return { claim: data, supabaseAdmin };
}

/** Read a claim and its message thread — signed-in claimant or admin only. */
export const getClaimThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ claimId: z.string().uuid(), token: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { claim, supabaseAdmin } = await loadClaim(
      data.claimId,
      data.token,
      context.userId,
      (context.claims['email'] as string | undefined) ?? null,
    );

    const { data: provider } = await supabaseAdmin
      .from("providers")
      .select("name, city, state, slug")
      .eq("place_id", claim.provider_place_id)
      .maybeSingle();

    const { data: messages } = await supabaseAdmin
      .from("claim_messages")
      .select("id, author_role, author_name, body, attachment_path, created_at")
      .eq("claim_id", claim.id)
      .order("created_at", { ascending: true })
      .limit(100);

    const withUrls = await Promise.all(
      (messages ?? []).map(async (m) => {
        let attachmentUrl: string | null = null;
        if (m.attachment_path) {
          const { data: signed } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(m.attachment_path, 600);
          attachmentUrl = signed?.signedUrl ?? null;
        }
        return { ...m, attachmentUrl };
      }),
    );

    return {
      claim: {
        id: claim.id,
        status: claim.status,
        decisionReason: claim.decision_reason,
        contactName: claim.contact_name,
        contactEmail: claim.contact_email,
        proofNotes: claim.proof_notes,
        submittedAt: claim.submitted_at,
      },
      provider: provider ?? null,
      messages: withUrls,
    };
  });

/** Signed upload URL so a signed-in claimant can attach proof. */
export const createClaimUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ claimId: z.string().uuid(), token: z.string().uuid(), fileName: z.string().trim().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { claim, supabaseAdmin } = await loadClaim(
      data.claimId,
      data.token,
      context.userId,
      (context.claims['email'] as string | undefined) ?? null,
    );
    const safe = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
    const path = `claims/${claim.id}/${Date.now()}-${safe}`;
    const { data: signed, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) fail(error);
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

/** Claimant reply — moves the claim back to pending for another look. */
export const postClaimReply = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        claimId: z.string().uuid(),
        token: z.string().uuid(),
        body: z.string().trim().min(1).max(2000),
        attachmentPath: z.string().trim().max(500).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { claim, supabaseAdmin } = await loadClaim(data.claimId, data.token);
    if (claim.status === "approved") throw new Error("This claim has already been approved.");

    const { count } = await supabaseAdmin
      .from("claim_messages")
      .select("id", { count: "exact", head: true })
      .eq("claim_id", claim.id)
      .eq("author_role", "claimant")
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
    if ((count ?? 0) >= 10) throw new Error("Too many replies. Please try again later.");

    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from("claim_messages").insert({
      claim_id: claim.id,
      author_role: "claimant",
      author_name: claim.contact_name ?? claim.contact_email,
      body: data.body.trim(),
      attachment_path: data.attachmentPath || null,
    });
    if (error) fail(error);

    await supabaseAdmin
      .from("claims")
      .update({ status: claim.status === "rejected" ? "rejected" : "pending", last_message_at: now })
      .eq("id", claim.id);

    return { ok: true };
  });
