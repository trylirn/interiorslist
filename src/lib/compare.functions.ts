import { fail } from "@/lib/errors";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const COLS =
  "place_id, slug, name, city, city_slug, address, website, specialists, credentials, services, services_raw, branch_label, is_verified, claimed_by_internal:claimed_by, rating, review_count, hero_photo_url, skin_types, recovery_tags, price_ranges, typical_project_budget, hours, social_links";

export const getProvidersByIds = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ ids: z.array(z.string().min(1).max(200)).min(1).max(3) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("providers")
      .select(COLS)
      .in("place_id", data.ids)
      .eq("published", true);
    if (error) fail(error);
    const safe = (rows ?? []).map(({ claimed_by_internal, ...rest }) => ({
      ...rest,
      is_claimed: !!claimed_by_internal,
    }));
    return { providers: safe };
  });
