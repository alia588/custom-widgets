import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (query.length < 3) return NextResponse.json({ results: [] });

  const apiKey = process.env.SEARCHAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'SEARCHAPI_API_KEY is not configured' }, { status: 503 });
  }

  const url = new URL('https://www.searchapi.io/api/v1/search');
  url.searchParams.set('engine', 'google_maps');
  url.searchParams.set('q', query);
  url.searchParams.set('api_key', apiKey);

  const response = await fetch(url, { cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok || payload.error) {
    return NextResponse.json(
      { error: payload.error ?? 'Google Maps search failed' },
      { status: response.status || 502 }
    );
  }

  const seen = new Set<string>();
  const results = (payload.local_results ?? []).flatMap((place: Record<string, unknown>) => {
    if (!place.place_id || !place.title) return [];
    const placeId = String(place.place_id);
    if (seen.has(placeId)) return [];
    seen.add(placeId);
    return [{
      id: `google:${placeId}`,
      placeId,
      dataId: typeof place.data_id === 'string' ? place.data_id : undefined,
      name: String(place.title),
      address: String(place.address ?? ''),
      averageRating: Number(place.rating ?? 0),
      totalReviews: Number(place.reviews ?? 0),
      source: 'google' as const,
    }];
  }).slice(0, 10);

  return NextResponse.json({ results }, {
    headers: { 'Cache-Control': 'private, max-age=300' },
  });
}
