// Deduped, promise-cached fetchers for the widget APIs.
//
// This module is bundled into the Preact embed (public/widget.js) via
// src/embed.tsx, so it must NOT import anything server-only. Both the
// script-eval-time prefetch pass (src/embed.tsx) and the embed components
// consume the same shared promises, so a request is only ever issued once per
// page view per URL.

import type { ApiReview, BusinessJoinShape } from './widget-mappers';

export interface WidgetApiResponse {
  id: string;
  businesses?: BusinessJoinShape | null;
  [key: string]: unknown;
}

export interface ReviewsApiResponse {
  reviews: ApiReview[];
}

const pending = new Map<string, Promise<unknown>>();

/**
 * Returns the in-flight/cached promise for `key`, or starts `run` once.
 * Failed requests are evicted so a later caller can retry (e.g. a transient
 * network error); successful responses stay cached for the page lifetime.
 */
function dedupe<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = pending.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = run();
  pending.set(key, promise);
  promise.catch(() => {
    pending.delete(key);
  });
  return promise;
}

export function getWidgetConfig(
  widgetId: string,
  apiOrigin: string,
  revalidate = false
): Promise<WidgetApiResponse> {
  return dedupe(`${apiOrigin}/api/v1/widgets/${widgetId}:${revalidate ? 'revalidate' : 'default'}`, async () => {
    const res = await fetch(`${apiOrigin}/api/v1/widgets/${widgetId}`, {
      // A bootstrapped widget is already visible. Ask caches to validate this
      // background request so an old stale-while-revalidate response never
      // keeps an editor update stale for the whole page view.
      cache: revalidate ? 'no-cache' : 'default',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<WidgetApiResponse>;
  });
}

export function getWidgetReviews(
  widgetId: string,
  apiOrigin: string,
  revalidate = false
): Promise<ReviewsApiResponse> {
  return dedupe(`${apiOrigin}/api/v1/widgets/${widgetId}/reviews:${revalidate ? 'revalidate' : 'default'}`, async () => {
    const res = await fetch(`${apiOrigin}/api/v1/widgets/${widgetId}/reviews`, {
      cache: revalidate ? 'no-cache' : 'default',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<ReviewsApiResponse>;
  });
}

export function getBeforeAfterWidget(
  widgetId: string,
  apiOrigin: string,
  revalidate = false
): Promise<Record<string, unknown>> {
  return dedupe(`${apiOrigin}/api/v1/before-after-widgets/${widgetId}:${revalidate ? 'revalidate' : 'default'}`, async () => {
    const res = await fetch(`${apiOrigin}/api/v1/before-after-widgets/${widgetId}`, {
      cache: revalidate ? 'no-cache' : 'default',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<Record<string, unknown>>;
  });
}
