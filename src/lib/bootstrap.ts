// Reads and runtime-validates the bootstrap payload emitted by the
// /api/embeds/widget/[id]/data.js route.
//
// This module is bundled into the Preact embed (public/widget.js) via
// src/embed.tsx, so it must NOT import anything server-only. The payload is a
// JSON literal written into a classic <script> tag; because it comes from an
// edge cache it is treated as untrusted at runtime — getBootstrappedData()
// validates the shape before the components trust it, and falls back to fetch
// (returning null) for anything malformed.

import type { ApiReview } from './widget-mappers';
import { mapBusinessRow } from './widget-mappers';
import type { BusinessInfo } from './reviews-data';

export interface BootstrapReviewsData {
  kind: 'reviews';
  /** Raw `widgets` table row — components map it via configFromDbRow. */
  config: Record<string, unknown>;
  business?: BusinessInfo | null;
  /** Canonical API-shape reviews (mapReviewsToClient normalizes them). */
  reviews?: ApiReview[];
}

export interface BootstrapBeforeAfterData {
  kind: 'before-after';
  /** Raw `before_after_widgets` table row. */
  config: Record<string, unknown>;
}

export type BootstrapData = BootstrapReviewsData | BootstrapBeforeAfterData;

declare global {
  interface Window {
    __BBS_WIDGET_DATA__?: Record<string, unknown>;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Returns the validated bootstrap payload for `widgetId`, or null when absent
 * or malformed (in which case callers fall back to the fetch path).
 */
export function getBootstrappedData(widgetId: string): BootstrapData | null {
  if (typeof window === 'undefined') return null;

  const raw = window.__BBS_WIDGET_DATA__?.[widgetId];
  if (!isRecord(raw)) return null;

  const { kind, config } = raw;
  if (kind !== 'reviews' && kind !== 'before-after') return null;
  if (!isRecord(config)) return null;

  if (kind === 'reviews') {
    const { business, reviews } = raw;
    if (business !== undefined && !isRecord(business)) return null;
    if (reviews !== undefined && !Array.isArray(reviews)) return null;

    const data: BootstrapReviewsData = { kind, config };
    if (isRecord(business)) data.business = mapBusinessRow(business);
    if (Array.isArray(reviews)) data.reviews = reviews as ApiReview[];
    return data;
  }

  return { kind, config };
}
