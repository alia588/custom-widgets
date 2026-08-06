// Shared, dependency-free mapping helpers between the DB row shapes and the
// shapes consumed by the embed components and the bootstrap data.js payload.
//
// This module is bundled into the Preact embed (public/widget.js) via
// src/embed.tsx, so it must NOT import anything server-only (next/server,
// supabase client, etc.). It is also imported by API routes on the server.
//
// The canonical review shape served by the API (and stored in the `widgets`
// table's `cached_reviews` column) comes from the PATCH handler in
// src/app/api/v1/widgets/[id]/route.ts — see mapReviewRow below.

import type { BusinessInfo, Review } from './reviews-data';

/** Canonical review shape served by the reviews API / bootstrap payload. */
export interface ApiReview {
  id: string;
  authorName: string;
  authorPhotoUrl?: string | null;
  rating: number;
  text: string;
  relativeTime: string;
  images?: string[] | null;
}

export interface ReviewsApiResponse {
  reviews: ApiReview[];
}

/**
 * A row that can be mapped to the canonical review shape: either a raw
 * `reviews` table row (snake_case) or an already-mapped cached review
 * (camelCase). Accepting both makes the mapper idempotent, so it is safe to
 * run over `cached_reviews` (which is stored in canonical camelCase form).
 */
export interface ReviewRowLike {
  google_review_id?: string | null;
  id?: string | null;
  author_name?: string | null;
  authorName?: string | null;
  author_photo_url?: string | null;
  authorPhotoUrl?: string | null;
  rating?: number | null;
  text?: string | null;
  relative_time?: string | null;
  relativeTime?: string | null;
  images?: string[] | null;
}

/** Canonical mapping used by the widgets PATCH handler and the data.js route. */
export function mapReviewRow(r: ReviewRowLike): ApiReview {
  return {
    id: r.google_review_id ?? r.id ?? '',
    authorName: r.author_name ?? r.authorName ?? 'Anonymous',
    authorPhotoUrl: r.author_photo_url ?? r.authorPhotoUrl ?? undefined,
    rating: r.rating ?? 0,
    text: r.text ?? '',
    relativeTime: r.relative_time ?? r.relativeTime ?? '',
    images: r.images ?? [],
  };
}

/** Normalizes canonical API reviews into the client `Review` shape. */
export function mapReviewsToClient(reviews: ApiReview[]): Review[] {
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
 * The `businesses(...)` join object on a widget row. Supabase's type-level
 * select parser types to-one joins as arrays even though the runtime value is
 * an object, so mapBusinessRow accepts `unknown` and narrows at runtime.
 */
export interface BusinessJoinShape {
  name: string | null;
  address: string | null;
  total_reviews: number | null;
  average_rating: number | null;
}

/** Maps the joined businesses row to the client `BusinessInfo` shape. */
export function mapBusinessRow(business: unknown): BusinessInfo | undefined {
  if (
    typeof business !== 'object' ||
    business === null ||
    Array.isArray(business)
  ) {
    return undefined;
  }
  const b = business as Record<string, unknown>;
  return {
    name: typeof b.name === 'string' ? b.name : '',
    address: typeof b.address === 'string' ? b.address : '',
    totalReviews: Number(b.total_reviews ?? 0),
    averageRating: Number(b.average_rating ?? 0),
  };
}
