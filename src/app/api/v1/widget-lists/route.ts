import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAdmin } from '@/lib/require-admin';
import { beforeAfterFromDbRow } from '@/lib/before-after-config';
import { formFromDbRow } from '@/lib/form-config';
import { configFromDbRow } from '@/lib/widget-config';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const params = new URL(request.url).searchParams;
  const type = params.get('type');
  const page = Math.max(0, Number(params.get('page') ?? 0) || 0);
  const pageSize = Math.min(30, Math.max(1, Number(params.get('pageSize') ?? 9) || 9));
  const search = params.get('search')?.trim() ?? '';
  const safeSearch = search.replace(/[%,()]/g, '');
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(search);
  const searchFilter = isUuid
    ? `name.ilike.%${safeSearch}%,id.eq.${search}`
    : `name.ilike.%${safeSearch}%`;
  const from = page * pageSize;
  const to = from + pageSize;
  if (type === 'before-after') {
    let query = supabase
      .from('before_after_widgets')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);
    if (safeSearch) query = query.or(searchFilter);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      items: (data ?? []).slice(0, pageSize).map((row) => ({
        id: row.id,
        name: row.name,
        config: beforeAfterFromDbRow(row),
      })),
      hasMore: (data?.length ?? 0) > pageSize,
    });
  }

  if (type === 'form') {
    let query = supabase
      .from('form_widgets')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);
    if (safeSearch) query = query.or(searchFilter);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      items: (data ?? []).slice(0, pageSize).map((row) => ({
        id: row.id,
        name: row.name,
        config: formFromDbRow(row),
      })),
      hasMore: (data?.length ?? 0) > pageSize,
    });
  }

  const widgetType = type === 'google-reviews'
    ? 'google_reviews'
    : type === 'google-reviews-carousel'
      ? 'google_reviews_carousel'
      : null;
  if (!widgetType) return NextResponse.json({ error: 'Invalid widget type' }, { status: 400 });

  let query = supabase
    .from('widgets')
    .select('*, businesses(name, address, total_reviews, average_rating)')
    .eq('widget_type', widgetType)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (safeSearch) query = query.or(searchFilter);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    items: (data ?? []).slice(0, pageSize).map((row) => {
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
    hasMore: (data?.length ?? 0) > pageSize,
  });
}
