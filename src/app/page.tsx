import { supabase } from '@/lib/db';
import { beforeAfterFromDbRow } from '@/lib/before-after-config';
import { configFromDbRow } from '@/lib/widget-config';
import type { Review } from '@/lib/reviews-data';
import {
  WidgetsHome,
  type BeforeAfterItem,
  type GoogleReviewsItem,
} from '@/components/WidgetsHome';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [{ data: beforeAfterRows }, { data: reviewWidgetRows }, { data: carouselWidgetRows }] =
    await Promise.all([
      supabase.from('before_after_widgets').select('*').order('created_at', { ascending: true }),
      supabase
        .from('widgets')
        .select('*, businesses(name, place_id, address, total_reviews, average_rating)')
        .eq('widget_type', 'google_reviews')
        .order('created_at', { ascending: true }),
      supabase
        .from('widgets')
        .select('*, businesses(name, place_id, address, total_reviews, average_rating)')
        .eq('widget_type', 'google_reviews_carousel')
        .order('created_at', { ascending: true }),
    ]);

  const beforeAfterItems: BeforeAfterItem[] = (beforeAfterRows ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    config: beforeAfterFromDbRow(w),
  }));

  const mapReviewWidget = (
    w: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
    widgetType: GoogleReviewsItem['widgetType']
  ): GoogleReviewsItem => {
    const business = w.businesses as {
      name: string;
      address: string | null;
      total_reviews: number;
      average_rating: number;
    } | null;

    const reviews: Review[] = (w.cached_reviews ?? []).map(
      (r: Record<string, unknown>) => ({
        id: r.id,
        authorName: r.authorName,
        authorPhotoUrl: r.authorPhotoUrl ?? undefined,
        rating: r.rating,
        text: r.text ?? '',
        relativeTime: r.relativeTime ?? '',
        images: r.images ?? [],
      })
    );

    return {
      id: w.id,
      businessId: w.business_id,
      widgetType,
      name: w.name,
      config: configFromDbRow(w),
      business: business
        ? {
            name: business.name,
            address: business.address ?? '',
            totalReviews: business.total_reviews,
            averageRating: Number(business.average_rating),
          }
        : undefined,
      reviews,
    };
  };

  const googleReviewsItems: GoogleReviewsItem[] = (reviewWidgetRows ?? []).map((w) =>
    mapReviewWidget(w, 'google_reviews')
  );

  const carouselItems: GoogleReviewsItem[] = (carouselWidgetRows ?? []).map((w) =>
    mapReviewWidget(w, 'google_reviews_carousel')
  );

  return (
    <div className="min-h-screen p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">Widgets</h1>
        <p className="mt-1 mb-8 text-neutral-500">
          Select a widget type to manage its embeds.
        </p>

        <WidgetsHome
          beforeAfterItems={beforeAfterItems}
          googleReviewsItems={googleReviewsItems}
          carouselItems={carouselItems}
        />
      </div>
    </div>
  );
}
