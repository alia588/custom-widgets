import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { supabase } from '@/lib/db';
import { syncBusinessReviews } from '@/lib/sync-reviews';
import { mapReviewRow } from '@/lib/widget-mappers';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.placeId || !body.name) {
    return NextResponse.json({ error: 'A Google place ID and business name are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('businesses')
    .upsert({
      place_id: body.placeId,
      name: body.name,
      address: body.address ?? '',
      average_rating: Number(body.averageRating ?? 0),
      total_reviews: Number(body.totalReviews ?? 0),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'place_id' })
    .select('id, name, address, average_rating, total_reviews, place_id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const reviewsResult = await supabase
    .from('reviews')
    .select('*')
    .eq('business_id', data.id);
  let reviewRows = reviewsResult.data;

  if (reviewsResult.error) {
    return NextResponse.json({ error: reviewsResult.error.message }, { status: 500 });
  }

  let synced = false;
  if (!reviewRows?.length) {
    try {
      await syncBusinessReviews(data.place_id, 40);
      synced = true;
      const refreshed = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', data.id);
      if (refreshed.error) throw refreshed.error;
      reviewRows = refreshed.data;
    } catch (syncError) {
      return NextResponse.json({
        error: 'The business was selected, but its reviews could not be fetched.',
        message: syncError instanceof Error ? syncError.message : 'Review sync failed',
      }, { status: 502 });
    }
  }

  const { data: refreshedBusiness } = await supabase
    .from('businesses')
    .select('id, name, address, average_rating, total_reviews, place_id')
    .eq('id', data.id)
    .single();
  const business = refreshedBusiness ?? data;

  return NextResponse.json({
    id: business.id,
    placeId: business.place_id,
    name: business.name,
    address: business.address ?? '',
    averageRating: Number(business.average_rating),
    totalReviews: business.total_reviews,
    reviews: (reviewRows ?? []).map(mapReviewRow),
    synced,
  });
}
