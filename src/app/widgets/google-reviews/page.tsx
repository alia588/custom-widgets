import { configFromDbRow, defaultWidgetConfig } from '@/lib/widget-config';
import type { BusinessInfo, Review } from '@/lib/reviews-data';
import { WidgetEditor, type EditorWidget } from '@/components/editor/WidgetEditor';
import { getEditorWidget } from '@/lib/editor-widget-query';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Google Reviews Badge — Editor',
};

export default async function GoogleReviewsWidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; new?: string }>;
}) {
  const { id, new: newWidget } = await searchParams;

  const widgetResult = newWidget === '1' || !id
    ? { data: null }
    : await getEditorWidget(id, 'google_reviews');
  const widgets = widgetResult.data ? [widgetResult.data] : [];

  // PostgREST caps a single request at 1000 rows — page through all reviews.
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
      businessId: w.business_id,
      widgetName: w.name,
      initialConfig: configFromDbRow(w),
      business: businessInfo,
      reviews: (w.cached_reviews ?? []) as Review[],
    };
  });

  if (newWidget === '1') {
    items.unshift({
      widgetId: 'new',
      businessId: '',
      widgetName: 'Google Reviews Badge',
      initialConfig: defaultWidgetConfig,
      business: { name: '', address: '', totalReviews: 0, averageRating: 0 },
      reviews: [],
    });
  }

  return <WidgetEditor items={items} initialSelectedId={newWidget === '1' ? 'new' : id} isNew={newWidget === '1'} />;
}
