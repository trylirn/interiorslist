REVOKE SELECT (email, email_forward_to, notes, document_urls, certificate_urls, claimed_by) ON public.providers FROM anon, authenticated;
REVOKE SELECT (email) ON public.reviews FROM anon, authenticated;
CREATE POLICY "Senders view own contact messages" ON public.contact_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);