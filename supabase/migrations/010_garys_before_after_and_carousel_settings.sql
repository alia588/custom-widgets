-- Migration: Match designdetail.io settings exactly for Gary's Auto Collision Center
-- 1) Before/After sliders: apply the reference Style/Layout/Settings values to ALL
--    before/after widgets (identical styling across every slider).
-- 2) Google Reviews Carousel: backfill Layout + Settings tab values.

BEGIN;

-- ── Before/After sliders (all rows) ─────────────────────────────────────────
-- Style tab:  Use Site Theme off, Background transparent, Label Background #e42709,
--             Text Color #FFFFFF, Font Poppins, Shadow default, Border Radius 24px
-- Layout tab: Labels Before/After, Width percentage 100, Aspect Ratio 4:3,
--             Slider Position 70%, labels on, instruction "Drag to compare" 14px
-- Settings:   Capture Touch Mode on
UPDATE before_after_widgets SET
  use_site_theme         = false,
  background_type        = 'transparent',
  background_color       = '#FFFFFF',
  label_background_color = '#E42709',
  label_text_color       = '#FFFFFF',
  font_family            = 'Poppins',
  shadow                 = 'default',
  border_radius          = 24,
  before_label           = 'Before',
  after_label            = 'After',
  width_type             = 'percentage',
  width_value            = 100,
  aspect_ratio           = '4:3',
  slider_position        = 70,
  show_labels            = true,
  show_instruction_text  = true,
  instruction_text       = 'Drag to compare',
  instruction_size       = 14,
  capture_touch_mode     = true,
  updated_at             = now();

-- ── Google Reviews Carousel (Gary's) ────────────────────────────────────────
-- Layout tab:   Width percentage 100, Reviews Per Slide 5, Max Width 1200,
--               Card Padding 16, Card Gap 16, Text Max Height 300, Auto-Play off
-- Settings tab: Business Info off, Overall Rating on, Star Ratings on, Dates on,
--               Author Photos on, Review Images on, Thumbnail Medium (60x60)
UPDATE widgets SET
  carousel_width_type           = 'percentage',
  carousel_width_value          = 100,
  carousel_reviews_per_slide    = 5,
  carousel_max_width            = 1200,
  carousel_card_padding         = 16,
  carousel_card_gap             = 16,
  carousel_text_max_height      = 300,
  carousel_autoplay             = false,
  drawer_show_business_info     = false,
  carousel_show_overall_rating  = true,
  drawer_show_star_ratings      = true,
  drawer_show_dates             = true,
  drawer_show_author_photos     = true,
  drawer_show_review_images     = true,
  thumbnail_size                = 'medium',
  updated_at                    = now()
WHERE id = '7f3a9c2e-4b1d-4e8f-9a6c-2d5e8f1a3b7c';

COMMIT;
