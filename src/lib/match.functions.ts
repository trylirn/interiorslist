import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const matchInput = z.object({
  priority: z.string().min(1).max(60),
  concerns: z.array(z.string().min(1).max(60)).max(8).optional(),
  citySlug: z.string().max(80).optional(),
  budget: z.string().max(40).optional(),
  timing: z.string().max(40).optional(),
  preferences: z.array(z.string().min(1).max(40)).max(8).optional(),
});

const BUDGET_ORDER = ["budget", "moderate", "premium", "flexible"] as const;

// Map "concern" → service slugs that satisfy it
export const CONCERN_TREATMENTS: Record<string, string[]> = {
  wrinkles: ["botox", "dysport", "xeomin", "jeuveau", "fillers"],
  "lip-volume": ["lip-filler", "fillers"],
  volume: ["fillers", "sculptra", "lip-filler", "cheek-filler"],
  jawline: ["jawline-filler", "fillers", "kybella", "skin-tightening", "morpheus8"],
  lips: ["lip-filler"],
  "acne-scars": ["microneedling", "morpheus8", "chemical-peels", "prp", "laser-resurfacing"],
  pigmentation: ["ipl-photofacial", "bbl", "chemical-peels", "halo-laser", "microneedling"],
  "hair-loss": ["prp-hair", "prp"],
  glow: ["hydrafacial", "microneedling", "chemical-peels", "dermaplaning", "iv-therapy"],
  "body-contouring": ["coolsculpting", "emsculpt", "kybella", "body-contouring", "skin-tightening"],
};

const PRIORITY_TREATMENTS: Record<string, string[]> = {
  botox: ["botox", "dysport", "xeomin", "jeuveau"],
  fillers: ["fillers", "lip-filler", "cheek-filler", "jawline-filler", "sculptra"],
  skin: ["microneedling", "morpheus8", "chemical-peels", "hydrafacial", "prp", "laser-resurfacing"],
  body: ["coolsculpting", "emsculpt", "kybella", "body-contouring", "sculptra"],
  laser: ["laser-hair-removal", "ipl-photofacial", "bbl", "halo-laser", "laser-resurfacing"],
  wellness: ["iv-therapy", "weight-loss", "hormone-therapy"],
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
        "place_id, slug, name, city, city_slug, address, services, specialists, notes, branch_label, brand_id, is_verified, badges, price_ranges, rating, review_count",
      );
    if (data.citySlug && data.citySlug !== "any") q = q.eq("city_slug", data.citySlug);
    const { data: rows, error } = await q.limit(200);
    if (error) throw new Error(error.message);

    const prefs = new Set(data.preferences ?? []);
    const budget = data.budget && BUDGET_ORDER.includes(data.budget as any) ? data.budget : undefined;

    const scored = (rows ?? [])
      .map((p: any) => {
        let score = 0;
        const services = (p.services ?? []) as string[];
        for (const s of services) if (wantedServices.has(s)) score += 25;
        const blob = `${p.specialists ?? ""} ${p.notes ?? ""}`.toLowerCase();
        for (const kw of wantedKeywords) if (kw && blob.includes(kw)) score += 8;
        if (p.is_verified) score += 5;
        if (p.brand_id) score += 3;

        // Budget fit — providers that published pricing in the requested tier rank higher
        if (budget && budget !== "flexible") {
          const pr = p.price_ranges;
          const tier = pr && typeof pr === "object" ? String(pr.tier ?? "").toLowerCase() : "";
          if (tier && tier === budget) score += 12;
          else if (tier) score -= 4;
          else if (pr) score += 2;
        }

        // Preferences
        if (prefs.has("verified-only") && p.is_verified) score += 10;
        if (prefs.has("highly-rated") && (p.rating ?? 0) >= 4.5) score += 10;
        if (prefs.has("well-reviewed") && (p.review_count ?? 0) >= 50) score += 8;
        if (prefs.has("boutique") && !p.brand_id) score += 6;
        if (prefs.has("medical-director") && `${p.specialists ?? ""}`.toLowerCase().match(/\b(md|do|physician|dermatolog)/)) score += 8;

        return { ...p, score };
      })
      .filter((p: any) => !(prefs.has("verified-only") && !p.is_verified))
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 9);

    const max = scored[0]?.score || 1;
    const matches = scored.map((m) => ({
      ...m,
      matchPercent: Math.min(99, Math.max(55, Math.round((m.score / max) * 95) + 5)),
    }));

    return { matches };
  });
