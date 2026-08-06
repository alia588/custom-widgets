// Shared Supabase query fragments for widget rows. Kept in one place so the
// public widget API and the bootstrap data.js route select exactly the same
// columns (and the same businesses(...) join).

export const WIDGET_SELECT = `id, business_id, widget_type, name, created_at, updated_at, last_synced_at,
 sort_by, min_rating, image_filtering, max_reviews, excluded_review_ids,
 custom_business_name_enabled, custom_business_name,
 use_site_theme, badge_background_type, badge_background_color, badge_border_color,
 star_color, text_color, font_family, border_radius, padding, star_size, google_icon_size,
 cta_background_color, cta_text_color,
 drawer_background_color, drawer_text_color, drawer_card_background_color,
 drawer_card_border_color, drawer_card_radius,
 layout, position, alignment, full_width, cta_enabled, cta_text,
 badge_show_business_name, badge_show_review_count, badge_compact_mode,
 drawer_show_business_info, drawer_show_star_ratings, drawer_show_dates,
 drawer_show_author_photos, drawer_show_review_images, thumbnail_size, review_image_size,
 drawer_reviews_per_page, drawer_width, drawer_mobile_mode,
 carousel_width_type, carousel_width_value, carousel_reviews_per_slide,
 carousel_max_width_enabled, carousel_max_width,
 carousel_card_padding, carousel_card_gap, carousel_text_max_height, carousel_autoplay,
 carousel_show_overall_rating,
 businesses(name, place_id, address, total_reviews, average_rating)`;

/** WIDGET_SELECT plus the cached reviews, used by the data.js bootstrap route. */
export const WIDGET_SELECT_WITH_REVIEWS = `${WIDGET_SELECT}, cached_reviews`;
