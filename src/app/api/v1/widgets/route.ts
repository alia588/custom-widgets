import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// Creates a Google Reviews widget (used by the home-page modal for
// duplicate — new widgets normally come from scripts/add-business.mjs).
export async function POST(request: Request) {
  const body = await request.json();

  // Never trust client-supplied identity fields or the joined relation
  delete body.id;
  delete body.created_at;
  delete body.updated_at;
  delete body.businesses;

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
