-- Migration: Before/After Slider widget schema
-- Standalone table (not tied to a Google business), seeded with the widget ID
-- used by the existing DesignDetail embed snippet so it keeps working when
-- the domain is pointed at this app.

BEGIN;

CREATE TABLE IF NOT EXISTS before_after_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Before/After Slider',

  -- Content
  before_image_url TEXT NOT NULL DEFAULT '',
  after_image_url TEXT NOT NULL DEFAULT '',

  -- Style
  use_site_theme BOOLEAN NOT NULL DEFAULT false,
  background_type TEXT NOT NULL DEFAULT 'transparent',   -- transparent | solid
  background_color TEXT NOT NULL DEFAULT '#FFFFFF',
  label_background_color TEXT NOT NULL DEFAULT '#E42709',
  label_text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  font_family TEXT NOT NULL DEFAULT 'Poppins',
  shadow TEXT NOT NULL DEFAULT 'default',                -- default | none | soft | strong
  border_radius INT NOT NULL DEFAULT 24,

  -- Layout
  before_label TEXT NOT NULL DEFAULT 'Before',
  after_label TEXT NOT NULL DEFAULT 'After',
  width_type TEXT NOT NULL DEFAULT 'percentage',         -- percentage | fixed
  width_value INT NOT NULL DEFAULT 100,                  -- % or px depending on width_type
  aspect_ratio TEXT NOT NULL DEFAULT '4:3',              -- 16:9 | 21:9 | 4:3 | 3:2 | 1:1 | auto | custom 'W:H'
  slider_position INT NOT NULL DEFAULT 70,               -- 0..100 (% of before image shown)
  show_labels BOOLEAN NOT NULL DEFAULT true,
  show_instruction_text BOOLEAN NOT NULL DEFAULT true,
  instruction_text TEXT NOT NULL DEFAULT 'Drag to compare',
  instruction_size INT NOT NULL DEFAULT 14,

  -- Settings
  capture_touch_mode BOOLEAN NOT NULL DEFAULT true,      -- tap anywhere to move the slider

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE before_after_widgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read before_after_widgets" ON before_after_widgets;
CREATE POLICY "Public read before_after_widgets" ON before_after_widgets FOR SELECT USING (true);

-- Seed: matches the existing DesignDetail embed ID for Gary's Auto Collision Center
INSERT INTO before_after_widgets (id, name)
VALUES ('a4462581-5eff-453d-9509-b00ce07fb6aa', 'ALIS Audi Q5 Before and After (Gary''s Auto Collision Center)')
ON CONFLICT (id) DO NOTHING;

COMMIT;
