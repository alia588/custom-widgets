import { NextResponse } from 'next/server';
import { syncBusinessReviews } from '@/lib/sync-reviews';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const placeId = body.placeId || process.env.SSR_PLACE_ID;

  if (!placeId) {
    return NextResponse.json(
      { error: 'placeId required in request body or SSR_PLACE_ID env var' },
      { status: 400 }
    );
  }

  try {
    const result = await syncBusinessReviews(placeId, body.maxReviews ?? 40);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Sync failed', message }, { status: 502 });
  }
}
