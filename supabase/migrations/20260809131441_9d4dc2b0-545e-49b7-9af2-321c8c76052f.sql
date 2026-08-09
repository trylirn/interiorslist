-- 1. Claims: new states and fields
ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS decision_reason text,
  ADD COLUMN IF NOT EXISTS access_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS last_message_at timestamp with time zone;

CREATE UNIQUE INDEX IF NOT EXISTS claims_access_token_key ON public.claims(access_token);

-- 2. Claim messages thread
CREATE TABLE IF NOT EXISTS public.claim_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('admin','claimant')),
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  body text NOT NULL,
  attachment_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.claim_messages TO authenticated;
GRANT ALL ON public.claim_messages TO service_role;

ALTER TABLE public.claim_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Claimants can read their claim messages"
ON public.claim_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.claims c
    WHERE c.id = claim_messages.claim_id AND c.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE INDEX IF NOT EXISTS claim_messages_claim_id_idx ON public.claim_messages(claim_id, created_at);

-- 3. Structured consultation brief fields
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS project_type text,
  ADD COLUMN IF NOT EXISTS budget text,
  ADD COLUMN IF NOT EXISTS style text,
  ADD COLUMN IF NOT EXISTS timeline text,
  ADD COLUMN IF NOT EXISTS rooms text;