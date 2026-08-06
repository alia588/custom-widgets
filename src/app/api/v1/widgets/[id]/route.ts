import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import {
  getAllowedDomains,
  getWidgetCorsHeaders,
} from '@/lib/domain-utils';

export async function OPTIONS(request: Request) {
  const allowedDomains = await getAllowedDomains();
  const cors = getWidgetCorsHeaders(request, allowedDomains);

  return new NextResponse(null, {
    status: cors.allowed ? 204 : 403,
    headers: cors.headers,
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const allowedDomains = await getAllowedDomains();
  const cors = getWidgetCorsHeaders(request, allowedDomains);

  if (!cors.allowed) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403, headers: cors.headers }
    );
  }

  const { data, error } = await supabase
    .from('widgets')
    .select(
      `id, business_id, widget_type, name, created_at, updated_at, last_synced_at,
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
       carousel_width_type, carousel_width_value, carousel_reviews_per_slide, carousel_max_width,
       carousel_card_padding, carousel_card_gap, carousel_text_max_height, carousel_autoplay,
       carousel_show_overall_rating,
       businesses(name, place_id, address, total_reviews, average_rating)`
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Widget not found' },
      { status: 404, headers: cors.headers }
    );
  }

  return NextResponse.json(data, { headers: cors.headers });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Prevent identity tampering (business_id is allowed: editors can
  // re-point a widget at a different business)
  delete body.id;
  delete body.created_at;

  // When (re)assigning a business, refresh the cached reviews so embeds
  // don't keep serving the previous business's reviews.
  if (body.business_id) {
    const { data: reviewRows } = await supabase
      .from('reviews')
      .select('*')
      .eq('business_id', body.business_id);

    body.cached_reviews = (reviewRows ?? []).map((r) => ({
      id: r.google_review_id ?? r.id,
      authorName: r.author_name ?? 'Anonymous',
      authorPhotoUrl: r.author_photo_url ?? undefined,
      rating: r.rating,
      text: r.text ?? '',
      relativeTime: r.relative_time ?? '',
      images: r.images ?? [],
    }));
  }

  const { data, error } = await supabase
    .from('widgets')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Update failed', message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase.from('widgets').delete().eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: 'Delete failed', message: error.message },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
