
-- Tighten submissions INSERT policy: require non-empty fields and an email-shaped value
DROP POLICY "Anyone can submit" ON public.submissions;
CREATE POLICY "Anyone can submit valid"
  ON public.submissions FOR INSERT
  WITH CHECK (
    length(business_name) BETWEEN 2 AND 200
    AND length(city) BETWEEN 2 AND 100
    AND contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(contact_email) <= 255
  );

-- Make update_updated_at_column a normal (INVOKER) function — no elevation needed
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Lock down EXECUTE on the remaining SECURITY DEFINER functions.
-- Policies still evaluate them via the policy expression; users can't call them directly.
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
