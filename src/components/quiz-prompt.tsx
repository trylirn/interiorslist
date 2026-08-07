import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Non-intrusive prompt that nudges visitors toward the matching quiz.
// Rules:
//  - never collects an email
//  - permanently suppressed once dismissed or once the visitor starts the quiz
//  - suppressed for 30 days after it is simply ignored
//  - rotates the message so returning visitors never see the same pitch twice
const KEY = "dm_quiz_prompt_v1";

type State = { dismissed?: boolean; snoozeUntil?: number; seen?: number };

const MESSAGES = [
  {
    title: "Not sure where to start?",
    body: "Answer 5 quick questions and we'll shortlist design studios that fit your goals, budget and city.",
    cta: "Find my match",
  },
  {
    title: "Welcome back",
    body: "New studios were added since your last visit. Get a fresh shortlist tailored to your project.",
    cta: "See my matches",
  },
  {
    title: "Still comparing?",
    body: "Skip the scrolling — tell us your project and we'll rank the closest, best-reviewed studios for you.",
    cta: "Rank them for me",
  },
];

const HIDDEN_PREFIXES = ["/match", "/login", "/dashboard", "/admin", "/claim", "/review", "/submit"];

function read(): State {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as State;
  } catch {
    return {};
  }
}

function write(next: State) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — prompt simply reappears next session */
  }
}

export function QuizPrompt() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState(0);

  useEffect(() => {
    if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return;
    const state = read();
    if (state.dismissed) return;
    if (state.snoozeUntil && Date.now() < state.snoozeUntil) return;

    const seen = state.seen ?? 0;
    setVariant(seen % MESSAGES.length);
    const t = window.setTimeout(() => setOpen(true), 12000);
    return () => window.clearTimeout(t);
  }, [pathname]);

  function close(permanent: boolean) {
    setOpen(false);
    const state = read();
    write(
      permanent
        ? { ...state, dismissed: true }
        : { ...state, seen: (state.seen ?? 0) + 1, snoozeUntil: Date.now() + 30 * 24 * 60 * 60 * 1000 },
    );
  }

  if (!open) return null;
  const m = MESSAGES[variant]!;

  return (
    <div
      role="dialog"
      aria-label="Get matched with a design studio"
      className="fixed bottom-4 left-4 z-40 w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-border bg-card p-5 shadow-lg sm:bottom-6 sm:left-6"
    >
      <button
        type="button"
        onClick={() => close(false)}
        aria-label="Close"
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10">
        <Sparkles className="h-4 w-4 text-brand" />
      </div>
      <h2 className="mt-3 font-display text-lg">{m.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{m.body}</p>
      <div className="mt-4 flex items-center gap-2">
        <Button asChild size="sm" className="rounded-full" onClick={() => close(true)}>
          <Link to="/match">{m.cta}</Link>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => close(true)}>
          No thanks
        </Button>
      </div>
    </div>
  );
}
