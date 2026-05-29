import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import seed from "@/data/providers-seed.json";

type SeedProvider = {
  place_id: string;
  slug: string;
  name: string;
  city: string;
  city_slug: string;
  state: string;
  address: string | null;
  website: string | null;
  specialists: string | null;
  credentials: string | null;
  services: string[];
  services_raw: string[];
  brand_name: string | null;
  branch_label: string | null;
};

type Seed = {
  brands: { slug: string; name: string }[];
  providers: SeedProvider[];
};

export const Route = createFileRoute("/api/public/admin-reseed")({
  server: {
    handlers: {
      POST: async () => {
        const data = seed as Seed;


        // Upsert brands
        const { error: be } = await supabaseAdmin
          .from("brands")
          .upsert(data.brands, { onConflict: "slug" });
        if (be) return Response.json({ stage: "brands", error: be.message }, { status: 500 });

        // Fetch brand id map
        const { data: brandRows } = await supabaseAdmin.from("brands").select("id, name");
        const brandMap = new Map((brandRows ?? []).map((b) => [b.name, b.id]));

        // Upsert providers in batches
        const rows = data.providers.map((p) => ({
          place_id: p.place_id,
          slug: p.slug,
          name: p.name,
          city: p.city,
          city_slug: p.city_slug,
          state: p.state,
          address: p.address,
          website: p.website,
          specialists: p.specialists,
          credentials: p.credentials,
          services: p.services,
          services_raw: p.services_raw,
          branch_label: p.branch_label,
          brand_id: p.brand_name ? brandMap.get(p.brand_name) ?? null : null,
          email: null,
          is_verified: true,
          business_status: "OPERATIONAL",
        }));

        let inserted = 0;
        for (let i = 0; i < rows.length; i += 25) {
          const slice = rows.slice(i, i + 25);
          const { error } = await supabaseAdmin
            .from("providers")
            .upsert(slice, { onConflict: "place_id" });
          if (error) {
            return Response.json(
              { stage: "providers", at: i, error: error.message },
              { status: 500 },
            );
          }
          inserted += slice.length;
        }

        // Clear emails just in case
        await supabaseAdmin.from("providers").update({ email: null }).not("email", "is", null);

        return Response.json({ ok: true, brands: data.brands.length, providers: inserted });
      },
    },
  },
});
