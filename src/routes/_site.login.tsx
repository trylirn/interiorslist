import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/login")({
  head: () => ({ meta: [{ title: "Sign in | Intearior" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <h1 className="font-display text-4xl">Welcome to Intearior</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browsing is free — no account needed. Accounts are for design studios: register your business, claim your listing, and manage your profile.
        </p>
      </div>
      <Tabs defaultValue="signin" className="mt-8">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="business">Create account</TabsTrigger>
        </TabsList>
        <TabsContent value="signin" className="mt-6"><SignInPanel /></TabsContent>
        <TabsContent value="business" className="mt-6"><BusinessSignupWizard /></TabsContent>
      </Tabs>

      <div className="mx-auto mt-6 max-w-md rounded-2xl border border-border bg-secondary/40 p-4 text-center text-sm">
        Are you a professional?{" "}
        <Link to="/claim" className="font-medium text-brand hover:underline">Claim your profile →</Link>
        <p className="mt-1 text-xs text-muted-foreground">No account needed — just submit your claim and our team follows up.</p>
      </div>

      <p className="mt-6 text-center text-xs"><Link to="/" className="text-muted-foreground hover:underline">← Back home</Link></p>
    </div>
  );
}

function SignInPanel() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/welcome" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error("Google sign-in failed");
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Button onClick={handleGoogle} variant="outline" className="h-11 w-full">Continue with Google</Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or email<div className="h-px flex-1 bg-border" /></div>
      <form onSubmit={signIn} className="space-y-3">
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Password</Label><Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" disabled={loading} className="w-full h-11">{loading ? "…" : "Sign in"}</Button>
      </form>
    </div>
  );
}




const LICENSE_TYPES = ["ASID", "NCIDQ", "IIDA", "Licensed Interior Designer", "Design Principal", "Other"];

function BusinessSignupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    businessName: "", city: "", address: "", website: "", phone: "",
    licenseType: "", licenseNumber: "", npi: "",
    contactName: "", contactRole: "", email: "", password: "",
    notes: "",
  });
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setBusy(true);
    try {
      const { data: signUp, error: suErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/welcome`,
          data: { display_name: form.contactName || form.businessName, account_type: "business" },
        },
      });
      if (suErr) throw suErr;
      const userId = signUp.user?.id;
      if (!userId) throw new Error("Signup failed");

      // Optional license doc upload (folder must equal userId per storage RLS)
      let licensePath: string | null = null;
      if (licenseFile) {
        const ext = licenseFile.name.split(".").pop() ?? "pdf";
        licensePath = `${userId}/license-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("business-docs").upload(licensePath, licenseFile);
        if (upErr) {
          // Non-fatal: keep the account, surface the issue
          toast.error("License upload failed — you can add it later from your dashboard.");
          licensePath = null;
        }
      }

      // Wait for session to ensure RLS-authenticated insert works
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.success("Account created. Please check your email to confirm, then sign in to complete your submission.");
        navigate({ to: "/" });
        return;
      }

      const { error: subErr } = await supabase.from("submissions").insert({
        business_name: form.businessName,
        city: form.city,
        address: form.address || null,
        website: form.website || null,
        contact_email: form.email,
        contact_phone: form.phone || null,
        notes: form.notes || null,
        license_type: form.licenseType || null,
        license_number: form.licenseNumber || null,
        license_doc_path: licensePath,
        npi: form.npi || null,
        submitted_by: userId,
      });
      if (subErr) throw subErr;

      await supabase.from("profiles").update({
        account_type: "business",
        contact_name: form.contactName || null,
        business_role: form.contactRole || null,
        phone: form.phone || null,
      }).eq("id", userId);

      toast.success("Business account created. We'll review your submission shortly.");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Signup failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-6 md:p-8">
      <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <span className={step >= 1 ? "text-brand font-semibold" : ""}>1 · Business</span>
        <span>·</span>
        <span className={step >= 2 ? "text-brand font-semibold" : ""}>2 · Credentials</span>
        <span>·</span>
        <span className={step >= 3 ? "text-brand font-semibold" : ""}>3 · Account</span>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Business name *</Label><Input required value={form.businessName} onChange={(e) => update("businessName", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>City *</Label><Input required value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Houston, Dallas, Austin…" /></div>
          <div className="space-y-1.5"><Label>Address</Label><Input value={form.address} onChange={(e) => update("address", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Website</Label><Input type="url" value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://…" /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} /></div>
          <Button onClick={() => setStep(2)} disabled={!form.businessName || !form.city} className="w-full h-11 mt-2">Next →</Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Intearior features professional design studios. You can add credentials now or later from your dashboard — none of this is required to create your account.
          </p>
          <div className="space-y-1.5">
            <Label>Credential type</Label>
            <Select value={form.licenseType} onValueChange={(v) => update("licenseType", v)}>
              <SelectTrigger><SelectValue placeholder="Select (optional)…" /></SelectTrigger>
              <SelectContent>{LICENSE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Credential number</Label><Input value={form.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Business license #</Label><Input value={form.npi} onChange={(e) => update("npi", e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Credential document (PDF or image)</Label>
            <Input type="file" accept=".pdf,image/*" onChange={(e) => setLicenseFile(e.target.files?.[0] ?? null)} />
            {licenseFile && <p className="text-xs text-muted-foreground">{licenseFile.name}</p>}
            <p className="text-[11px] text-muted-foreground">Optional — speeds up listing approval.</p>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">← Back</Button>
            <Button onClick={() => setStep(3)} className="flex-1 h-11">Next →</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Your name *</Label><Input required value={form.contactName} onChange={(e) => update("contactName", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Your role at the business</Label><Input value={form.contactRole} onChange={(e) => update("contactRole", e.target.value)} placeholder="Owner, Principal Designer, Manager…" /></div>
          <div className="space-y-1.5"><Label>Account email *</Label><Input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Password *</Label><Input type="password" required minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Anything else?</Label><Textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-11">← Back</Button>
            <Button onClick={submit} disabled={busy} className="flex-1 h-11">{busy ? "Creating…" : "Create business account"}</Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">We'll verify your credentials before publishing your listing.</p>
        </div>
      )}
    </div>
  );
}
