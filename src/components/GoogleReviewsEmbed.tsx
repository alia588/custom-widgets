'use client';

import { useEffect, useState } from 'react';
import type { BusinessInfo, Review } from '@/lib/reviews-data';
import type { WidgetConfig } from '@/lib/widget-config';
import { configFromDbRow } from '@/lib/widget-config';
import { GoogleReviewsWidget } from './GoogleReviewsWidget';

interface WidgetApiResponse {
  id: string;
  businesses?: {
    name: string;
    address: string | null;
    total_reviews: number;
    average_rating: number;
  } | null;
  cached_reviews?: {
    id: string;
    authorName: string;
    authorPhotoUrl?: string | null;
    rating: number;
    text: string;
    relativeTime: string;
    images?: string[];
  }[];
  [key: string]: unknown;
}

/**
 * Embed loader: fetches the widget's config + cached reviews from the host
 * app's API and renders the badge. Used by public/widget.js on external sites
 * (GHL etc.) — the page only provides the widget ID via data attribute.
 */
export function GoogleReviewsEmbed({
  widgetId,
  apiOrigin = '',
}: {
  widgetId: string;
  apiOrigin?: string;
}) {
  const [data, setData] = useState<{
    config: WidgetConfig;
    business?: BusinessInfo;
    reviews?: Review[];
  } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`${apiOrigin}/api/v1/widgets/${widgetId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<WidgetApiResponse>;
      })
      .then((row) => {
        if (cancelled) return;
        const business: BusinessInfo | undefined = row.businesses
          ? {
              name: row.businesses.name,
              address: row.businesses.address ?? '',
              totalReviews: row.businesses.total_reviews,
              averageRating: Number(row.businesses.average_rating),
            }
          : undefined;
        const reviews: Review[] | undefined = row.cached_reviews?.map((r) => ({
          id: r.id,
          authorName: r.authorName,
          authorPhotoUrl: r.authorPhotoUrl ?? undefined,
          rating: r.rating,
          text: r.text ?? '',
          relativeTime: r.relativeTime ?? '',
          images: r.images ?? [],
        }));
        setData({ config: configFromDbRow(row), business, reviews });
      })
      .catch((err) => {
        console.warn(`[custom-widgets] Failed to load widget ${widgetId}:`, err);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [widgetId, apiOrigin]);

  if (failed || !data) return null;

  return (
    <GoogleReviewsWidget
      widgetId={widgetId}
      config={data.config}
      business={data.business}
      reviews={data.reviews}
    />
  );
}
