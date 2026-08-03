-- Migration: add widget_type so one businesses can have multiple widget kinds
-- (google_reviews now, carousel later)

BEGIN;

ALTER TABLE widgets
  ADD COLUMN IF NOT EXISTS widget_type TEXT NOT NULL DEFAULT 'google_reviews';

CREATE INDEX IF NOT EXISTS idx_widgets_widget_type ON widgets(widget_type);

COMMIT;
