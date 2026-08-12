import { supabase } from '@/lib/db';
import { configFromDbRow } from '@/lib/widget-config';
import { reviews as fallbackReviews } from '@/lib/reviews-data';
import type { BusinessInfo, Review } from '@/lib/reviews-data';
import { mapReviewsToClient, mapReviewRow } from '@/lib/widget-mappers';
import {
  CarouselEditor,
  type CarouselBusiness,
  type CarouselEditorWidget,
} from '@/components/editor/CarouselEditor';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Google Reviews Carousel — Editor',
};

export default async function GoogleReviewsCarouselPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  const { data: widgets } = await supabase
    .from('widgets')
    .select('*, businesses(name, place_id, address, total_reviews, average_rating)')
    .eq('widget_type', 'google_reviews_carousel')
    .order('created_at', { ascending: false });

  const { data: businessRows } = await supabase
    .from('businesses')
    .select('*')
    .order('name', { ascending: true });

  const reviewsByBusiness = new Map<string, Review[]>();
  for (const widget of widgets ?? []) {
    // Each widget carries its own embed-ready review snapshot. This avoids a
    // full-table scan and pagination loop whenever the editor opens.
    if (!reviewsByBusiness.has(widget.business_id)) {
      reviewsByBusiness.set(
        widget.business_id,
        mapReviewsToClient((widget.cached_reviews ?? []).map(mapReviewRow))
      );
    }
  }

  const allBusinesses: CarouselBusiness[] = (businessRows ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    address: b.address ?? '',
    totalReviews: b.total_reviews,
    averageRating: Number(b.average_rating),
  }));

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
      reviews: (() => {
        const cached = reviewsByBusiness.get(w.business_id) ?? [];
        return cached.length > 0 ? cached : fallbackReviews;
      })(),
    };
  });

  return (
    <CarouselEditor
      items={items}
      initialSelectedId={id}
      allBusinesses={allBusinesses}
      reviewsByBusiness={Object.fromEntries(reviewsByBusiness)}
    />
  );
}
