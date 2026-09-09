import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/auth/callback")({
  ssr: false,
  validateSearch: z.object({
    token_hash: z.string().optional(),
    type: z.string().optional(),
    code: z.string().optional(),
    error_description: z.string().optional(),
    next: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Signing you in | Intearior" },
      { name: "description", content: "Completing your Intearior sign-in." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const { token_hash, type, code, error_description, next } = Route.useSearch();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "failed">("working");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (error_description) throw new Error(error_description);

        // 1. Email links carrying a token hash verify without any browser state.
        if (token_hash) {
          const otpType = (type === "recovery" || type === "invite" || type === "signup" || type === "email_change"
            ? type
            : "magiclink") as "recovery" | "invite" | "signup" | "email_change" | "magiclink";
          const { error } = await supabase.auth.verifyOtp({ token_hash, type: otpType });
          if (error) throw error;
        } else if (code) {
          // 2. PKCE links: exchange only works in the browser that requested it.
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // 3. Implicit links put the tokens in the URL fragment.
          const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const access_token = hash.get("access_token");
          const refresh_token = hash.get("refresh_token");
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
          }
        }

        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error("This sign-in link has expired or was already used.");
        if (!cancelled) navigate({ to: next && next.startsWith("/") ? next : "/dashboard", replace: true });
      } catch (e) {
        if (cancelled) return;
        setMessage(e instanceof Error ? e.message : "This sign-in link didn't work.");
        setStatus("failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token_hash, type, code, error_description, next, navigate]);

  if (status === "working") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Signing you in…</h1>
        <p className="mt-2 text-sm text-muted-foreground">One moment while we finish setting up your session.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-3xl">That link didn't work</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message} Request a fresh link below.</p>
      <ResendLink />
      <p className="mt-6 text-xs"><Link to="/login" className="text-muted-foreground hover:underline">Back to sign in</Link></p>
    </div>
  );
}

function ResendLink() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send a new link");
    } finally {
      setBusy(false);
    }
  }

  if (sent) return <p className="mt-6 rounded-2xl border border-border bg-card p-4 text-sm">New link sent — check your email.</p>;

  return (
    <form onSubmit={send} className="mt-6 space-y-3 text-left">
      <Input type="email" required placeholder="you@studio.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit" disabled={busy} className="h-11 w-full">{busy ? "Sending…" : "Email me a new link"}</Button>
    </form>
  );
}
