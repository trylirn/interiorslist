import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import { getClaimThread, postClaimReply, createClaimUploadUrl } from "@/lib/claim-thread.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Paperclip, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_site/claim/status/$id")({
  validateSearch: (s: Record<string, unknown>) => z.object({ token: z.string().optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Claim status | Intearior" },
      { name: "description", content: "Track your studio claim, read notes from our team and send extra proof of ownership." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ClaimStatus,
});

const STATUS_COPY: Record<string, { label: string; note: string }> = {
  pending: { label: "Pending review", note: "Our team is reviewing your claim. We'll add a note here if we need anything else." },
  needs_info: { label: "More info needed", note: "We need a little more proof before we can hand over this listing. Reply below." },
  approved: { label: "Approved", note: "This listing is now yours. Sign in to manage it from your dashboard." },
  rejected: { label: "Not approved", note: "We couldn't verify this claim. You can reply below with more detail." },
};

function ClaimStatus() {
  const { id } = Route.useParams();
  const { token } = Route.useSearch();
  const load = useServerFn(getClaimThread);
  const reply = useServerFn(postClaimReply);
  const makeUpload = useServerFn(createClaimUploadUrl);

  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["claim-thread", id, token],
    queryFn: () => load({ data: { claimId: id, token: token! } }),
    enabled: !!token,
    retry: false,
  });

  if (!token) {
    return (
      <Shell>
        <h1 className="font-display text-3xl">Private link required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open the claim link we emailed you, or find your claim in your dashboard.
        </p>
        <Button asChild className="mt-6 rounded-full"><Link to="/dashboard">Go to dashboard</Link></Button>
      </Shell>
    );
  }
  if (isLoading) return <Shell><p className="text-muted-foreground">Loading…</p></Shell>;
  if (error || !data) {
    return (
      <Shell>
        <h1 className="font-display text-3xl">Claim not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This link is invalid or has expired.</p>
      </Shell>
    );
  }

  const status = STATUS_COPY[data.claim.status] ?? STATUS_COPY['pending']!;

  async function send() {
    if (!body.trim()) { toast.error("Please write a short reply."); return; }
    setSending(true);
    try {
      let attachmentPath = "";
      if (file) {
        if (file.size > 10 * 1024 * 1024) throw new Error("Files must be under 10MB.");
        const up = await makeUpload({ data: { claimId: id, token: token!, fileName: file.name } });
        const res = await fetch(up.signedUrl, { method: "PUT", body: file });
        if (!res.ok) throw new Error("Upload failed. Please try a different file.");
        attachmentPath = up.path;
      }
      await reply({ data: { claimId: id, token: token!, body: body.trim(), attachmentPath } });
      setBody("");
      setFile(null);
      toast.success("Reply sent — we'll take another look.");
      void refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send your reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Shell>
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>
      <h1 className="mt-4 font-display text-3xl">{data.provider?.name ?? "Your claim"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {data.provider ? `${data.provider.city}, ${data.provider.state} · ` : ""}
        Submitted {new Date(data.claim.submittedAt).toLocaleDateString()}
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-brand">{status.label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{status.note}</p>
      </div>

      <div className="mt-8 space-y-3">
        {data.claim.proofNotes && (
          <Bubble who="You" when={data.claim.submittedAt} body={data.claim.proofNotes} mine />
        )}
        {data.messages.map((m) => (
          <Bubble
            key={m.id}
            who={m.author_role === "admin" ? (m.author_name ?? "Intearior team") : "You"}
            when={m.created_at}
            body={m.body}
            mine={m.author_role === "claimant"}
            attachmentUrl={m.attachmentUrl}
          />
        ))}
      </div>

      {data.claim.status !== "approved" && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">Reply or send proof</h2>
          <Textarea
            className="mt-3"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add anything that helps us verify you own this studio."
            aria-label="Your reply"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Paperclip className="h-4 w-4" />
              <Input type="file" className="h-9" onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label="Attach proof of ownership" />
            </label>
            <Button onClick={send} disabled={sending} className="rounded-full">{sending ? "Sending…" : "Send reply"}</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Business licence, utility bill, signage photo or anything with the business name.</p>
        </div>
      )}
    </Shell>
  );
}

function Bubble({ who, when, body, mine, attachmentUrl }: { who: string; when: string; body: string; mine?: boolean; attachmentUrl?: string | null }) {
  return (
    <div className={`rounded-2xl border p-4 ${mine ? "border-border bg-card" : "border-brand/30 bg-brand/5"}`}>
      <p className="text-xs text-muted-foreground">{who} · {new Date(when).toLocaleString()}</p>
      <p className="mt-1 whitespace-pre-line text-sm">{body}</p>
      {attachmentUrl && (
        <a href={attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-brand underline">
          <Paperclip className="h-3.5 w-3.5" /> View attachment
        </a>
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-2xl px-4 py-12">{children}</div>;
}
