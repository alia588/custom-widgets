import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import {
  getAllowedDomains,
  getWidgetCorsHeaders,
} from '@/lib/domain-utils';

export async function OPTIONS(request: Request) {
  const allowedDomains = await getAllowedDomains();
  const cors = getWidgetCorsHeaders(request, allowedDomains);

  return new NextResponse(null, {
    status: cors.allowed ? 204 : 403,
    headers: cors.headers,
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
      { status: 403, headers: cors.headers }
    );
  }

  const { data, error } = await supabase
    .from('widgets')
    .select('cached_reviews')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Widget not found' },
      { status: 404, headers: cors.headers }
    );
  }

  return NextResponse.json(
    { reviews: data.cached_reviews ?? [] },
    { headers: cors.headers }
  );
}
