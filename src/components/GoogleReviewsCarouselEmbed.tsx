'use client';

import { useEffect, useState } from 'react';
import type { BusinessInfo, Review } from '@/lib/reviews-data';
import type { WidgetConfig } from '@/lib/widget-config';
import { configFromDbRow } from '@/lib/widget-config';
import { GoogleReviewsCarousel } from './GoogleReviewsCarousel';
import { WidgetSkeleton } from './WidgetSkeleton';

interface WidgetApiResponse {
  id: string;
  businesses?: {
    name: string;
    address: string | null;
    total_reviews: number;
    average_rating: number;
  } | null;
  [key: string]: unknown;
}

interface ReviewsApiResponse {
  reviews: {
    id: string;
    authorName: string;
    authorPhotoUrl?: string | null;
    rating: number;
    text: string;
    relativeTime: string;
    images?: string[];
  }[];
}

function mapReviews(reviews: ReviewsApiResponse['reviews']): Review[] {
  return reviews.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    authorPhotoUrl: r.authorPhotoUrl ?? undefined,
    rating: r.rating,
    text: r.text ?? '',
    relativeTime: r.relativeTime ?? '',
    images: r.images ?? [],
  }));
}

/**
 * Embed loader: fetches the carousel widget's config first (small payload) so
 * the container can paint immediately, then loads reviews. Used by
 * public/widget.js on external sites.
 */
export function GoogleReviewsCarouselEmbed({
  widgetId,
  apiOrigin = '',
}: {
  widgetId: string;
  apiOrigin?: string;
}) {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [business, setBusiness] = useState<BusinessInfo | undefined>(undefined);
  const [reviews, setReviews] = useState<Review[] | undefined>(undefined);
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
        const businessInfo: BusinessInfo | undefined = row.businesses
          ? {
              name: row.businesses.name,
              address: row.businesses.address ?? '',
              totalReviews: row.businesses.total_reviews,
              averageRating: Number(row.businesses.average_rating),
            }
          : undefined;
        setConfig(configFromDbRow(row));
        setBusiness(businessInfo);
      })
      .catch((err) => {
        console.warn(`[custom-widgets] Failed to load widget ${widgetId}:`, err);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [widgetId, apiOrigin]);

  useEffect(() => {
    let cancelled = false;

    fetch(`${apiOrigin}/api/v1/widgets/${widgetId}/reviews`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ReviewsApiResponse>;
      })
      .then((data) => {
        if (!cancelled) setReviews(mapReviews(data.reviews));
      })
      .catch((err) => {
        console.warn(`[custom-widgets] Failed to load reviews for ${widgetId}:`, err);
      });

    return () => {
      cancelled = true;
    };
  }, [widgetId, apiOrigin]);

  if (failed) return null;
  if (!config) return <WidgetSkeleton />;

  return (
    <GoogleReviewsCarousel
      config={config}
      business={business}
      reviews={reviews}
    />
  );
}
