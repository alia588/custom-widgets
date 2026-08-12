import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAdmin } from '@/lib/require-admin';

// Creates a before/after widget (used by the home-page modal for
// "Create New" and duplicate).
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();

  // Never trust client-supplied identity fields
  delete body.id;
  delete body.created_at;
  delete body.updated_at;

  const { data, error } = await supabase
    .from('before_after_widgets')
    .insert(body)
    .select()
    .single();

  if (error) {
    const migrationMissing = error.message.includes("'auto_slide' column");
    return NextResponse.json(
      {
        error: 'Create failed',
        message: migrationMissing
          ? 'Database migration 015_before_after_auto_slide.sql has not been applied.'
          : error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
