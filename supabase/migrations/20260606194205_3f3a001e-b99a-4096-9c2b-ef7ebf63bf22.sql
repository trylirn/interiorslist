
-- 1. Add new columns
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS gallery_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS email_forward_to text;

-- 2. Dedupe providers by (lower(name), lower(city))
DO $$
DECLARE
  grp RECORD;
  survivor_id text;
  dup_ids text[];
BEGIN
  FOR grp IN
    SELECT lower(name) AS lname, lower(city) AS lcity
    FROM public.providers
    GROUP BY lower(name), lower(city)
    HAVING count(*) > 1
  LOOP
    -- Pick survivor: claimed first, then most non-null cols, then oldest
    SELECT place_id INTO survivor_id
    FROM public.providers
    WHERE lower(name) = grp.lname AND lower(city) = grp.lcity
    ORDER BY
      (claimed_by IS NOT NULL) DESC,
      (
        (address IS NOT NULL)::int + (phone IS NOT NULL)::int + (website IS NOT NULL)::int +
        (hero_photo_url IS NOT NULL)::int + (specialists IS NOT NULL)::int + (notes IS NOT NULL)::int +
        (rating IS NOT NULL)::int + COALESCE(array_length(services,1),0)
      ) DESC,
      created_at ASC
    LIMIT 1;

    SELECT array_agg(place_id) INTO dup_ids
    FROM public.providers
    WHERE lower(name) = grp.lname AND lower(city) = grp.lcity AND place_id <> survivor_id;

    -- Reassign children (use update with where not exists to dodge unique conflicts on favorites)
    UPDATE public.reviews SET provider_place_id = survivor_id WHERE provider_place_id = ANY(dup_ids);
    UPDATE public.claims SET provider_place_id = survivor_id WHERE provider_place_id = ANY(dup_ids);
    UPDATE public.contact_messages SET provider_place_id = survivor_id WHERE provider_place_id = ANY(dup_ids);
    UPDATE public.provider_faqs SET provider_place_id = survivor_id WHERE provider_place_id = ANY(dup_ids);
    UPDATE public.provider_views SET provider_place_id = survivor_id WHERE provider_place_id = ANY(dup_ids);
    UPDATE public.provider_update_requests SET provider_place_id = survivor_id WHERE provider_place_id = ANY(dup_ids);

    -- Favorites has composite PK; dedupe first
    DELETE FROM public.favorites f
    WHERE f.provider_place_id = ANY(dup_ids)
      AND EXISTS (SELECT 1 FROM public.favorites s WHERE s.user_id = f.user_id AND s.provider_place_id = survivor_id);
    UPDATE public.favorites SET provider_place_id = survivor_id WHERE provider_place_id = ANY(dup_ids);

    -- Delete duplicate providers
    DELETE FROM public.providers WHERE place_id = ANY(dup_ids);
  END LOOP;
END $$;

-- 3. Prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS ux_providers_name_city
  ON public.providers (lower(name), lower(city));
