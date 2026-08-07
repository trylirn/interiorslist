import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitBusiness } from "@/lib/user-actions.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/submit")({
  head: () => ({
    meta: [
      { title: "Submit a Studio | Interiors List" },
      { name: "description", content: "Know a great interior design studio we're missing? Submit them to the directory." },
      { property: "og:title", content: "Submit a Studio — Interiors List" },
      { property: "og:description", content: "Submit an interior design studio to the directory." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/submit" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/submit" }],
  }),
  component: SubmitPage,
});

function SubmitPage() {
  const submit = useServerFn(submitBusiness);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await submit({ data: {
        businessName: String(fd.get("businessName")),
        city: String(fd.get("city")),
        address: String(fd.get("address") ?? ""),
        website: String(fd.get("website") ?? ""),
        contactEmail: String(fd.get("contactEmail")),
        contactPhone: String(fd.get("contactPhone") ?? ""),
        notes: String(fd.get("notes") ?? ""),
      }});
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally { setLoading(false); }
  }

  if (done) return (
    <div className="mx-auto max-w-md py-24 text-center px-4">
      <h1 className="font-display text-3xl">Thanks!</h1>
      <p className="mt-2 text-muted-foreground">Your submission is in our review queue.</p>
      <Button asChild className="mt-6"><Link to="/">Back home</Link></Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-display text-4xl">Submit a studio</h1>
      <p className="mt-2 text-muted-foreground">Know a great interior design studio we're missing? Tell us about them.</p>
      <form onSubmit={handle} className="mt-8 space-y-4">
        <div className="space-y-1.5"><Label>Studio name *</Label><Input name="businessName" required maxLength={200} /></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><Label>City *</Label><Input name="city" required maxLength={100} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input name="contactPhone" maxLength={40} /></div>
        </div>
        <div className="space-y-1.5"><Label>Address</Label><Input name="address" maxLength={300} /></div>
        <div className="space-y-1.5"><Label>Website</Label><Input name="website" type="url" maxLength={300} placeholder="https://…" /></div>
        <div className="space-y-1.5"><Label>Your email *</Label><Input name="contactEmail" type="email" required maxLength={255} /></div>
        <div className="space-y-1.5"><Label>Notes (services, styles, professional credentials such as ASID/NCIDQ membership)</Label><Textarea name="notes" maxLength={2000} rows={4} /></div>
        <Button type="submit" disabled={loading} className="w-full h-11">{loading ? "Submitting…" : "Submit studio"}</Button>
      </form>
    </div>
  );
}
