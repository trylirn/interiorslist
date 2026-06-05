import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const COLS =
  "place_id, slug, name, city, city_slug, address, website, phone, specialists, credentials, services, services_raw, branch_label, is_verified, claimed_by, rating, review_count, hero_photo_url, skin_types, recovery_tags, price_ranges, hours, social_links";

export const getProvidersByIds = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ ids: z.array(z.string().min(1).max(200)).min(1).max(3) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("providers")
      .select(COLS)
      .in("place_id", data.ids);
    if (error) throw new Error(error.message);
    return { providers: rows ?? [] };
  });
