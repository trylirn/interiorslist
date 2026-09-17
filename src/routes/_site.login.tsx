import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { submitPublicBusiness } from "@/lib/submissions.functions";

const PENDING_BUSINESS_KEY = "intearior-pending-business";

export const Route = createFileRoute("/_site/login")({
  head: () => ({ meta: [{ title: "Sign in | Intearior" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { tab } = useSearch({ strict: false }) as { tab?: string };
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <h1 className="font-display text-4xl">Welcome to Intearior</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browsing is free — no account needed. Accounts are for design studios: register your business, claim your listing, and manage your profile.
        </p>
      </div>
      <Tabs key={tab ?? "signin"} defaultValue={tab === "business" ? "business" : "signin"} className="mt-8">
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
  const [mode, setMode] = useState<"link" | "password">("link");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (sendingRef.current) return;
    sendingRef.current = true;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        const msg = error.message || "";
        const wait = Number(msg.match(/after (\d+) seconds/)?.[1] ?? 0);
        // A rate-limit response means an email was already sent moments ago —
        // treat it as success and show the code screen with a cooldown.
        if (error.status === 429 || /security purposes|rate limit/i.test(msg)) {
          setCooldown(wait || 60);
          setSent(true);
          toast.info(`We already sent an email to ${email}. Check your inbox.`);
          return;
        }
        throw error;
      }
      setCooldown(60);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send sign-in link");
    } finally {
      sendingRef.current = false;
      setLoading(false);
    }
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally { setLoading(false); }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length < 6) { toast.error("Enter the code from the email"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (error) throw error;
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That code didn't work — request a new one.");
    } finally { setLoading(false); }
  }


  if (sent) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
        <h2 className="font-display text-2xl">Check your email</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a one-click sign-in link to <span className="font-medium text-foreground">{email}</span>. It's valid for 1 hour and works on any device — but it can only be used once, so open it yourself rather than forwarding it.
        </p>
        <form onSubmit={verifyCode} className="mt-5 space-y-3 text-left">
          <Label htmlFor="otp-code">Or enter the code from that email</Label>
          <Input
            id="otp-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            placeholder="12345678"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
            className="h-12 text-center text-xl tracking-[0.4em]"
          />
          <Button type="submit" disabled={loading || code.length < 6} className="h-11 w-full">
            {loading ? "Checking…" : "Sign in with code"}
          </Button>
        </form>
        <Button
          variant="ghost"
          className="mt-3 h-11 w-full"
          disabled={loading || cooldown > 0}
          onClick={(e) => sendLink(e as unknown as React.FormEvent)}
        >
          {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend email"}
        </Button>
        <Button variant="outline" className="mt-1 h-11 w-full" onClick={() => { setSent(false); setCode(""); }}>Use a different email</Button>

      </div>
    );
  }


  return (
    <div className="mx-auto max-w-md space-y-4">
      {mode === "link" ? (
        <form onSubmit={sendLink} className="space-y-3">
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <Button type="submit" disabled={loading} className="h-11 w-full">{loading ? "Sending…" : "Email me a sign-in link"}</Button>
          <p className="text-center text-xs text-muted-foreground">No password needed — we'll email you a one-click link.</p>
          <button type="button" onClick={() => setMode("password")} className="w-full text-center text-xs text-muted-foreground hover:underline">
            Sign in with password instead
          </button>
        </form>
      ) : (
        <form onSubmit={signIn} className="space-y-3">
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Password</Label><Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" disabled={loading} className="h-11 w-full">{loading ? "…" : "Sign in"}</Button>
          <button type="button" onClick={() => setMode("link")} className="w-full text-center text-xs text-muted-foreground hover:underline">
            Email me a sign-in link instead
          </button>
        </form>
      )}
    </div>
  );
}





function BusinessSignupWizard() {
  const navigate = useNavigate();
  const submitBusiness = submitPublicBusiness;
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    businessName: "", city: "", address: "", website: "", phone: "",
    contactName: "", contactRole: "", email: "", password: "",
    notes: "",
  });

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function rememberBusinessDetails() {
    window.localStorage.setItem(PENDING_BUSINESS_KEY, JSON.stringify({
      businessName: form.businessName,
      city: form.city,
      address: form.address,
      website: form.website,
      contactEmail: form.email.toLowerCase(),
      contactPhone: form.phone,
      notes: form.notes,
    }));
  }

  /** Save the pending submission before the user leaves to activate their email. */
  async function saveBusinessDetails(userId: string) {
    await submitBusiness({
      data: {
        businessName: form.businessName,
        city: form.city,
        address: form.address,
        website: form.website,
        contactEmail: form.email,
        contactPhone: form.phone,
        notes: form.notes,
        userId,
      },
    });
    window.localStorage.removeItem(PENDING_BUSINESS_KEY);
    await supabase.from("profiles").update({
      account_type: "business",
      contact_name: form.contactName || null,
      business_role: form.contactRole || null,
      phone: form.phone || null,
    }).eq("id", userId);
  }

  /** Last resort: email the person a sign-in link so they always get an account. */
  async function fallbackToEmailLink(reason?: string) {
    rememberBusinessDetails();
    try {
      await submitBusiness({
        data: {
          businessName: form.businessName,
          city: form.city,
          address: form.address,
          website: form.website,
          contactEmail: form.email,
          contactPhone: form.phone,
          notes: form.notes,
        },
      });
    } catch (e) {
      console.error("business submission failed", e);
    }
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { display_name: form.contactName || form.businessName, account_type: "business" },
      },
    });
    if (otpErr && !/security purposes|rate limit/i.test(otpErr.message || "")) {
      const msg = reason || otpErr.message || "We couldn't finish sign-up.";
      setError(msg);
      toast.error(msg);
      return false;
    }
    toast.success(`We emailed a sign-in link to ${form.email}. Open it to finish setting up your studio.`);
    navigate({ to: "/" });
    return true;
  }

  async function submit() {
    setError(null);
    if (!form.contactName.trim()) { setError("Please enter your name."); toast.error("Please enter your name."); return; }
    if (!form.email.trim()) { setError("Please enter your account email."); toast.error("Please enter your account email."); return; }
    setBusy(true);
    try {
      const hasPassword = form.password.length >= 8;
      if (!hasPassword) {
        await fallbackToEmailLink();
        return;
      }

      const { data: signUp, error: suErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { display_name: form.contactName || form.businessName, account_type: "business" },
        },
      });

      if (suErr) {
        const m = suErr.message || "";
        if (/already registered|already exists|user already/i.test(m)) {
          toast.info("That email already has an account — we've emailed you a sign-in link.");
          await fallbackToEmailLink();
          return;
        }
        // Anything else (weak/breached password, rate limits, provider hiccups):
        // fall back to a passwordless account so nobody is ever turned away.
        await fallbackToEmailLink(m);
        return;
      }

      const userId = signUp.user?.id;
      if (!userId) { await fallbackToEmailLink(); return; }

      rememberBusinessDetails();
      await saveBusinessDetails(userId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.success("Account created. Check your email to confirm, then sign in to finish your studio profile.");
        navigate({ to: "/" });
        return;
      }

      toast.success("Business account created. We'll review your studio shortly.");
      navigate({ to: "/dashboard" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sign-up hit a snag.";
      const recovered = await fallbackToEmailLink(msg);
      if (!recovered) setError(msg);
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-6 md:p-8">
      <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <span className={step >= 1 ? "text-brand font-semibold" : ""}>1 · Business</span>
        <span>·</span>
        <span className={step >= 2 ? "text-brand font-semibold" : ""}>2 · Account</span>
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
          <div className="space-y-1.5"><Label>Your name *</Label><Input required value={form.contactName} onChange={(e) => update("contactName", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Your role at the business</Label><Input value={form.contactRole} onChange={(e) => update("contactRole", e.target.value)} placeholder="Owner, Principal Designer, Manager…" /></div>
          <div className="space-y-1.5"><Label>Account email *</Label><Input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Password</Label><Input type="password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} /><p className="text-[11px] text-muted-foreground">Optional — leave blank and we'll email you a one-click sign-in link instead.</p></div>
          <div className="space-y-1.5"><Label>Anything else?</Label><Textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></div>
          {error && (
            <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
          )}
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">← Back</Button>
            <Button onClick={submit} disabled={busy} className="flex-1 h-11">{busy ? "Creating…" : "Create business account"}</Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">We'll review your studio before publishing your listing.</p>
        </div>
      )}
    </div>
  );
}
