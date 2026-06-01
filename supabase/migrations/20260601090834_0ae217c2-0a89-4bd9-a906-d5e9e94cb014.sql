
-- 1. Restrict profiles SELECT to the owner only (was: public)
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles public read" ON public.profiles;
CREATE POLICY "Users view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Prevent owners from re-pointing claimed_by or hiding records by changing business_status
DROP POLICY IF EXISTS "Owners update claimed listings" ON public.providers;
CREATE POLICY "Owners update claimed listings"
  ON public.providers
  FOR UPDATE
  USING (auth.uid() = claimed_by)
  WITH CHECK (
    auth.uid() = claimed_by
    AND business_status = 'OPERATIONAL'
  );

-- 3. Require authentication to submit a medspa submission
DROP POLICY IF EXISTS "Anyone can submit valid" ON public.submissions;
CREATE POLICY "Authenticated users submit"
  ON public.submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    length(business_name) BETWEEN 2 AND 200
    AND length(city) BETWEEN 2 AND 100
    AND contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(contact_email) <= 255
    AND submitted_by = auth.uid()
  );
