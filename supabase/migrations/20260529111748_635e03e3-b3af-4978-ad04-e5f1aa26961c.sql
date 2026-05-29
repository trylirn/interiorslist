
-- Add new columns
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS credentials text,
  ADD COLUMN IF NOT EXISTS services_raw text[] DEFAULT '{}'::text[];

-- Make place_id unique so we can ON CONFLICT upsert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'providers_place_id_unique'
  ) THEN
    ALTER TABLE public.providers ADD CONSTRAINT providers_place_id_unique UNIQUE (place_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'providers_slug_unique'
  ) THEN
    ALTER TABLE public.providers ADD CONSTRAINT providers_slug_unique UNIQUE (slug);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brands_slug_unique'
  ) THEN
    ALTER TABLE public.brands ADD CONSTRAINT brands_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- Clear all email values from public providers (privacy)
UPDATE public.providers SET email = NULL;

-- Add contact_messages.status enum-friendly values (already text). Add updated_at
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

-- Allow owners to update contact_messages status for their listings
DROP POLICY IF EXISTS "Owners update their messages" ON public.contact_messages;
CREATE POLICY "Owners update their messages"
ON public.contact_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.providers
    WHERE providers.place_id = contact_messages.provider_place_id
      AND providers.claimed_by = auth.uid()
  )
);
