-- Migration: generic widgets table for widget types without a dedicated schema
-- (CONTACT_FORM, PRICING_TABLE, PROMO_BANNER imported from the legacy export).
-- The full source config is stored verbatim in `config`; business_id is nullable
-- because some source widgets are not tied to a Google business.

BEGIN;

CREATE TABLE IF NOT EXISTS generic_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generic_widgets_widget_type ON generic_widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_generic_widgets_business_id ON generic_widgets(business_id);

ALTER TABLE generic_widgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read generic_widgets" ON generic_widgets;
CREATE POLICY "Public read generic_widgets" ON generic_widgets FOR SELECT USING (true);

COMMIT;
