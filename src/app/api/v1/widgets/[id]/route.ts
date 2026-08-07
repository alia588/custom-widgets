import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { reportCritical } from '@/lib/alerts';
import {
  getAllowedDomains,
  getWidgetCorsHeaders,
} from '@/lib/domain-utils';
import { NO_STORE, WIDGET_CACHE_CONTROL } from '@/lib/cache-headers';
import { WIDGET_SELECT } from '@/lib/widget-queries';
import { mapReviewRow } from '@/lib/widget-mappers';
import { requireAdmin } from '@/lib/require-admin';

export async function OPTIONS(request: Request) {
  const allowedDomains = await getAllowedDomains();
  const cors = getWidgetCorsHeaders(request, allowedDomains);

  return new NextResponse(null, {
    status: cors.allowed ? 204 : 403,
    headers: cors.allowed
      ? cors.headers
      : { ...cors.headers, 'Cache-Control': NO_STORE },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const allowedDomains = await getAllowedDomains();
  const cors = getWidgetCorsHeaders(request, allowedDomains);

  if (!cors.allowed) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403, headers: { ...cors.headers, 'Cache-Control': NO_STORE } }
    );
  }

  const { data, error } = await supabase
    .from('widgets')
    .select(WIDGET_SELECT)
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Widget not found' },
      { status: 404, headers: { ...cors.headers, 'Cache-Control': NO_STORE } }
    );
  }

  return NextResponse.json(data, {
    headers: { ...cors.headers, 'Cache-Control': WIDGET_CACHE_CONTROL },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();

  // Prevent identity tampering (business_id is allowed: editors can
  // re-point a widget at a different business)
  delete body.id;
  delete body.created_at;

  // When (re)assigning a business, refresh the cached reviews so embeds
  // don't keep serving the previous business's reviews. The canonical
  // review mapping lives in mapReviewRow (shared with the data.js route).
  if (body.business_id) {
    const { data: reviewRows } = await supabase
      .from('reviews')
      .select('*')
      .eq('business_id', body.business_id);

    body.cached_reviews = (reviewRows ?? []).map(mapReviewRow);
  }

  const { data, error } = await supabase
    .from('widgets')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    await reportCritical({
      title: 'Widget update failed',
      message: error.message,
      fingerprint: `widget-update-failed:${id}`,
    });
    return NextResponse.json(
      { error: 'Update failed', message: error.message },
      { status: 500, headers: { 'Cache-Control': NO_STORE } }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;

  const { error } = await supabase.from('widgets').delete().eq('id', id);

  if (error) {
    await reportCritical({
      title: 'Widget delete failed',
      message: error.message,
      fingerprint: `widget-delete-failed:${id}`,
    });
    return NextResponse.json(
      { error: 'Delete failed', message: error.message },
      { status: 500, headers: { 'Cache-Control': NO_STORE } }
    );
  }

  return new NextResponse(null, { status: 204 });
}
