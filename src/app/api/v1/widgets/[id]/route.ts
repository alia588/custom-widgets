import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// The embed script on external sites (GHL etc.) fetches this route
// cross-origin, so permissive CORS headers are required.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('widgets')
    .select('*, businesses(name, place_id, address, total_reviews, average_rating)')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Widget not found' },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(data, { headers: CORS_HEADERS });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Prevent identity tampering (business_id is allowed: editors can
  // re-point a widget at a different business)
  delete body.id;
  delete body.created_at;

  // When (re)assigning a business, refresh the cached reviews so embeds
  // don't keep serving the previous business's reviews.
  if (body.business_id) {
    const { data: reviewRows } = await supabase
      .from('reviews')
      .select('*')
      .eq('business_id', body.business_id);

    body.cached_reviews = (reviewRows ?? []).map((r) => ({
      id: r.google_review_id ?? r.id,
      authorName: r.author_name ?? 'Anonymous',
      authorPhotoUrl: r.author_photo_url ?? undefined,
      rating: r.rating,
      text: r.text ?? '',
      relativeTime: r.relative_time ?? '',
      images: r.images ?? [],
    }));
  }

  const { data, error } = await supabase
    .from('widgets')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Update failed', message: error.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(data, { headers: CORS_HEADERS });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase.from('widgets').delete().eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: 'Delete failed', message: error.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
