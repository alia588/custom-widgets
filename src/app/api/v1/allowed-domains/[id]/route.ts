import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { normalizeDomain } from '@/lib/domain-utils';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;

  let body: { domain?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const domain = normalizeDomain(body.domain ?? '');
  if (!domain) {
    return NextResponse.json(
      { error: 'Domain is required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('allowed_domains')
    .update({ domain })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update domain', message: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
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

  const { error, count } = await supabase
    .from('allowed_domains')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete domain', message: error.message },
      { status: 500 }
    );
  }

  if (!count) {
    return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
