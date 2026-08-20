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
  apiOrigin: string
): Promise<WidgetApiResponse> {
  return dedupe(`${apiOrigin}/api/v1/widgets/${widgetId}`, async () => {
    const res = await fetch(`${apiOrigin}/api/v1/widgets/${widgetId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<WidgetApiResponse>;
  });
}

export function getWidgetReviews(
  widgetId: string,
  apiOrigin: string
): Promise<ReviewsApiResponse> {
  return dedupe(`${apiOrigin}/api/v1/widgets/${widgetId}/reviews`, async () => {
    const res = await fetch(`${apiOrigin}/api/v1/widgets/${widgetId}/reviews`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<ReviewsApiResponse>;
  });
}

export function getBeforeAfterWidget(
  widgetId: string,
  apiOrigin: string
): Promise<Record<string, unknown>> {
  return dedupe(`${apiOrigin}/api/v1/before-after-widgets/${widgetId}`, async () => {
    const res = await fetch(`${apiOrigin}/api/v1/before-after-widgets/${widgetId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<Record<string, unknown>>;
  });
}

export function getFormWidget(
  widgetId: string,
  apiOrigin: string
): Promise<Record<string, unknown>> {
  return dedupe(`${apiOrigin}/api/v1/form-widgets/${widgetId}`, async () => {
    const res = await fetch(`${apiOrigin}/api/v1/form-widgets/${widgetId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<Record<string, unknown>>;
  });
}
