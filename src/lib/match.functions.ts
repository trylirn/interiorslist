import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const matchInput = z.object({
  priority: z.string().min(1).max(60),
  concerns: z.array(z.string().min(1).max(60)).max(8).optional(),
  citySlug: z.string().max(80).optional(),
  budget: z.string().max(40).optional(),
  timing: z.string().max(40).optional(),
});

// Map "concern" → service slugs that satisfy it
export const CONCERN_TREATMENTS: Record<string, string[]> = {
  wrinkles: ["botox", "fillers"],
  volume: ["fillers", "sculptra", "lip-filler"],
  jawline: ["fillers", "kybella"],
  lips: ["lip-filler"],
  "acne-scars": ["microneedling", "chemical-peels", "prp"],
  pigmentation: ["chemical-peels", "microneedling"],
  "hair-loss": ["prp"],
  glow: ["microneedling", "chemical-peels", "iv-therapy"],
};

const PRIORITY_TREATMENTS: Record<string, string[]> = {
  botox: ["botox"],
  fillers: ["fillers", "lip-filler", "sculptra"],
  skin: ["microneedling", "chemical-peels", "prp"],
  body: ["kybella", "sculptra"],
  wellness: ["iv-therapy"],
  exploring: [],
};

export const getMatches = createServerFn({ method: "POST" })
  .inputValidator((d) => matchInput.parse(d))
  .handler(async ({ data }) => {
    const wantedServices = new Set<string>([
      ...(PRIORITY_TREATMENTS[data.priority] ?? []),
      ...(data.concerns ?? []).flatMap((c) => CONCERN_TREATMENTS[c] ?? []),
    ]);
    const wantedKeywords = [data.priority, ...(data.concerns ?? [])].map((s) =>
      s.toLowerCase().replace(/-/g, " "),
    );

    let q = supabaseAdmin
      .from("providers")
      .select(
        "place_id, slug, name, city, city_slug, address, services, specialists, notes, branch_label, brand_id, is_verified, badges",
      );
    if (data.citySlug && data.citySlug !== "any") q = q.eq("city_slug", data.citySlug);
    const { data: rows, error } = await q.limit(200);
    if (error) throw new Error(error.message);

    const scored = (rows ?? [])
      .map((p) => {
        let score = 0;
        const services = (p.services ?? []) as string[];
        for (const s of services) if (wantedServices.has(s)) score += 25;
        const blob = `${p.specialists ?? ""} ${p.notes ?? ""}`.toLowerCase();
        for (const kw of wantedKeywords) if (kw && blob.includes(kw)) score += 8;
        if (p.is_verified) score += 5;
        if (p.brand_id) score += 3;
        return { ...p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const max = scored[0]?.score || 1;
    const matches = scored.map((m) => ({
      ...m,
      matchPercent: Math.min(99, Math.max(55, Math.round((m.score / max) * 95) + 5)),
    }));

    return { matches };
  });
