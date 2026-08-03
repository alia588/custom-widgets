import { fetchAllScrapeDoReviews } from './scrapedo';
import { supabase } from './db';

export interface SyncResult {
  businessId: string;
  businessName: string;
  placeId: string;
  pagesFetched: number;
  reviewsStored: number;
  totalReviews: number | null;
  averageRating: number | null;
  widgetsUpdated: number;
  syncedAt: string;
}

/**
 * Fetches reviews from Scrape.do and stores them in Supabase.
 *
 * This is the ONLY place Scrape.do is called. The app (editor, embed script,
 * reviews endpoint) always reads from Supabase; refresh cadence is a
 * separate decision (manual trigger now, cron later).
 */
export async function syncBusinessReviews(
  placeId: string,
  maxReviews = 40
): Promise<SyncResult> {
  const token = process.env.SCRAPEDO_TOKEN;
  if (!token) throw new Error('SCRAPEDO_TOKEN not configured');

  // 1. Resolve the managed business
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, name, place_id')
    .eq('place_id', placeId)
    .single();

  if (businessError || !business) {
    throw new Error(`No managed business found for place_id ${placeId}`);
  }

  // 2. Fetch from Scrape.do (paginated, up to 20 reviews per request)
  const { reviews, place_info, fetchedPages } = await fetchAllScrapeDoReviews(
    placeId,
    token,
    maxReviews
  );

  // 3. Replace the stored snapshot for this business.
  // google_review_id stays stable across syncs, so widget exclusion lists
  // (which store those IDs) keep working.
  const deduped = new Map(
    reviews.map((r) => [
      r.review_id ?? `${r.user?.name ?? 'anon'}|${r.date ?? ''}|${(r.snippet ?? '').slice(0, 40)}`,
      r,
    ])
  );

  const rows = Array.from(deduped.entries()).map(([key, r]) => ({
    business_id: business.id,
    google_review_id: r.review_id ?? key,
    author_name: r.user?.name ?? 'Anonymous',
    author_photo_url: r.user?.thumbnail ?? null,
    rating: r.rating ?? 0,
    text: r.snippet ?? '',
    relative_time: r.date ?? '',
    images: r.images ?? [],
  }));

  await supabase.from('reviews').delete().eq('business_id', business.id);

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('reviews').insert(rows);
    if (insertError) throw new Error(`Review insert failed: ${insertError.message}`);
  }

  // 4. Update business figures from Google
  const totalReviews = place_info?.reviews ?? null;
  const averageRating = place_info?.rating ?? null;

  await supabase
    .from('businesses')
    .update({
      total_reviews: totalReviews,
      average_rating: averageRating,
      updated_at: new Date().toISOString(),
    })
    .eq('id', business.id);

  // 5. Snapshot into each widget's cached_reviews for the embed script
  const cached = rows.map((r) => ({
    id: r.google_review_id,
    authorName: r.author_name,
    authorPhotoUrl: r.author_photo_url,
    rating: r.rating,
    text: r.text,
    relativeTime: r.relative_time,
    images: r.images,
  }));

  const { data: updatedWidgets } = await supabase
    .from('widgets')
    .update({
      cached_reviews: cached,
      last_synced_at: new Date().toISOString(),
    })
    .eq('business_id', business.id)
    .eq('widget_type', 'google_reviews')
    .select('id');

  return {
    businessId: business.id,
    businessName: business.name,
    placeId,
    pagesFetched: fetchedPages,
    reviewsStored: rows.length,
    totalReviews,
    averageRating,
    widgetsUpdated: updatedWidgets?.length ?? 0,
    syncedAt: new Date().toISOString(),
  };
}
