import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SERVICES, STYLES, PROJECT_TYPES, BUDGET_BANDS } from "@/lib/cities";

const turn = z.object({ question: z.string().max(300), answer: z.string().max(400) });

const input = z.object({
  transcript: z.array(turn).max(12),
  citySlug: z.string().max(120).optional(),
});

export type MatchQuestion = {
  question: string;
  helper?: string;
  options: string[];
  multi: boolean;
  allowFreeText: boolean;
};

export type MatchCriteria = {
  priority: string;
  concerns: string[];
  styles: string[];
  projectType?: string;
  budget?: string;
  timing?: string;
  summary: string;
};

export type MatchStep =
  | { kind: "question"; step: MatchQuestion; progress: number }
  | { kind: "done"; criteria: MatchCriteria; progress: number };

const PRIORITIES = [
  "full-home", "kitchen-bath", "living-spaces", "workspace", "commercial", "furnishing", "virtual", "exploring",
];
const ROOMS = [
  "kitchen", "bathroom", "living-room", "dining-room", "bedroom", "home-office", "outdoor", "whole-home",
  "storage", "lighting", "window-treatments", "paint-color",
];

function systemPrompt() {
  return `You are the interview engine behind "Get Matched" on Intearior, an interior-design studio directory.

Your job: ask ONE short, well-targeted question at a time to understand a homeowner's or business owner's design project, then output structured matching criteria.

RULES
- Ask at most 6 questions in total, then finish.
- Never repeat a question or ask something already answered or implied by earlier answers.
- Each question must be conditioned on prior answers (e.g. don't ask about kitchen cabinetry if they only want furniture styling; don't ask about rooms for a commercial fit-out — ask about the space type instead).
- Questions must be plain-English, friendly, one sentence, no jargon.
- Give 3-7 concrete answer options. Set "multi" true only when several answers genuinely make sense together.
- Cover, in a sensible adaptive order: what they want designed, the specific spaces or scope, the look they're drawn to, budget, and timeline. Skip anything already known.
- Do NOT ask about location — the site already handles city selection.

OUTPUT: strict JSON only.
While interviewing:
{"done":false,"question":"...","helper":"optional one-line clarifier","options":["...","..."],"multi":false,"allowFreeText":true}
When finished (after enough signal, max 6 questions):
{"done":true,"criteria":{"priority":"<one of: ${PRIORITIES.join(", ")}>","concerns":["<subset of: ${ROOMS.join(", ")}>"],"styles":["<subset of: ${STYLES.map((s) => s.slug).join(", ")}>"],"projectType":"<one of: ${PROJECT_TYPES.map((p) => p.slug).join(", ")}>","budget":"<one of: ${BUDGET_BANDS.map((b) => b.slug).join(", ")}>","timing":"<one of: asap, 1-3-months, 3-6-months, planning>","summary":"one warm sentence describing their project"}}

Available studio services for reference: ${SERVICES.map((s) => s.slug).join(", ")}.`;
}

async function callAI(messages: Array<{ role: string; content: string }>) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      response_format: { type: "json_object" },
    }),
  });
  if (res.status === 429) throw new Error("Our matching assistant is busy right now — please try again in a moment.");
  if (res.status === 402) throw new Error("Matching is temporarily unavailable. Please try again later.");
  if (!res.ok) throw new Error(`Matching failed (${res.status})`);
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = body.choices?.[0]?.message?.content ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Matching failed — unexpected response");
  return JSON.parse(match[0]) as Record<string, unknown>;
}

const FALLBACK: MatchQuestion = {
  question: "What would you like designed?",
  helper: "Pick the closest fit — we'll narrow it down next.",
  options: [
    "My whole home",
    "A kitchen or bathroom",
    "Living, dining or bedroom",
    "A home office or workspace",
    "A commercial or hospitality space",
    "Furniture and styling only",
  ],
  multi: false,
  allowFreeText: true,
};

function clean(list: unknown, allowed: string[]): string[] {
  if (!Array.isArray(list)) return [];
  return list.map(String).filter((v) => allowed.includes(v));
}

export const nextMatchStep = createServerFn({ method: "POST" })
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data }): Promise<MatchStep> => {
    const progress = Math.min(95, Math.round((data.transcript.length / 6) * 100));

    if (data.transcript.length === 0) {
      return { kind: "question", step: FALLBACK, progress: 0 };
    }

    const convo = data.transcript.map((t) => `Q: ${t.question}\nA: ${t.answer}`).join("\n\n");
    const obj = await callAI([
      { role: "system", content: systemPrompt() },
      {
        role: "user",
        content: `Conversation so far:\n\n${convo}\n\n${
          data.citySlug && data.citySlug !== "any" ? `They are searching in city slug "${data.citySlug}".` : "They have not picked a city."
        }\n\nReturn the next question, or the final criteria if you have enough (you have asked ${data.transcript.length} of a maximum 6 questions).`,
      },
    ]);

    if (obj.done === true) {
      const c = (obj.criteria ?? {}) as Record<string, unknown>;
      const priority = PRIORITIES.includes(String(c.priority)) ? String(c.priority) : "exploring";
      const criteria: MatchCriteria = {
        priority,
        concerns: clean(c.concerns, ROOMS),
        styles: clean(c.styles, STYLES.map((s) => s.slug)),
        projectType: PROJECT_TYPES.some((p) => p.slug === c.projectType) ? String(c.projectType) : undefined,
        budget: BUDGET_BANDS.some((b) => b.slug === c.budget) ? String(c.budget) : undefined,
        timing: ["asap", "1-3-months", "3-6-months", "planning"].includes(String(c.timing)) ? String(c.timing) : undefined,
        summary: typeof c.summary === "string" ? c.summary.slice(0, 240) : "Your project",
      };
      return { kind: "done", criteria, progress: 100 };
    }

    const options = Array.isArray(obj.options) ? obj.options.map(String).slice(0, 8) : [];
    const step: MatchQuestion = {
      question: typeof obj.question === "string" && obj.question ? obj.question : FALLBACK.question,
      helper: typeof obj.helper === "string" ? obj.helper : undefined,
      options: options.length ? options : FALLBACK.options,
      multi: obj.multi === true,
      allowFreeText: obj.allowFreeText !== false,
    };
    return { kind: "question", step, progress };
  });
