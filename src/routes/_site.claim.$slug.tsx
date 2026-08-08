import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getProviderBySlug } from "@/lib/providers.functions";
import { submitPublicClaim } from "@/lib/claim.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_site/claim/$slug")({
  head: () => ({
    meta: [
      { title: "Claim your listing | Intearior" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: ({ params }) => getProviderBySlug({ data: { slug: params.slug } }),
  component: ClaimPage,
});

function ClaimPage() {
  const { provider } = Route.useLoaderData();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    contactEmail: "",
    contactPhone: "",
    businessRole: "",
    proofNotes: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submit = useServerFn(submitPublicClaim);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        setForm((f) => ({ ...f, contactEmail: f.contactEmail || data.user!.email || "" }));
      }
    });
  }, []);

  if (!provider) {
    return (
      <div className="mx-auto max-w-md py-24 text-center px-4">
        <h1 className="font-display text-3xl">Listing not found</h1>
        <Button asChild className="mt-6"><Link to="/claim">Find your business</Link></Button>
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
          the cost is <span className="font-semibold text-foreground">$50 per month</span>.
        </p>
        <div className="mt-8 flex justify-center gap-2">
          <Button asChild variant="outline"><Link to="/provider/$slug" params={{ slug: provider.slug }}>Back to listing</Link></Button>
          <Button asChild><Link to="/">Home</Link></Button>
        </div>
      </div>
    );
  }

  const valid =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    /.+@.+\..+/.test(form.contactEmail) &&
    form.contactPhone.trim().length >= 7;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || !provider) return;
    setLoading(true);
    try {
      await submit({
        data: {
          placeId: provider.place_id,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim() || undefined,
          businessRole: form.businessRole.trim() || undefined,
          proofNotes: form.proofNotes.trim() || undefined,
          userId,
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
      <Link to="/claim" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> Choose a different profile
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-brand">Claim your profile</p>
      <h1 className="mt-3 font-display text-4xl">{provider.name}</h1>
      <p className="mt-2 text-muted-foreground">{provider.city}</p>
      <p className="mt-6 text-sm text-foreground/85">
        Tell us who you are and we'll verify your connection to this business. No account required.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-3xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" required>
            <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Jane" maxLength={80} required />
          </Field>
          <Field label="Last name" required>
            <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" maxLength={80} required />
          </Field>
        </div>
        <Field label="Business email" required>
          <Input type="email" required value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="you@yourstudio.com" maxLength={255} />
        </Field>
        <Field label="Phone number" required>
          <Input type="tel" required value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="(214) 555-1234" maxLength={40} />
        </Field>
        <Field label="Your position at the business">
          <Input value={form.businessRole} onChange={(e) => setForm({ ...form, businessRole: e.target.value })} placeholder="Owner / Manager / Principal Designer" maxLength={120} />
        </Field>
        <Field label="Why are you claiming this profile?">
          <Textarea value={form.proofNotes} onChange={(e) => setForm({ ...form, proofNotes: e.target.value })} rows={4} maxLength={2000} placeholder="Tell us how you're connected to this business — a link to your About page, a matching business email, etc." />
        </Field>

        <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4 text-sm text-foreground/85">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>
              Someone from our team will reach out to you within a few minutes. If you decide you want to be listed,
              the cost is <span className="font-semibold">$50 per month</span>.
            </span>
          </p>
        </div>

        <Button type="submit" disabled={loading || !valid} className="h-11 w-full">
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
