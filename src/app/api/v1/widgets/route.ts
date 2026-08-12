import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAdmin } from '@/lib/require-admin';
import { mapReviewRow } from '@/lib/widget-mappers';

// Creates a Google Reviews widget (used by the home-page modal for
// duplicate — new widgets normally come from scripts/add-business.mjs).
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();

  // Never trust client-supplied identity fields or the joined relation
  delete body.id;
  delete body.created_at;
  delete body.updated_at;
  delete body.businesses;
  delete body.cached_reviews;

  // The dashboard only sends lightweight preview data. Build the canonical
  // snapshot on the server so new and duplicated widgets retain every review.
  if (body.business_id) {
    const { data: reviewRows } = await supabase
      .from('reviews')
      .select('*')
      .eq('business_id', body.business_id);
    body.cached_reviews = (reviewRows ?? []).map(mapReviewRow);
  }

  const { data, error } = await supabase
    .from('widgets')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Create failed', message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
