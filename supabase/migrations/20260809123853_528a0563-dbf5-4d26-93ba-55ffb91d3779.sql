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
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.providers
    WHERE providers.place_id = contact_messages.provider_place_id
      AND providers.claimed_by = auth.uid()
  )
);