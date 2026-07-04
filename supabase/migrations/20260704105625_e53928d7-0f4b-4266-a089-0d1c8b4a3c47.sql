-- Allow anonymous claim submissions
ALTER TABLE public.claims ALTER COLUMN user_id DROP NOT NULL;

GRANT INSERT ON public.claims TO anon;

CREATE POLICY "Anonymous can submit claims"
  ON public.claims
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);