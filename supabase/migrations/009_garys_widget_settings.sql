-- Migration: match GARYS AUTO COLLISION CENTER widget settings to the
-- reference (designdetail.io) configuration.
--
-- Badge widget  (1cb98d3c-...): content, style, layout and settings as per
-- reference screenshots. drawer_width stays 640 (popup width chosen after the
-- drawer-to-popup redesign; the reference's 400px was for the old side panel).
--
-- Carousel widget (7f3a9c2e-...): content + style settings. NOTE: the
-- reference had 16 of 40 reviews excluded; the specific excluded IDs are not
-- visible in the screenshots, so excluded_review_ids is left unchanged.

BEGIN;

-- Google Reviews Badge — GARYS AUTO COLLISION CENTER
UPDATE widgets SET
  -- Content / filtering
  sort_by = 'highest_rating',
  min_rating = 5,
  image_filtering = 'images_first',
  max_reviews = 40,
  excluded_review_ids = '{}',
  custom_business_name_enabled = false,
  custom_business_name = NULL,
  -- Style — badge
  use_site_theme = false,
  badge_background_type = 'transparent',
  badge_background_color = '#FFFFFF',
  badge_border_color = '#E5E7EB',
  star_color = '#DC2626',
  text_color = '#1F2937',
  font_family = 'Poppins',
  border_radius = 15,
  padding = 12,
  star_size = 24,
  google_icon_size = 24,
  -- Style — CTA
  cta_background_color = '#FFFFFF',
  cta_text_color = '#1F2937',
  -- Style — popup (drawer)
  drawer_background_color = '#FFFFFF',
  drawer_text_color = '#1F2937',
  drawer_card_background_color = '#FFFFFF',
  drawer_card_border_color = '#E5E7EB',
  drawer_card_radius = 8,
  -- Layout
  layout = 'centered',
  position = 'inline',
  alignment = 'center',
  full_width = false,
  cta_enabled = true,
  cta_text = 'Click to read our reviews!',
  -- Settings — badge display
  badge_show_business_name = true,
  badge_show_review_count = true,
  badge_compact_mode = false,
  -- Settings — popup display
  drawer_show_business_info = true,
  drawer_show_star_ratings = true,
  drawer_show_dates = true,
  drawer_show_author_photos = true,
  drawer_show_review_images = true,
  thumbnail_size = 'medium',
  -- Settings — popup behavior (width kept at 640 on purpose)
  drawer_reviews_per_page = 10,
  drawer_mobile_mode = 'peek',
  updated_at = now()
WHERE id = '1cb98d3c-e962-45be-8fac-5859aa7143b8';

-- Google Reviews Carousel — GARYS AUTO COLLISION CENTER
UPDATE widgets SET
  -- Content / filtering
  sort_by = 'highest_rating',
  min_rating = 5,
  image_filtering = 'images_first',
  max_reviews = 40,
  -- Style
  badge_background_type = 'transparent',
  drawer_card_background_color = '#FFFFFF',
  drawer_card_border_color = '#e42709',
  star_color = '#DC2626',
  text_color = '#2D2D2D',
  font_family = 'Poppins',
  drawer_card_radius = 28,
  updated_at = now()
WHERE id = '7f3a9c2e-4b1d-4e8f-9a6c-2d5e8f1a3b7c';

COMMIT;
