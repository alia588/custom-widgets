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

  // Prevent id/business_id tampering
  delete body.id;
  delete body.business_id;
  delete body.created_at;

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
