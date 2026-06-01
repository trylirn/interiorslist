import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getProviderBySlug } from "@/lib/providers.functions";
import { submitClaim } from "@/lib/owner.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/claim/$slug")({
  head: () => ({ meta: [{ title: "Claim listing | Texas Aesthetics" }, { name: "robots", content: "noindex, nofollow" }] }),
  loader: ({ params }) => getProviderBySlug({ data: { slug: params.slug } }),
  component: ClaimPage,
});

function ClaimPage() {
  const { provider } = Route.useLoaderData();
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [form, setForm] = useState({ contactEmail: "", contactPhone: "", businessRole: "", proofNotes: "" });
  const [loading, setLoading] = useState(false);
  const submit = useServerFn(submitClaim);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      if (data.session?.user.email) setForm((f) => ({ ...f, contactEmail: f.contactEmail || data.session!.user.email! }));
    });
  }, []);

  if (!provider) return <div className="mx-auto max-w-md py-24 text-center px-4"><h1 className="font-display text-3xl">Listing not found</h1></div>;

  if (authed === false) {
    return (
      <div className="mx-auto max-w-md py-24 text-center px-4">
        <h1 className="font-display text-3xl">Sign in to claim</h1>
        <p className="mt-3 text-muted-foreground">You need an account to claim <span className="font-medium">{provider.name}</span>.</p>
        <Button asChild className="mt-6"><Link to="/login">Sign in or create account</Link></Button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await submit({
        data: {
          placeId: provider!.place_id,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone || undefined,
          businessRole: form.businessRole || undefined,
          proofNotes: form.proofNotes || undefined,
        },
      });
      toast.success("Claim submitted — we'll be in touch within 1–2 business days.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit claim");
    } finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">Claim Listing</p>
      <h1 className="mt-3 font-display text-4xl">{provider.name}</h1>
      <p className="mt-2 text-muted-foreground">{provider.city}, TX</p>
      <p className="mt-6 text-sm">Tell us a bit about your role and we'll verify ownership within 1–2 business days.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Field label="Business email" required>
          <Input type="email" required value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="you@yourclinic.com" />
        </Field>
        <Field label="Phone">
          <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="(214) 555-1234" />
        </Field>
        <Field label="Your role at the business">
          <Input value={form.businessRole} onChange={(e) => setForm({ ...form, businessRole: e.target.value })} placeholder="Owner / Manager / Medical Director" />
        </Field>
        <Field label="Proof of ownership">
          <Textarea value={form.proofNotes} onChange={(e) => setForm({ ...form, proofNotes: e.target.value })} placeholder="Link to your About page, business email match, etc." rows={4} />
        </Field>
        <Button type="submit" disabled={loading} className="w-full h-11">{loading ? "Submitting…" : "Submit claim"}</Button>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-brand"> *</span>}</Label>
      {children}
    </div>
  );
}
