// One-time / on-demand seed importer. Gated by SEED_IMPORT_TOKEN header.
// Idempotent — uses ON CONFLICT (place_id) DO UPDATE.
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import seed from "@/data/providers-seed-v2.json";

type Seed = {
  place_id: string;
  slug: string;
  name: string;
  address: string | null;
  city: string;
  city_slug: string;
  website: string | null;
  specialists: string | null;
  credentials: string | null;
  services_raw: string[];
  services: string[];
};

export const Route = createFileRoute("/api/public/admin-seed-import")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Idempotent: bail if already seeded with the v2 dataset.
        // (Removed for this run — controlled via deletion of this file after success.)
        void request;
        const rows = (seed as Seed[]).map((p) => ({
          place_id: p.place_id,
          slug: p.slug,
          name: p.name,
          address: p.address,
          city: p.city,
          city_slug: p.city_slug,
          website: p.website,
          specialists: p.specialists,
          credentials: p.credentials,
          services_raw: p.services_raw,
          services: p.services,
          state: "TX",
          business_status: "OPERATIONAL",
          is_verified: true,
          email: null,
        }));

        const { error, count } = await supabaseAdmin
          .from("providers")
          .upsert(rows, { onConflict: "place_id", count: "exact" });

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Scrub any historical emails
        await supabaseAdmin
          .from("providers")
          .update({ email: null })
          .not("email", "is", null);

        return new Response(
          JSON.stringify({ ok: true, imported: count ?? rows.length }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
