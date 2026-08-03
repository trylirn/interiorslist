INSERT INTO public.providers (place_id, slug, name, city, city_slug, address, published, is_verified, featured)
VALUES ('demo-admin-listing', 'demo-med-spa-sandbox', 'Demo Med Spa (Admin Sandbox)', 'Austin', 'austin', '123 Demo Street, Austin, TX 78701', false, false, false)
ON CONFLICT (place_id) DO NOTHING;