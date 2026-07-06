
-- Remove anon INSERT policies (require authentication for reviews and claims)
DROP POLICY IF EXISTS "Anonymous can submit reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anonymous can submit claims" ON public.claims;

-- Restrict public access to sensitive provider columns.
-- The public SELECT policy on providers exposes all columns; revoke column-level
-- read access to private routing/document fields from anon and authenticated roles.
REVOKE SELECT (email_forward_to, certificate_urls, document_urls) ON public.providers FROM anon;
REVOKE SELECT (email_forward_to, certificate_urls, document_urls) ON public.providers FROM authenticated;
REVOKE SELECT (email_forward_to, certificate_urls, document_urls) ON public.providers FROM PUBLIC;

-- Preserve owner and admin access via explicit grants on other columns; service_role retains full access.
GRANT SELECT (email_forward_to, certificate_urls, document_urls) ON public.providers TO service_role;
