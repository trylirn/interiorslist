import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMyProfile, updateMyProfile, deleteMyAccount } from "@/lib/user-actions.functions";
import { useSignOut } from "@/components/dashboard-shell";
import { LogOut } from "lucide-react";

const REASONS = [
  "I no longer run an interior design studio",
  "I didn't get enough quality leads",
  "Too expensive for the value",
  "The dashboard was hard to use",
  "I'm using another directory instead",
  "Privacy concerns",
  "Something else",
];

const RETURN_OPTIONS = ["Very likely", "Maybe someday", "Unlikely", "Never"];

export function AccountSettings({ email, canClose = true }: { email: string | null; canClose?: boolean }) {
  const signOut = useSignOut();
  return (
    <div className="space-y-8">
      <ProfileCard email={email} />

      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">Session</h2>
        <p className="mt-2 text-sm text-muted-foreground">Sign out of Intearior on this device.</p>
        <Button variant="outline" className="mt-4" onClick={() => void signOut()}>
          <LogOut className="mr-2 h-4 w-4" />Sign out
        </Button>
      </div>

      {canClose ? (
        <CloseAccountWizard />
      ) : (
        <div className="rounded-3xl border border-border bg-secondary/40 p-6 text-sm text-muted-foreground">
          Super admin accounts can't be closed from the dashboard.
        </div>
      )}
    </div>
  );
}

function ProfileCard({ email }: { email: string | null }) {
  const load = useServerFn(getMyProfile);
  const save = useServerFn(updateMyProfile);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["my-profile"], queryFn: () => load({}) });
  const [form, setForm] = useState({ displayName: "", contactName: "", phone: "", businessRole: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = data?.profile;
    if (p) {
      setForm({
        displayName: p.display_name ?? "",
        contactName: p.contact_name ?? "",
        phone: p.phone ?? "",
        businessRole: p.business_role ?? "",
      });
    }
  }, [data]);

  async function onSave() {
    setBusy(true);
    try {
      await save({ data: form });
      toast.success("Profile updated");
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h2 className="font-display text-xl">Your details</h2>
      <p className="mt-1 text-sm text-muted-foreground">Used when we pass leads and claim updates to you.</p>
      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Email</Label>
            <Input value={email ?? ""} disabled className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="s-contact">Contact name</Label>
            <Input id="s-contact" className="mt-1.5" value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="s-display">Display name</Label>
            <Input id="s-display" className="mt-1.5" value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="s-phone">Phone</Label>
            <Input id="s-phone" className="mt-1.5" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="s-role">Your role</Label>
            <Input id="s-role" className="mt-1.5" placeholder="Owner, Principal Designer…" value={form.businessRole}
              onChange={(e) => setForm({ ...form, businessRole: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={onSave} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CloseAccountWizard() {
  const del = useServerFn(deleteMyAccount);
  const [step, setStep] = useState(0); // 0 = closed, 1..4 = steps
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [missing, setMissing] = useState("");
  const [wouldReturn, setWouldReturn] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setStep(0); setReason(""); setDetails(""); setMissing(""); setWouldReturn(""); setConfirm("");
  }

  async function onDelete() {
    setBusy(true);
    try {
      await del({ data: { reason, details, missingFeatures: missing, wouldReturn } });
      await supabase.auth.signOut();
      toast.success("Your account has been closed");
      window.location.href = "/";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not close account");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-6">
      <h2 className="font-display text-xl text-destructive">Close account</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Closing your account permanently removes your profile, saved details, claims and reviews. Any studio listing
        you claimed is released back to unclaimed — the listing itself stays in the directory. This cannot be undone.
      </p>

      {step === 0 && (
        <Button variant="outline" className="mt-4 border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={() => setStep(1)}>
          Close my account
        </Button>
      )}

      {step > 0 && (
        <div className="mt-5 max-w-xl rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Step {step} of 4</p>

          {step === 1 && (
            <>
              <h3 className="mt-2 font-display text-lg">Why are you leaving?</h3>
              <div className="mt-4 space-y-2">
                {REASONS.map((r) => (
                  <button key={r} type="button" onClick={() => setReason(r)}
                    className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
                      reason === r ? "border-brand bg-brand/10 text-foreground" : "border-border hover:bg-secondary/60"
                    }`}>
                    {r}
                  </button>
                ))}
              </div>
              <StepNav onCancel={reset} onNext={() => setStep(2)} nextDisabled={!reason} />
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="mt-2 font-display text-lg">Tell us a bit more</h3>
              <p className="mt-1 text-sm text-muted-foreground">What happened? This goes straight to our team.</p>
              <Textarea className="mt-3" rows={4} value={details} onChange={(e) => setDetails(e.target.value)}
                placeholder="Optional, but it really helps us improve." />
              <StepNav onBack={() => setStep(1)} onCancel={reset} onNext={() => setStep(3)} />
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="mt-2 font-display text-lg">What was missing?</h3>
              <p className="mt-1 text-sm text-muted-foreground">Any feature that would have kept you here?</p>
              <Textarea className="mt-3" rows={3} value={missing} onChange={(e) => setMissing(e.target.value)}
                placeholder="e.g. more local leads, portfolio tools, integrations…" />
              <p className="mt-5 text-sm font-medium">Would you consider coming back?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {RETURN_OPTIONS.map((o) => (
                  <button key={o} type="button" onClick={() => setWouldReturn(o)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                      wouldReturn === o ? "border-brand bg-brand/10" : "border-border hover:bg-secondary/60"
                    }`}>
                    {o}
                  </button>
                ))}
              </div>
              <StepNav onBack={() => setStep(2)} onCancel={reset} onNext={() => setStep(4)} />
            </>
          )}

          {step === 4 && (
            <>
              <h3 className="mt-2 font-display text-lg text-destructive">Confirm closure</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This is permanent. Your listing claim will be released and your leads history removed.
              </p>
              <Label htmlFor="s-confirm" className="mt-4 block">Type <span className="font-mono">DELETE</span> to confirm</Label>
              <Input id="s-confirm" className="mt-1.5" value={confirm} placeholder="DELETE"
                onChange={(e) => setConfirm(e.target.value)} />
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="destructive" disabled={confirm !== "DELETE" || busy} onClick={onDelete}>
                  {busy ? "Closing…" : "Permanently close account"}
                </Button>
                <Button variant="ghost" onClick={() => setStep(3)} disabled={busy}>Back</Button>
                <Button variant="ghost" onClick={reset} disabled={busy}>Cancel</Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StepNav({ onBack, onCancel, onNext, nextDisabled }: {
  onBack?: () => void; onCancel: () => void; onNext: () => void; nextDisabled?: boolean;
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <Button onClick={onNext} disabled={nextDisabled}>Continue</Button>
      {onBack && <Button variant="ghost" onClick={onBack}>Back</Button>}
      <Button variant="ghost" onClick={onCancel}>Cancel</Button>
    </div>
  );
}
