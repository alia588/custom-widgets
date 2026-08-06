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
    .from('before_after_widgets')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Widget not found' },
      { status: 404, headers: cors.headers }
    );
  }

  return NextResponse.json(data, { headers: cors.headers });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Prevent id tampering
  delete body.id;
  delete body.created_at;

  const { data, error } = await supabase
    .from('before_after_widgets')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Update failed', message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase
    .from('before_after_widgets')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: 'Delete failed', message: error.message },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
