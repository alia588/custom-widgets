import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import {
  getAllowedDomains,
  getRequestOrigin,
  isOriginAllowed,
} from '@/lib/domain-utils';
import { WIDGET_SELECT_WITH_REVIEWS } from '@/lib/widget-queries';
import { mapBusinessRow, mapReviewRow } from '@/lib/widget-mappers';
import { NO_STORE, WIDGET_CACHE_CONTROL } from '@/lib/cache-headers';

// Strict UUID: only hex + dashes may ever be interpolated into the emitted
// script outside the JSON payload.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Serializes a payload into JS-safe form for embedding in a <script> block:
 * JSON.stringify, then escape `<` (kills `</script>` breakout), plus the
 * legacy JS line-separator characters U+2028/U+2029.
 */
function safeJsString(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Bootstrap data route: emits `window.__BBS_WIDGET_DATA__["<id>"] = {...}` as
 * a classic blocking script (spec amendment 6). The payload carries the
 * widget config (+ business + cached reviews for reviews-kind widgets) so the
 * embed's first React paint is the real widget, no skeleton.
 *
 * Access control (spec amendment 1): when an Origin/Referer header is
 * present, it must match the allowed_domains allowlist; when the headers are
 * absent (privacy tools strip Referer) the data is served — a documented,
 * deliberate trade-off since the content is public reviews + styling config.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return new NextResponse('Invalid widget id', {
      status: 400,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': NO_STORE,
      },
    });
  }

  const allowedDomains = await getAllowedDomains();
  const origin = getRequestOrigin(request);
  if (origin && !isOriginAllowed(origin, allowedDomains)) {
    return new NextResponse('Origin not allowed', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': NO_STORE,
        'Vary': 'Origin',
      },
    });
  }

  // Query both tables in parallel and use whichever hits (spec amendment 9).
  const [widgetResult, beforeAfterResult] = await Promise.all([
    supabase
      .from('widgets')
      .select(WIDGET_SELECT_WITH_REVIEWS)
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('before_after_widgets')
      .select('*')
      .eq('id', id)
      .maybeSingle(),
  ]);

  let payload: unknown;

  if (!widgetResult.error && widgetResult.data) {
    payload = {
      kind: 'reviews',
      // Raw widget row — components map it via configFromDbRow.
      config: widgetResult.data,
      // Business mapped to the shape the components build today
      // ({name, address, totalReviews, averageRating}).
      business: mapBusinessRow(widgetResult.data.businesses ?? null),
      // Cached reviews run through the same canonical mapping as the PATCH
      // handler (mapReviewRow is idempotent for already-mapped rows).
      reviews: (widgetResult.data.cached_reviews ?? []).map(mapReviewRow),
    };
  } else if (!beforeAfterResult.error && beforeAfterResult.data) {
    payload = { kind: 'before-after', config: beforeAfterResult.data };
  } else {
    return new NextResponse('Widget not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': NO_STORE,
      },
    });
  }

  const body =
    `window.__BBS_WIDGET_DATA__=window.__BBS_WIDGET_DATA__||{};` +
    `window.__BBS_WIDGET_DATA__["${id}"]=${safeJsString(payload)};`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': WIDGET_CACHE_CONTROL,
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
