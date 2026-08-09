import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { sendContactMessage } from "@/lib/contact.functions";
import { SERVICES, PROJECT_TYPES, BUDGET_BANDS, STYLES } from "@/lib/cities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIMELINES = ["As soon as possible", "1–3 months", "3–6 months", "6+ months", "Just exploring"];

export type ConsultationFormProps = {
  placeId: string;
  studioName?: string;
  /** Pre-fill from the match quiz */
  defaults?: Partial<{ service: string; projectType: string; budget: string; style: string; zip: string }>;
  compact?: boolean;
};

export function ConsultationForm({ placeId, studioName, defaults, compact }: ConsultationFormProps) {
  const send = useServerFn(sendContactMessage);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState(defaults?.zip ?? "");
  const [service, setService] = useState(defaults?.service ?? "");
  const [projectType, setProjectType] = useState(defaults?.projectType ?? "");
  const [budget, setBudget] = useState(defaults?.budget ?? "");
  const [style, setStyle] = useState(defaults?.style ?? "");
  const [timeline, setTimeline] = useState("");
  const [rooms, setRooms] = useState("");
  const [notes, setNotes] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || !lastName || !email || phone.trim().length < 7) {
      toast.error("Please add your name, email and phone number.");
      return;
    }
    // Structured details go into their own columns; the message keeps the
    // client-voice brief plus the chosen service, which has no column.
    const serviceLabel = service ? (SERVICES.find((s) => s.slug === service)?.name ?? service) : "";
    const opening = `We're looking for ${serviceLabel ? serviceLabel.toLowerCase() : "an interior designer"}${zip ? ` in ${zip}` : ""}.`;
    const message =
      [`From: ${firstName} ${lastName} · ${email} · ${phone}`, opening, notes]
        .filter(Boolean)
        .join("\n\n") || "Consultation request";

    setSending(true);
    try {
      await send({
        data: {
          placeId,
          firstName,
          lastName,
          email,
          phone,
          message,
          location: zip,
          projectType: projectType ? (PROJECT_TYPES.find((p) => p.slug === projectType)?.label ?? projectType) : "",
          budget: budget ? (BUDGET_BANDS.find((b) => b.slug === budget)?.label ?? budget) : "",
          style: style ? (STYLES.find((s) => s.slug === style)?.label ?? style) : "",
          timeline,
          rooms,
        },
      });
      setDone(true);
      toast.success("Request sent — the studio will be in touch.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your request.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-brand/30 bg-brand/5 p-6">
        <h3 className="font-display text-xl">Request sent</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {studioName ? `${studioName} has` : "The studio has"} received your project brief and will reply to {email}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name"><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></Field>
        <Field label="Last name"><Input value={lastName} onChange={(e) => setLastName(e.target.value)} required /></Field>
        <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field>
      </div>

      <div className={compact ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
        {!compact && (
          <Field label="What do you need?">
            <Picker value={service} onChange={setService} placeholder="Select a service" options={SERVICES.map((s) => ({ value: s.slug, label: s.name }))} />
          </Field>
        )}
        <Field label="Project type">
          <Picker value={projectType} onChange={setProjectType} placeholder="Select a project type" options={PROJECT_TYPES.map((p) => ({ value: p.slug, label: p.label }))} />
        </Field>
        <Field label="Preferred style">
          <Picker value={style} onChange={setStyle} placeholder="Select a style" options={STYLES.map((s) => ({ value: s.slug, label: s.label }))} />
        </Field>
        <Field label="Budget">
          <Picker value={budget} onChange={setBudget} placeholder="Select a budget" options={BUDGET_BANDS.map((b) => ({ value: b.slug, label: b.label }))} />
        </Field>
        <Field label="Timeline">
          <Picker value={timeline} onChange={setTimeline} placeholder="When do you want to start?" options={TIMELINES.map((t) => ({ value: t, label: t }))} />
        </Field>
        <Field label={compact ? "City / ZIP" : "ZIP / area"}><Input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="e.g. Miami, FL" /></Field>
        <div className={compact ? "" : "sm:col-span-2"}>
          <Field label="Rooms or scope"><Input value={rooms} onChange={(e) => setRooms(e.target.value)} placeholder="e.g. kitchen, primary bath and living room" /></Field>
        </div>
      </div>


      <Field label="Tell the studio about your project">
        <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Square footage, what you like, what isn't working, anything else useful." />
      </Field>

      <Button type="submit" disabled={sending} className="w-full rounded-full">
        {sending ? "Sending…" : "Request a consultation"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Your details go straight to the studio.
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Picker({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: { value: string; label: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={placeholder}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

