-- Lockdown: remove public SELECT policies so anon/authenticated cannot
-- read any application tables via PostgREST. Access is service-role only
-- (Next.js server / scripts). RLS stays enabled; no policies = deny.

BEGIN;

DROP POLICY IF EXISTS "Public read businesses" ON businesses;
DROP POLICY IF EXISTS "Public read widgets" ON widgets;
DROP POLICY IF EXISTS "Public read reviews" ON reviews;
DROP POLICY IF EXISTS "Public read before_after_widgets" ON before_after_widgets;
DROP POLICY IF EXISTS "Public read generic_widgets" ON generic_widgets;
DROP POLICY IF EXISTS "Public read allowed_domains" ON allowed_domains;

COMMIT;
