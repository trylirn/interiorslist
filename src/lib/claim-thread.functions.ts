import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BUCKET = "business-docs";

async function loadClaim(claimId: string, token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("claims")
    .select("id, provider_place_id, contact_name, contact_email, status, decision_reason, proof_notes, submitted_at, access_token")
    .eq("id", claimId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.access_token !== token) throw new Error("Claim not found");
  return { claim: data, supabaseAdmin };
}

/** Read a claim and its message thread using the private claim link. */
export const getClaimThread = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ claimId: z.string().uuid(), token: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { claim, supabaseAdmin } = await loadClaim(data.claimId, data.token);

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

/** Signed upload URL so a claimant (with or without an account) can attach proof. */
export const createClaimUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ claimId: z.string().uuid(), token: z.string().uuid(), fileName: z.string().trim().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { claim, supabaseAdmin } = await loadClaim(data.claimId, data.token);
    const safe = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
    const path = `claims/${claim.id}/${Date.now()}-${safe}`;
    const { data: signed, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
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
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("claims")
      .update({ status: claim.status === "rejected" ? "rejected" : "pending", last_message_at: now })
      .eq("id", claim.id);

    return { ok: true };
  });
