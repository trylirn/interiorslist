-- Data API grants (none existed on any public table)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.providers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_faqs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.claims TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.claim_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_update_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_invites TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.account_closure_feedback TO authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT SELECT ON public.analytics_sessions TO authenticated;
GRANT SELECT ON public.tool_usage TO authenticated;
GRANT SELECT, INSERT ON public.provider_views TO authenticated;

GRANT SELECT ON public.providers TO anon;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.review_responses TO anon;
GRANT SELECT ON public.provider_faqs TO anon;
GRANT SELECT ON public.brands TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.testimonials TO anon;
GRANT INSERT ON public.contact_messages TO anon;
GRANT INSERT ON public.provider_views TO anon;

GRANT ALL ON public.providers TO service_role;
GRANT ALL ON public.reviews TO service_role;
GRANT ALL ON public.review_responses TO service_role;
GRANT ALL ON public.provider_faqs TO service_role;
GRANT ALL ON public.contact_messages TO service_role;
GRANT ALL ON public.claims TO service_role;
GRANT ALL ON public.claim_messages TO service_role;
GRANT ALL ON public.submissions TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.provider_update_requests TO service_role;
GRANT ALL ON public.favorites TO service_role;
GRANT ALL ON public.blog_posts TO service_role;
GRANT ALL ON public.brands TO service_role;
GRANT ALL ON public.services TO service_role;
GRANT ALL ON public.testimonials TO service_role;
GRANT ALL ON public.admin_invites TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.account_closure_feedback TO service_role;
GRANT ALL ON public.analytics_events TO service_role;
GRANT ALL ON public.analytics_sessions TO service_role;
GRANT ALL ON public.tool_usage TO service_role;
GRANT ALL ON public.provider_views TO service_role;
GRANT ALL ON public.rate_limit_hits TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.provider_views_id_seq TO anon;

-- Reviews had no read policy at all: only admins could read them.
CREATE POLICY "Public read reviews of published studios"
  ON public.reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.place_id = reviews.provider_place_id AND p.published = true
    )
  );

CREATE POLICY "Owners read their studio reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.place_id = reviews.provider_place_id AND p.claimed_by = auth.uid()
    )
  );