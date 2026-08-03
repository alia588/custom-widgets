// Scrape.do Google Maps Reviews API client.
// Docs: https://scrape.do/documentation/google-scraper-api/maps/reviews/

export interface ScrapeDoReview {
  review_id?: string;
  rating?: number;
  date?: string;
  snippet?: string;
  images?: string[];
  user?: {
    name?: string;
    thumbnail?: string;
    link?: string;
  };
}

export interface ScrapeDoPlaceInfo {
  title?: string;
  address?: string;
  rating?: number;
  reviews?: number;
  type?: string;
}

interface ScrapeDoPage {
  reviews?: ScrapeDoReview[];
  place_info?: ScrapeDoPlaceInfo;
  pagination?: { next_page_token?: string };
}

const ENDPOINT = 'https://api.scrape.do/plugin/google/maps/reviews';

async function fetchPage(
  placeId: string,
  token: string,
  num: number,
  pageToken?: string
): Promise<ScrapeDoPage> {
  const url = new URL(ENDPOINT);
  url.searchParams.set('token', token);
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('num', String(num));
  if (pageToken) url.searchParams.set('next_page_token', pageToken);

  // Per docs: a transient 502 on a page that should exist is recoverable — retry once.
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(url);
    if (response.ok) return response.json();

    const text = await response.text();
    lastError = new Error(`Scrape.do HTTP ${response.status}: ${text}`);
    if (response.status !== 502) break;
  }

  throw lastError;
}

export async function fetchAllScrapeDoReviews(
  placeId: string,
  token: string,
  maxReviews = 40
): Promise<{
  reviews: ScrapeDoReview[];
  place_info?: ScrapeDoPlaceInfo;
  fetchedPages: number;
}> {
  const all: ScrapeDoReview[] = [];
  let pageToken: string | undefined;
  let fetchedPages = 0;
  let placeInfo: ScrapeDoPlaceInfo | undefined;

  while (all.length < maxReviews) {
    const num = Math.min(20, maxReviews - all.length);
    const page = await fetchPage(placeId, token, num, pageToken);
    fetchedPages += 1;

    if (!placeInfo && page.place_info) placeInfo = page.place_info;

    const reviews = page.reviews ?? [];
    if (reviews.length === 0) break;

    all.push(...reviews);

    pageToken = page.pagination?.next_page_token;
    if (!pageToken) break;
  }

  return {
    reviews: all.slice(0, maxReviews),
    place_info: placeInfo,
    fetchedPages,
  };
}
