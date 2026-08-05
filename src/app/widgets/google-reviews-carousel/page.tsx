import { supabase } from '@/lib/db';
import { configFromDbRow } from '@/lib/widget-config';
import { reviews as fallbackReviews } from '@/lib/reviews-data';
import type { BusinessInfo, Review } from '@/lib/reviews-data';
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
    .order('created_at', { ascending: true });

  const { data: businessRows } = await supabase
    .from('businesses')
    .select('*')
    .order('name', { ascending: true });

  const { data: reviewRows } = await supabase.from('reviews').select('*');

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
      reviews: reviewsByBusiness.get(w.business_id) ?? fallbackReviews,
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
