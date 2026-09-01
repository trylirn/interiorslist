CREATE TABLE public.account_closure_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  reason text NOT NULL,
  details text,
  missing_features text,
  would_return text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.account_closure_feedback TO service_role;
ALTER TABLE public.account_closure_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read closure feedback" ON public.account_closure_feedback
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
GRANT SELECT ON public.account_closure_feedback TO authenticated;