import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getProviderBySlug } from "@/lib/providers.functions";
import { submitClaim } from "@/lib/owner.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_site/claim/$slug")({
  head: () => ({
    meta: [
      { title: "Claim your listing | Texas Aesthetics" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: ({ params }) => getProviderBySlug({ data: { slug: params.slug } }),
  component: ClaimPage,
});


function ClaimPage() {
  const { provider } = Route.useLoaderData();
  const [form, setForm] = useState({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    businessRole: "",
    proofNotes: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submit = useServerFn(submitPublicClaim);

  if (!provider) {
    return (
      <div className="mx-auto max-w-md py-24 text-center px-4">
        <h1 className="font-display text-3xl">Listing not found</h1>
        <Button asChild className="mt-6"><Link to="/">Back home</Link></Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
          <CheckCircle2 className="h-7 w-7 text-brand" />
        </div>
        <h1 className="mt-6 font-display text-3xl">Claim received</h1>
        <p className="mt-4 text-muted-foreground">
          Someone from our team will reach out to you within a few minutes. If you decide you want to be listed,
          the cost is <span className="font-semibold text-foreground">$99 per year</span>.
        </p>
        <div className="mt-8 flex justify-center gap-2">
          <Button asChild variant="outline"><Link to="/provider/$slug" params={{ slug: provider.slug }}>Back to listing</Link></Button>
          <Button asChild><Link to="/">Home</Link></Button>
        </div>
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
          contactName: form.contactName || undefined,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone || undefined,
          businessRole: form.businessRole || undefined,
          proofNotes: form.proofNotes || undefined,
        },
      });
      setSubmitted(true);
      toast.success("Claim submitted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit claim");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">Claim Listing</p>
      <h1 className="mt-3 font-display text-4xl">{provider.name}</h1>
      <p className="mt-2 text-muted-foreground">{provider.city}, TX</p>
      <p className="mt-6 text-sm text-foreground/85">
        Tell us a bit about your role and we'll reach out within a few minutes. No account required.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Field label="Your name">
          <Input
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            placeholder="Jane Doe"
            maxLength={120}
          />
        </Field>
        <Field label="Business email" required>
          <Input
            type="email"
            required
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            placeholder="you@yourclinic.com"
            maxLength={255}
          />
        </Field>
        <Field label="Phone">
          <Input
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            placeholder="(214) 555-1234"
            maxLength={40}
          />
        </Field>
        <Field label="Your role at the business">
          <Input
            value={form.businessRole}
            onChange={(e) => setForm({ ...form, businessRole: e.target.value })}
            placeholder="Owner / Manager / Medical Director"
            maxLength={120}
          />
        </Field>
        <Field label="Anything we should know">
          <Textarea
            value={form.proofNotes}
            onChange={(e) => setForm({ ...form, proofNotes: e.target.value })}
            placeholder="Link to your About page, business email match, etc."
            rows={4}
            maxLength={2000}
          />
        </Field>

        <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4 text-sm text-foreground/85">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>
              Someone from our team will reach out to you within a few minutes. If you decide you want to be listed,
              the cost is <span className="font-semibold">$99 per year</span>.
            </span>
          </p>
        </div>

        <Button type="submit" disabled={loading} className="w-full h-11">
          {loading ? "Submitting…" : "Submit claim"}
        </Button>
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
