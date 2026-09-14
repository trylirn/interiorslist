-- 1. Claims must always be created as pending, unreviewed.
DROP POLICY IF EXISTS "Users submit claims" ON public.claims;
CREATE POLICY "Users submit claims"
ON public.claims FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND coalesce(status, 'pending') = 'pending'
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
);

-- 2. Studio owners may only edit presentation fields on their claimed listing.
CREATE OR REPLACE FUNCTION public.guard_provider_owner_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins and service role bypass the allowlist.
  IF auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'super_admin') THEN
    RETURN NEW;
  END IF;

  -- Commercial / curation / routing columns are admin-only.
  NEW.plan             := OLD.plan;
  NEW.plan_expires_at  := OLD.plan_expires_at;
  NEW.featured         := OLD.featured;
  NEW.is_verified      := OLD.is_verified;
  NEW.published        := OLD.published;
  NEW.claimed_by       := OLD.claimed_by;
  NEW.email_forward_to := OLD.email_forward_to;
  NEW.view_count       := OLD.view_count;
  NEW.place_id         := OLD.place_id;
  NEW.slug             := OLD.slug;
  NEW.rating           := OLD.rating;
  NEW.review_count     := OLD.review_count;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS providers_guard_owner_update ON public.providers;
CREATE TRIGGER providers_guard_owner_update
BEFORE UPDATE ON public.providers
FOR EACH ROW EXECUTE FUNCTION public.guard_provider_owner_update();