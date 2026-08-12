import { supabase } from '@/lib/db';
import { beforeAfterFromDbRow } from '@/lib/before-after-config';
import { configFromDbRow } from '@/lib/widget-config';
import { getEmbedBundlePath } from '@/lib/embed-bundle';
import { WIDGET_SELECT } from '@/lib/widget-queries';
import {
  WidgetsHome,
  type BeforeAfterItem,
  type GoogleReviewsItem,
} from '@/components/WidgetsHome';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [embedBundlePath, { data: beforeAfterRows }, { data: reviewWidgetRows }, { data: carouselWidgetRows }] =
    await Promise.all([
      getEmbedBundlePath(),
      supabase.from('before_after_widgets').select('*').order('created_at', { ascending: false }),
      supabase
        .from('widgets')
        .select(WIDGET_SELECT)
        .eq('widget_type', 'google_reviews')
        .order('created_at', { ascending: false }),
      supabase
        .from('widgets')
        .select(WIDGET_SELECT)
        .eq('widget_type', 'google_reviews_carousel')
        .order('created_at', { ascending: false }),
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
      // The home screen deliberately does not select cached_reviews. Those
      // image-heavy payloads are only needed by an editor or live embed and
      // were making every dashboard action wait on every widget's reviews.
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
        <p className="mt-1 mb-8 text-[var(--color-text-secondary)]">
          Select a widget type to manage its embeds.
        </p>

        <WidgetsHome
          beforeAfterItems={beforeAfterItems}
          googleReviewsItems={googleReviewsItems}
          carouselItems={carouselItems}
          embedBundlePath={embedBundlePath}
        />
      </div>
    </div>
  );
}
