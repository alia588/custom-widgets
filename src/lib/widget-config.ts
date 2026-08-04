// Widget configuration types + defaults.
// Mirrors the `widgets` table columns in supabase/migrations/001_initial_schema.sql.

export type SortBy = 'highest_rating' | 'lowest_rating' | 'newest' | 'oldest' | 'most_relevant';
export type ImageFiltering = 'images_first' | 'images_only' | 'no_images' | 'all';
export type BadgeBackgroundType = 'transparent' | 'solid';
export type Layout = 'centered' | 'horizontal';
export type Position = 'inline' | 'fixed' | 'absolute';
export type Alignment = 'center' | 'left' | 'right';
export type ThumbnailSize = 'small' | 'medium' | 'large';
export type MobileMode = 'peek' | 'fullscreen';

// 'inherit' and 'system-ui' are special keywords, not quotable font names.
export function resolveFontFamily(fontFamily: string): string {
  if (fontFamily === 'inherit') return 'inherit';
  if (fontFamily === 'system-ui') {
    return "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  }
  return `'${fontFamily}', system-ui, sans-serif`;
}

export interface WidgetConfig {
  // Content / filtering
  sortBy: SortBy;
  minRating: number;
  imageFiltering: ImageFiltering;
  maxReviews: number;
  excludedReviewIds: string[];
  customBusinessNameEnabled: boolean;
  customBusinessName: string;

  // Style — badge
  useSiteTheme: boolean;
  badgeBackgroundType: BadgeBackgroundType;
  badgeBackgroundColor: string;
  badgeBorderColor: string;
  starColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: number;
  padding: number;
  starSize: number;
  googleIconSize: number;

  // Style — CTA
  ctaBackgroundColor: string;
  ctaTextColor: string;

  // Style — drawer
  drawerBackgroundColor: string;
  drawerTextColor: string;
  drawerCardBackgroundColor: string;
  drawerCardBorderColor: string;
  drawerCardRadius: number;

  // Layout
  layout: Layout;
  position: Position;
  alignment: Alignment;
  fullWidth: boolean;
  ctaEnabled: boolean;
  ctaText: string;

  // Settings — badge display
  badgeShowBusinessName: boolean;
  badgeShowReviewCount: boolean;
  badgeCompactMode: boolean;

  // Settings — drawer display
  drawerShowBusinessInfo: boolean;
  drawerShowStarRatings: boolean;
  drawerShowDates: boolean;
  drawerShowAuthorPhotos: boolean;
  drawerShowReviewImages: boolean;
  thumbnailSize: ThumbnailSize;

  // Settings — drawer behavior
  drawerReviewsPerPage: number;
  drawerWidth: number;
  drawerMobileMode: MobileMode;
}

export const defaultWidgetConfig: WidgetConfig = {
  sortBy: 'highest_rating',
  minRating: 5,
  imageFiltering: 'images_first',
  maxReviews: 40,
  excludedReviewIds: [],
  customBusinessNameEnabled: false,
  customBusinessName: '',

  useSiteTheme: false,
  badgeBackgroundType: 'transparent',
  badgeBackgroundColor: '#FFFFFF',
  badgeBorderColor: '#E5E7EB',
  starColor: '#DC2626',
  textColor: '#1F2937',
  fontFamily: 'Poppins',
  borderRadius: 15,
  padding: 12,
  starSize: 24,
  googleIconSize: 24,

  ctaBackgroundColor: '#FFFFFF',
  ctaTextColor: '#1F2937',

  drawerBackgroundColor: '#FFFFFF',
  drawerTextColor: '#1F2937',
  drawerCardBackgroundColor: '#FFFFFF',
  drawerCardBorderColor: '#E5E7EB',
  drawerCardRadius: 8,

  layout: 'centered',
  position: 'inline',
  alignment: 'center',
  fullWidth: false,
  ctaEnabled: true,
  ctaText: 'Click to read our reviews!',

  badgeShowBusinessName: true,
  badgeShowReviewCount: true,
  badgeCompactMode: false,

  drawerShowBusinessInfo: true,
  drawerShowStarRatings: true,
  drawerShowDates: true,
  drawerShowAuthorPhotos: true,
  drawerShowReviewImages: true,
  thumbnailSize: 'medium',

  drawerReviewsPerPage: 10,
  drawerWidth: 400,
  drawerMobileMode: 'peek',
};

// ---------------------------------------------------------------------------
// DB row <-> config mapping
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */

export function configFromDbRow(row: Record<string, any>): WidgetConfig {
  return {
    sortBy: row.sort_by ?? defaultWidgetConfig.sortBy,
    minRating: row.min_rating ?? defaultWidgetConfig.minRating,
    imageFiltering: row.image_filtering ?? defaultWidgetConfig.imageFiltering,
    maxReviews: row.max_reviews ?? defaultWidgetConfig.maxReviews,
    excludedReviewIds: row.excluded_review_ids ?? [],
    customBusinessNameEnabled: row.custom_business_name_enabled ?? false,
    customBusinessName: row.custom_business_name ?? '',

    useSiteTheme: row.use_site_theme ?? false,
    badgeBackgroundType: row.badge_background_type ?? 'transparent',
    badgeBackgroundColor: row.badge_background_color ?? '#FFFFFF',
    badgeBorderColor: row.badge_border_color ?? '#E5E7EB',
    starColor: row.star_color ?? '#DC2626',
    textColor: row.text_color ?? '#1F2937',
    fontFamily: row.font_family ?? 'Poppins',
    borderRadius: row.border_radius ?? 15,
    padding: row.padding ?? 12,
    starSize: row.star_size ?? 24,
    googleIconSize: row.google_icon_size ?? 24,

    ctaBackgroundColor: row.cta_background_color ?? '#FFFFFF',
    ctaTextColor: row.cta_text_color ?? '#1F2937',

    drawerBackgroundColor: row.drawer_background_color ?? '#FFFFFF',
    drawerTextColor: row.drawer_text_color ?? '#1F2937',
    drawerCardBackgroundColor: row.drawer_card_background_color ?? '#FFFFFF',
    drawerCardBorderColor: row.drawer_card_border_color ?? '#E5E7EB',
    drawerCardRadius: row.drawer_card_radius ?? 8,

    layout: row.layout ?? 'centered',
    position: row.position ?? 'inline',
    alignment: row.alignment ?? 'center',
    fullWidth: row.full_width ?? false,
    ctaEnabled: row.cta_enabled ?? true,
    ctaText: row.cta_text ?? 'Click to read our reviews!',

    badgeShowBusinessName: row.badge_show_business_name ?? true,
    badgeShowReviewCount: row.badge_show_review_count ?? true,
    badgeCompactMode: row.badge_compact_mode ?? false,

    drawerShowBusinessInfo: row.drawer_show_business_info ?? true,
    drawerShowStarRatings: row.drawer_show_star_ratings ?? true,
    drawerShowDates: row.drawer_show_dates ?? true,
    drawerShowAuthorPhotos: row.drawer_show_author_photos ?? true,
    drawerShowReviewImages: row.drawer_show_review_images ?? true,
    thumbnailSize: row.thumbnail_size ?? 'medium',

    drawerReviewsPerPage: row.drawer_reviews_per_page ?? 10,
    drawerWidth: row.drawer_width ?? 400,
    drawerMobileMode: row.drawer_mobile_mode ?? 'peek',
  };
}

export function configToDbRow(config: WidgetConfig): Record<string, unknown> {
  return {
    sort_by: config.sortBy,
    min_rating: config.minRating,
    image_filtering: config.imageFiltering,
    max_reviews: config.maxReviews,
    excluded_review_ids: config.excludedReviewIds,
    custom_business_name_enabled: config.customBusinessNameEnabled,
    custom_business_name: config.customBusinessName || null,

    use_site_theme: config.useSiteTheme,
    badge_background_type: config.badgeBackgroundType,
    badge_background_color: config.badgeBackgroundColor,
    badge_border_color: config.badgeBorderColor,
    star_color: config.starColor,
    text_color: config.textColor,
    font_family: config.fontFamily,
    border_radius: config.borderRadius,
    padding: config.padding,
    star_size: config.starSize,
    google_icon_size: config.googleIconSize,

    cta_background_color: config.ctaBackgroundColor,
    cta_text_color: config.ctaTextColor,

    drawer_background_color: config.drawerBackgroundColor,
    drawer_text_color: config.drawerTextColor,
    drawer_card_background_color: config.drawerCardBackgroundColor,
    drawer_card_border_color: config.drawerCardBorderColor,
    drawer_card_radius: config.drawerCardRadius,

    layout: config.layout,
    position: config.position,
    alignment: config.alignment,
    full_width: config.fullWidth,
    cta_enabled: config.ctaEnabled,
    cta_text: config.ctaText,

    badge_show_business_name: config.badgeShowBusinessName,
    badge_show_review_count: config.badgeShowReviewCount,
    badge_compact_mode: config.badgeCompactMode,

    drawer_show_business_info: config.drawerShowBusinessInfo,
    drawer_show_star_ratings: config.drawerShowStarRatings,
    drawer_show_dates: config.drawerShowDates,
    drawer_show_author_photos: config.drawerShowAuthorPhotos,
    drawer_show_review_images: config.drawerShowReviewImages,
    thumbnail_size: config.thumbnailSize,

    drawer_reviews_per_page: config.drawerReviewsPerPage,
    drawer_width: config.drawerWidth,
    drawer_mobile_mode: config.drawerMobileMode,

    updated_at: new Date().toISOString(),
  };
}

export const thumbnailSizePx: Record<ThumbnailSize, number> = {
  small: 40,
  medium: 60,
  large: 80,
};
