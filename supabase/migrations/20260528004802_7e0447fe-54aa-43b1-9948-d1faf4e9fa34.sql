
-- Contact messages: form submissions from provider detail pages
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_place_id TEXT NOT NULL,
  user_id UUID,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (
    length(first_name) BETWEEN 1 AND 80
    AND length(last_name) BETWEEN 1 AND 80
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(email) <= 255
    AND length(message) BETWEEN 1 AND 4000
  );

CREATE POLICY "Admins manage contact messages"
  ON public.contact_messages
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Provider owners view their messages"
  ON public.contact_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.place_id = contact_messages.provider_place_id
        AND providers.claimed_by = auth.uid()
    )
  );

-- Reviews: allow authenticated users to submit
GRANT INSERT ON public.reviews TO authenticated;

CREATE POLICY "Authenticated users can submit reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    rating BETWEEN 1 AND 5
    AND (text IS NULL OR length(text) <= 4000)
  );
