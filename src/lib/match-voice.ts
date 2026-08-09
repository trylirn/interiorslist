/** Rewrites an AI-written brief summary into the client's own voice. */
export function toClientVoice(raw: string): string {
  let s = (raw ?? "").trim();
  if (!s) return "We're looking for an interior designer for our project.";

  // Strip narrator openings like "It sounds like you're exploring …"
  s = s.replace(/^(it\s+sounds\s+like|sounds\s+like|it\s+seems\s+like|you\s+are|you're)\s+/i, "");
  // Second person -> first person plural
  s = s
    .replace(/\byou're\b/gi, "we're")
    .replace(/\byou are\b/gi, "we are")
    .replace(/\byou've\b/gi, "we've")
    .replace(/\byou have\b/gi, "we have")
    .replace(/\byour\b/gi, "our")
    .replace(/\byours\b/gi, "ours")
    .replace(/\byou\b/gi, "we");

  if (!/^we['’]re looking for/i.test(s)) {
    s = s.replace(/^(we['’]re|we are)\s+/i, "");
    s = `We're looking for ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
  }
  s = s.charAt(0).toUpperCase() + s.slice(1);
  return s.slice(0, 240);
}
