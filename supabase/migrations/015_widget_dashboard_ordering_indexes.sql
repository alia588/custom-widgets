-- Dashboard list/editor queries filter by type and show newest widgets first.
-- These indexes make that ordering an index walk instead of a sort as the
-- account grows.

CREATE INDEX IF NOT EXISTS idx_widgets_type_created_at_desc
  ON widgets (widget_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_before_after_widgets_created_at_desc
  ON before_after_widgets (created_at DESC);
