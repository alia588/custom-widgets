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

// The live API currently reports these accepted values in its 400 response.
// Scrape.do's public documentation still lists older camel-case values.
export type ScrapeDoReviewSort =
  | 'relevance'
  | 'newest'
  | 'highest_rating'
  | 'lowest_rating';

interface ScrapeDoPage {
  reviews?: ScrapeDoReview[];
  place_info?: ScrapeDoPlaceInfo;
  pagination?: { next_page_token?: string };
  search_parameters?: { data_id?: string };
}

const ENDPOINT = 'https://api.scrape.do/plugin/google/maps/reviews';
const PAGE_SIZE = 20;
const DEFAULT_PREMATURE_END_RETRIES = 2;
const DEFAULT_PREMATURE_END_RETRY_DELAY_MS = 500;

export type ScrapeDoStopReason =
  | 'target_reached'
  | 'empty_page'
  | 'missing_next_page_token';

export interface ScrapeDoPageDiagnostic {
  page: number;
  reviewCount: number;
  attempts: number;
  hasNextPageToken: boolean;
  identifier: 'data_id' | 'place_id';
}

export interface ScrapeDoFetchOptions {
  dataId?: string | null;
  expectedReviewCount?: number | null;
  prematureEndRetries?: number;
  prematureEndRetryDelayMs?: number;
}

export interface ScrapeDoReviewsResult {
  reviews: ScrapeDoReview[];
  place_info?: ScrapeDoPlaceInfo;
  dataId?: string;
  fetchedPages: number;
  requestsMade: number;
  targetReviews: number;
  complete: boolean;
  stopReason: ScrapeDoStopReason;
  pageDiagnostics: ScrapeDoPageDiagnostic[];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(
  placeId: string,
  dataId: string | undefined,
  token: string,
  num: number,
  pageToken?: string,
  sortBy?: ScrapeDoReviewSort
): Promise<{ page: ScrapeDoPage; attempts: number }> {
  const url = new URL(ENDPOINT);
  url.searchParams.set('token', token);
  if (dataId) url.searchParams.set('data_id', dataId);
  else url.searchParams.set('place_id', placeId);
  url.searchParams.set('num', String(num));
  if (pageToken) url.searchParams.set('next_page_token', pageToken);
  if (sortBy) url.searchParams.set('sort_by', sortBy);

  // Per docs: a transient 502 on a page that should exist is recoverable — retry once.
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(url);
    if (response.ok) {
      return { page: await response.json(), attempts: attempt + 1 };
    }

    const text = await response.text();
    lastError = new Error(`Scrape.do HTTP ${response.status}: ${text}`);
    if (response.status !== 502) break;
  }

  throw lastError ?? new Error('Scrape.do request failed');
}

function reviewTarget(
  maxReviews: number,
  placeInfo: ScrapeDoPlaceInfo | undefined,
  expectedReviewCount: number | null | undefined
) {
  const available = placeInfo?.reviews ?? expectedReviewCount;
  return typeof available === 'number' && Number.isFinite(available) && available >= 0
    ? Math.min(maxReviews, available)
    : maxReviews;
}

export async function fetchAllScrapeDoReviews(
  placeId: string,
  token: string,
  maxReviews = 40,
  sortBy?: ScrapeDoReviewSort,
  options: ScrapeDoFetchOptions = {}
): Promise<ScrapeDoReviewsResult> {
  const all: ScrapeDoReview[] = [];
  let pageToken: string | undefined;
  let fetchedPages = 0;
  let requestsMade = 0;
  let placeInfo: ScrapeDoPlaceInfo | undefined;
  let resolvedDataId = options.dataId ?? undefined;
  let stopReason: ScrapeDoStopReason = 'target_reached';
  const pageDiagnostics: ScrapeDoPageDiagnostic[] = [];
  const prematureEndRetries = Math.max(
    0,
    options.prematureEndRetries ?? DEFAULT_PREMATURE_END_RETRIES
  );
  const retryDelayMs = Math.max(
    0,
    options.prematureEndRetryDelayMs ?? DEFAULT_PREMATURE_END_RETRY_DELAY_MS
  );

  while (all.length < maxReviews) {
    const num = Math.min(PAGE_SIZE, maxReviews - all.length);
    const requestDataId = resolvedDataId;
    let acceptedPage: ScrapeDoPage | undefined;
    let bestTerminalPage: ScrapeDoPage | undefined;
    let pageAttempts = 0;

    for (let retry = 0; retry <= prematureEndRetries; retry += 1) {
      const result = await fetchPage(
        placeId,
        requestDataId,
        token,
        num,
        pageToken,
        sortBy
      );
      requestsMade += result.attempts;
      pageAttempts += result.attempts;

      const page = result.page;
      if (!placeInfo && page.place_info) placeInfo = page.place_info;
      if (page.search_parameters?.data_id) {
        resolvedDataId = page.search_parameters.data_id;
      }

      const reviews = page.reviews ?? [];
      if (
        !bestTerminalPage ||
        reviews.length > (bestTerminalPage.reviews?.length ?? 0)
      ) {
        bestTerminalPage = page;
      }

      const target = reviewTarget(
        maxReviews,
        placeInfo,
        options.expectedReviewCount
      );
      const terminal = reviews.length === 0 || !page.pagination?.next_page_token;
      const premature = terminal && all.length + reviews.length < target;

      if (!premature) {
        acceptedPage = page;
        break;
      }

      if (retry < prematureEndRetries && retryDelayMs > 0) {
        await sleep(retryDelayMs * 2 ** retry);
      }
    }

    const page = acceptedPage ?? bestTerminalPage ?? {};
    fetchedPages += 1;

    const reviews = page.reviews ?? [];
    const nextPageToken = page.pagination?.next_page_token;
    pageDiagnostics.push({
      page: fetchedPages,
      reviewCount: reviews.length,
      attempts: pageAttempts,
      hasNextPageToken: Boolean(nextPageToken),
      identifier: requestDataId ? 'data_id' : 'place_id',
    });

    if (reviews.length === 0) {
      stopReason = 'empty_page';
      break;
    }

    all.push(...reviews);

    if (all.length >= maxReviews) {
      stopReason = 'target_reached';
      break;
    }

    pageToken = nextPageToken;
    if (!pageToken) {
      stopReason = 'missing_next_page_token';
      break;
    }
  }

  const targetReviews = reviewTarget(
    maxReviews,
    placeInfo,
    options.expectedReviewCount
  );
  const sliced = all.slice(0, maxReviews);

  return {
    reviews: sliced,
    place_info: placeInfo,
    dataId: resolvedDataId,
    fetchedPages,
    requestsMade,
    targetReviews,
    complete: sliced.length >= targetReviews,
    stopReason,
    pageDiagnostics,
  };
}
