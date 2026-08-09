import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const matchInput = z.object({
  priority: z.string().min(1).max(60),
  concerns: z.array(z.string().min(1).max(60)).max(12).optional(),
  citySlug: z.string().max(80).optional(),
  budget: z.string().max(40).optional(),
  timing: z.string().max(40).optional(),
  preferences: z.array(z.string().min(1).max(40)).max(12).optional(),
  styles: z.array(z.string().min(1).max(40)).max(6).optional(),
  projectType: z.string().max(40).optional(),
});

const BUDGET_TIER: Record<string, string> = {
  "under-10k": "budget",
  "10-25k": "budget",
  "25-75k": "moderate",
  "75-150k": "premium",
  "150k-plus": "premium",
  "not-sure": "flexible",
};

// Which services best express a given design style
export const STYLE_SERVICES: Record<string, string[]> = {
  modern: ["full-home-design", "space-planning", "lighting-design", "furniture-sourcing"],
  "mid-century": ["living-dining", "furniture-sourcing", "color-consultation", "full-home-design"],
  traditional: ["full-home-design", "custom-millwork", "window-treatments", "living-dining"],
  transitional: ["full-home-design", "living-dining", "kitchen-design", "furniture-sourcing"],
  farmhouse: ["kitchen-design", "custom-millwork", "full-home-design", "bathroom-design"],
  industrial: ["commercial-office", "space-planning", "lighting-design", "renovation-management"],
  coastal: ["living-dining", "bedroom-design", "outdoor-patio", "color-consultation"],
  minimalist: ["space-planning", "custom-millwork", "full-home-design", "lighting-design"],
  maximalist: ["color-consultation", "window-treatments", "living-dining", "furniture-sourcing"],
  scandinavian: ["full-home-design", "bedroom-design", "lighting-design", "space-planning"],
  eclectic: ["living-dining", "furniture-sourcing", "color-consultation", "home-office"],
  "contemporary-luxury": ["full-home-design", "custom-millwork", "renovation-management", "lighting-design"],
};

// Which services satisfy a given room / need
export const ROOM_SERVICES: Record<string, string[]> = {
  kitchen: ["kitchen-design", "custom-millwork", "renovation-management", "lighting-design"],
  bathroom: ["bathroom-design", "renovation-management", "custom-millwork"],
  "living-room": ["living-dining", "furniture-sourcing", "space-planning"],
  bedroom: ["bedroom-design", "window-treatments", "furniture-sourcing"],
  "dining-room": ["living-dining", "lighting-design", "furniture-sourcing"],
  "home-office": ["home-office", "space-planning", "custom-millwork"],
  outdoor: ["outdoor-patio", "furniture-sourcing"],
  "whole-home": ["full-home-design", "space-planning", "renovation-management"],
  storage: ["custom-millwork", "space-planning"],
  lighting: ["lighting-design"],
  "window-treatments": ["window-treatments"],
  "paint-color": ["color-consultation"],
};

const PRIORITY_SERVICES: Record<string, string[]> = {
  "full-home": ["full-home-design", "space-planning", "renovation-management", "furniture-sourcing"],
  "kitchen-bath": ["kitchen-design", "bathroom-design", "custom-millwork", "renovation-management"],
  "living-spaces": ["living-dining", "bedroom-design", "furniture-sourcing", "window-treatments"],
  workspace: ["home-office", "space-planning", "custom-millwork"],
  commercial: ["commercial-office", "retail-hospitality", "space-planning"],
  furnishing: ["furniture-sourcing", "home-staging", "color-consultation", "window-treatments"],
  virtual: ["e-design", "color-consultation", "space-planning"],
  exploring: [],
};

export const getMatches = createServerFn({ method: "POST" })
  .inputValidator((d) => matchInput.parse(d))
  .handler(async ({ data }) => {
    const wantedServices = new Set<string>([
      ...(PRIORITY_SERVICES[data.priority] ?? []),
      ...(data.concerns ?? []).flatMap((c) => ROOM_SERVICES[c] ?? []),
      ...(data.styles ?? []).flatMap((s) => STYLE_SERVICES[s] ?? []),
    ]);
    const wantedKeywords = [data.priority, ...(data.concerns ?? []), ...(data.styles ?? [])].map((s) =>
      s.toLowerCase().replace(/-/g, " "),
    );

    let q = supabaseAdmin
      .from("providers")
      .select(
        "place_id, slug, name, city, city_slug, address, services, specialists, notes, branch_label, brand_id, is_verified, badges, price_ranges, rating, review_count, styles, project_types, price_tier, remote_services",
      );
    if (data.citySlug && data.citySlug !== "any") q = q.eq("city_slug", data.citySlug);
    const { data: rows, error } = await q.limit(200);
    if (error) throw new Error(error.message);

    const prefs = new Set(data.preferences ?? []);
    const wantedStyles = new Set(data.styles ?? []);
    const budgetTier = data.budget ? BUDGET_TIER[data.budget] : undefined;

    const scored = (rows ?? [])
      .map((p: Record<string, unknown>) => {
        let score = 0;
        const services = (p.services ?? []) as string[];
        for (const s of services) if (wantedServices.has(s)) score += 20;

        const styles = (p.styles ?? []) as string[];
        for (const s of styles) if (wantedStyles.has(s)) score += 18;

        const projectTypes = (p.project_types ?? []) as string[];
        if (data.projectType && projectTypes.includes(data.projectType)) score += 15;

        const blob = `${p.specialists ?? ""} ${p.notes ?? ""}`.toLowerCase();
        for (const kw of wantedKeywords) if (kw && blob.includes(kw)) score += 6;
        if (p.is_verified) score += 5;
        if (p.brand_id) score += 2;

        if (budgetTier && budgetTier !== "flexible") {
          const tier = String(p.price_tier ?? "").toLowerCase();
          if (tier && tier === budgetTier) score += 14;
          else if (tier) score -= 4;
        }

        if (prefs.has("verified-only") && p.is_verified) score += 10;
        if (prefs.has("highly-rated") && ((p.rating as number) ?? 0) >= 4.5) score += 10;
        if (prefs.has("well-reviewed") && ((p.review_count as number) ?? 0) >= 20) score += 8;
        if (prefs.has("boutique") && !p.brand_id) score += 6;
        if (prefs.has("remote-ok") && p.remote_services) score += 10;
        if (prefs.has("manages-build") && services.includes("renovation-management")) score += 10;
        if (prefs.has("certified") && `${p.specialists ?? ""} ${p.notes ?? ""}`.match(/NCIDQ|ASID|IIDA/i)) score += 8;

        const matchedServices = services.filter((s) => wantedServices.has(s));
        const matchedStyles = styles.filter((s) => wantedStyles.has(s));
        const matchedProjectType =
          data.projectType && projectTypes.includes(data.projectType) ? data.projectType : null;
        const budgetFit =
          budgetTier && budgetTier !== "flexible" && String(p.price_tier ?? "").toLowerCase() === budgetTier;

        return {
          ...p,
          score,
          matchedServices,
          matchedStyles,
          matchedProjectType,
          budgetFit: !!budgetFit,
        } as Record<string, unknown> & { score: number };
      })
      .filter((p) => !(prefs.has("verified-only") && !p.is_verified))
      .filter((p) => !(prefs.has("remote-ok") && data.citySlug === "any") || !!p.remote_services)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const max = scored[0]?.score || 1;
    const matches = scored.map((m) => ({
      ...(m as unknown as {
        place_id: string; slug: string; name: string; city: string; address: string | null;
        services: string[] | null; specialists: string | null; notes: string | null; branch_label: string | null;
        is_verified: boolean; rating: number | null; review_count: number | null;
        styles: string[] | null; project_types: string[] | null; price_tier: string | null;
        remote_services: boolean | null;
        matchedServices: string[]; matchedStyles: string[]; matchedProjectType: string | null; budgetFit: boolean;
      }),
      matchPercent: Math.min(99, Math.max(55, Math.round((m.score / max) * 95) + 5)),
    }));

    return { matches };
  });

