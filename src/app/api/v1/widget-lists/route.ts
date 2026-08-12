import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAdmin } from '@/lib/require-admin';
import { beforeAfterFromDbRow } from '@/lib/before-after-config';
import { configFromDbRow } from '@/lib/widget-config';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const type = new URL(request.url).searchParams.get('type');
  if (type === 'before-after') {
    const { data, error } = await supabase
      .from('before_after_widgets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      items: (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        config: beforeAfterFromDbRow(row),
      })),
    });
  }

  const widgetType = type === 'google-reviews'
    ? 'google_reviews'
    : type === 'google-reviews-carousel'
      ? 'google_reviews_carousel'
      : null;
  if (!widgetType) return NextResponse.json({ error: 'Invalid widget type' }, { status: 400 });

  const { data, error } = await supabase
    .from('widgets')
    .select('*, businesses(name, address, total_reviews, average_rating)')
    .eq('widget_type', widgetType)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    items: (data ?? []).map((row) => {
      const business = row.businesses as unknown as {
        name: string;
        address: string | null;
        total_reviews: number;
        average_rating: number;
      } | null;
      return {
        id: row.id,
        businessId: row.business_id,
        widgetType,
        name: row.name,
        config: configFromDbRow(row),
        reviews: row.cached_reviews ?? [],
        business: business ? {
          name: business.name,
          address: business.address ?? '',
          totalReviews: business.total_reviews,
          averageRating: Number(business.average_rating),
        } : undefined,
      };
    }),
  });
}
