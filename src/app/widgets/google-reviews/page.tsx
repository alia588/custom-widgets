import { supabase } from '@/lib/db';
import { configFromDbRow } from '@/lib/widget-config';
import { reviews as fallbackReviews } from '@/lib/reviews-data';
import type { BusinessInfo } from '@/lib/reviews-data';
import { mapReviewsToClient, mapReviewRow } from '@/lib/widget-mappers';
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
    .order('created_at', { ascending: false });

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
      // The widget row already contains the review snapshot served to embeds.
      // Reading every review in the account here made opening the editor scale
      // with the entire database rather than with this widget type.
      reviews: (() => {
        const cached = mapReviewsToClient((w.cached_reviews ?? []).map(mapReviewRow));
        return cached.length > 0 ? cached : fallbackReviews;
      })(),
    };
  });

  return <WidgetEditor items={items} initialSelectedId={id} />;
}
