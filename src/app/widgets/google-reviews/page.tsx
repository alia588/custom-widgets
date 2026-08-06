import { supabase } from '@/lib/db';
import { configFromDbRow } from '@/lib/widget-config';
import { reviews as fallbackReviews } from '@/lib/reviews-data';
import type { BusinessInfo, Review } from '@/lib/reviews-data';
import { WidgetEditor, type EditorWidget } from '@/components/editor/WidgetEditor';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Google Reviews Badge — Editor',
};

export default async function GoogleReviewsWidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  const { data: widgets } = await supabase
    .from('widgets')
    .select('*, businesses(name, place_id, address, total_reviews, average_rating)')
    .eq('widget_type', 'google_reviews')
    .order('created_at', { ascending: true });

  // PostgREST caps a single request at 1000 rows — page through all reviews.
  const PAGE_SIZE = 1000;
  const reviewRows: Record<string, any>[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .range(from, from + PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    reviewRows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  const reviewsByBusiness = new Map<string, Review[]>();
  for (const r of reviewRows ?? []) {
    const list = reviewsByBusiness.get(r.business_id) ?? [];
    list.push({
      id: r.google_review_id ?? r.id,
      authorName: r.author_name ?? 'Anonymous',
      authorPhotoUrl: r.author_photo_url ?? undefined,
      rating: r.rating,
      text: r.text ?? '',
      relativeTime: r.relative_time ?? '',
      images: r.images ?? [],
    });
    reviewsByBusiness.set(r.business_id, list);
  }

  const items: EditorWidget[] = (widgets ?? []).map((w) => {
    const business = w.businesses as unknown as {
      name: string;
      place_id: string;
      address: string | null;
      total_reviews: number;
      average_rating: number;
    };

    const businessInfo: BusinessInfo = {
      name: business.name,
      address: business.address ?? '',
      totalReviews: business.total_reviews,
      averageRating: Number(business.average_rating),
    };

    return {
      widgetId: w.id,
      widgetName: w.name,
      initialConfig: configFromDbRow(w),
      business: businessInfo,
      reviews: reviewsByBusiness.get(w.business_id) ?? fallbackReviews,
    };
  });

  return <WidgetEditor items={items} initialSelectedId={id} />;
}
