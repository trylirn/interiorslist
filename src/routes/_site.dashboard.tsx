import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_site/dashboard")({
  head: () => ({ meta: [{ title: "Account | TexasInjectors" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
  }, []);
  if (!email) return (
    <div className="mx-auto max-w-md py-24 text-center px-4">
      <h1 className="font-display text-3xl">Please sign in</h1>
      <Button asChild className="mt-6"><Link to="/login">Sign in</Link></Button>
    </div>
  );
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-display text-4xl">Your account</h1>
      <p className="mt-3 text-muted-foreground">Signed in as <span className="font-medium text-foreground">{email}</span></p>
      <div className="mt-8 space-y-3">
        <Button asChild variant="outline"><Link to="/favorites">View favorites</Link></Button>
        <Button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} variant="outline" className="ml-2">Sign out</Button>
      </div>
    </div>
  );
}
