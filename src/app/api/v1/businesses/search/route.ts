import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (query.length < 3) return NextResponse.json({ results: [] });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY is not configured' }, { status: 503 });
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.rating',
        'places.userRatingCount',
      ].join(','),
    },
    body: JSON.stringify({ textQuery: query, pageSize: 10 }),
    cache: 'no-store',
  });
  const payload = await response.json();
  if (!response.ok) {
    return NextResponse.json(
      { error: payload.error?.message ?? 'Google Maps search failed' },
      { status: response.status || 502 }
    );
  }

  const seen = new Set<string>();
  const results = (payload.places ?? []).flatMap((place: Record<string, unknown>) => {
    const displayName = place.displayName as { text?: unknown } | undefined;
    if (!place.id || typeof displayName?.text !== 'string') return [];
    const placeId = String(place.id);
    if (seen.has(placeId)) return [];
    seen.add(placeId);
    return [{
      id: `google:${placeId}`,
      placeId,
      name: displayName.text,
      address: String(place.formattedAddress ?? ''),
      averageRating: Number(place.rating ?? 0),
      totalReviews: Number(place.userRatingCount ?? 0),
      source: 'google' as const,
    }];
  });

  return NextResponse.json({ results }, {
    headers: { 'Cache-Control': 'private, max-age=300' },
  });
}
