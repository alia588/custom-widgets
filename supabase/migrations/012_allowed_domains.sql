-- Migration: global domain whitelist for widget embeds
-- Requests to widget data APIs are only entertained from these domains
-- when one or more rows exist. An empty table means all origins are allowed
-- (backward-compatible behavior).

BEGIN;

CREATE TABLE IF NOT EXISTS allowed_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_allowed_domains_domain ON allowed_domains(domain);

ALTER TABLE allowed_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read allowed_domains" ON allowed_domains;
CREATE POLICY "Public read allowed_domains" ON allowed_domains FOR SELECT USING (true);

COMMIT;
