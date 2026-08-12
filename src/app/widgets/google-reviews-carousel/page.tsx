import { configFromDbRow, defaultWidgetConfig } from '@/lib/widget-config';
import type { BusinessInfo, Review } from '@/lib/reviews-data';
import {
  CarouselEditor,
  type CarouselBusiness,
  type CarouselEditorWidget,
} from '@/components/editor/CarouselEditor';
import { getEditorWidget } from '@/lib/editor-widget-query';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Google Reviews Carousel — Editor',
};

export default async function GoogleReviewsCarouselPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; new?: string }>;
}) {
  const { id, new: newWidget } = await searchParams;

  const widgetResult = newWidget === '1' || !id
    ? { data: null }
    : await getEditorWidget(id, 'google_reviews_carousel');
  const widgets = widgetResult.data ? [widgetResult.data] : [];

  // PostgREST caps a single request at 1000 rows — page through all reviews.
  const allBusinesses: CarouselBusiness[] = [];

  const items: CarouselEditorWidget[] = (widgets ?? []).map((w) => {
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
      businessId: w.business_id,
      initialConfig: configFromDbRow(w),
      business: businessInfo,
      reviews: (w.cached_reviews ?? []) as Review[],
    };
  });

  if (newWidget === '1') {
    items.unshift({
      widgetId: 'new',
      widgetName: 'Google Reviews Carousel',
      businessId: '',
      initialConfig: defaultWidgetConfig,
      business: { name: '', address: '', totalReviews: 0, averageRating: 0 },
      reviews: [],
    });
  }

  return (
    <CarouselEditor
      items={items}
      initialSelectedId={newWidget === '1' ? 'new' : id}
      isNew={newWidget === '1'}
      allBusinesses={allBusinesses}
    />
  );
}
