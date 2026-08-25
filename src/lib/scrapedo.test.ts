import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAllScrapeDoReviews } from './scrapedo';

describe('fetchAllScrapeDoReviews', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches exactly one newest-first page when limited to 20 reviews', async () => {
    const reviews = Array.from({ length: 20 }, (_, index) => ({
      review_id: `review-${index + 1}`,
      rating: 5,
    }));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reviews,
        pagination: { next_page_token: 'unused-next-page' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchAllScrapeDoReviews(
      'ChIJ-test-place',
      'test-token',
      20,
      'newest'
    );

    expect(result.reviews).toHaveLength(20);
    expect(result.fetchedPages).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requestedUrl.searchParams.get('place_id')).toBe('ChIJ-test-place');
    expect(requestedUrl.searchParams.get('num')).toBe('20');
    expect(requestedUrl.searchParams.get('sort_by')).toBe('newest');
  });

  it('paginates through up to 500 newest-first reviews', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: URL | RequestInfo) => {
      const requestedUrl = new URL(String(input));
      const pageToken = requestedUrl.searchParams.get('next_page_token');
      const pageIndex = pageToken ? Number(pageToken.replace('page-', '')) : 0;
      const reviews = Array.from({ length: 20 }, (_, index) => ({
        review_id: `review-${pageIndex * 20 + index + 1}`,
        rating: 5,
      }));

      return {
        ok: true,
        json: async () => ({
          reviews,
          pagination:
            pageIndex < 24 ? { next_page_token: `page-${pageIndex + 1}` } : undefined,
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchAllScrapeDoReviews(
      'ChIJ-test-place',
      'test-token',
      500,
      'newest'
    );

    expect(result.reviews).toHaveLength(500);
    expect(result.fetchedPages).toBe(25);
    expect(fetchMock).toHaveBeenCalledTimes(25);

    for (const call of fetchMock.mock.calls) {
      const requestedUrl = new URL(String(call[0]));
      expect(requestedUrl.searchParams.get('num')).toBe('20');
      expect(requestedUrl.searchParams.get('sort_by')).toBe('newest');
    }
  });

  it('retries a premature missing pagination token before accepting a partial result', async () => {
    const reviews = Array.from({ length: 20 }, (_, index) => ({
      review_id: `review-${index + 1}`,
      rating: 5,
    }));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        place_info: { reviews: 2_111 },
        reviews,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchAllScrapeDoReviews(
      'ChIJ-test-place',
      'test-token',
      500,
      'newest',
      { prematureEndRetryDelayMs: 0 }
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.reviews).toHaveLength(20);
    expect(result.complete).toBe(false);
    expect(result.stopReason).toBe('missing_next_page_token');
    expect(result.targetReviews).toBe(500);
    expect(result.requestsMade).toBe(3);
    expect(result.pageDiagnostics).toEqual([
      {
        page: 1,
        reviewCount: 20,
        attempts: 3,
        hasNextPageToken: false,
        identifier: 'place_id',
      },
    ]);
  });

  it('continues when a retry recovers a missing pagination token', async () => {
    const firstPage = Array.from({ length: 20 }, (_, index) => ({
      review_id: `review-${index + 1}`,
      rating: 5,
    }));
    const secondPage = Array.from({ length: 20 }, (_, index) => ({
      review_id: `review-${index + 21}`,
      rating: 5,
    }));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ place_info: { reviews: 100 }, reviews: firstPage }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ place_info: { reviews: 100 }, reviews: firstPage }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          place_info: { reviews: 100 },
          reviews: firstPage,
          pagination: { next_page_token: 'page-1' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reviews: secondPage }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchAllScrapeDoReviews(
      'ChIJ-test-place',
      'test-token',
      40,
      'newest',
      { prematureEndRetryDelayMs: 0 }
    );

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(result.reviews).toHaveLength(40);
    expect(result.complete).toBe(true);
    expect(result.stopReason).toBe('target_reached');
    expect(result.pageDiagnostics.map((page) => page.attempts)).toEqual([3, 1]);
  });

  it('prefers data_id and adopts one returned by the first page', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: URL | RequestInfo) => {
      const requestedUrl = new URL(String(input));
      const pageToken = requestedUrl.searchParams.get('next_page_token');
      return {
        ok: true,
        json: async () => pageToken
          ? {
              reviews: Array.from({ length: 20 }, (_, index) => ({
                review_id: `review-${index + 21}`,
                rating: 5,
              })),
            }
          : {
              place_info: { reviews: 40 },
              search_parameters: { data_id: '0x123:0x456' },
              reviews: Array.from({ length: 20 }, (_, index) => ({
                review_id: `review-${index + 1}`,
                rating: 5,
              })),
              pagination: { next_page_token: 'page-1' },
            },
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchAllScrapeDoReviews(
      'ChIJ-test-place',
      'test-token',
      40,
      'newest',
      { prematureEndRetryDelayMs: 0 }
    );

    const firstUrl = new URL(String(fetchMock.mock.calls[0][0]));
    const secondUrl = new URL(String(fetchMock.mock.calls[1][0]));
    expect(firstUrl.searchParams.get('place_id')).toBe('ChIJ-test-place');
    expect(firstUrl.searchParams.has('data_id')).toBe(false);
    expect(secondUrl.searchParams.get('data_id')).toBe('0x123:0x456');
    expect(secondUrl.searchParams.has('place_id')).toBe(false);
    expect(result.dataId).toBe('0x123:0x456');
    expect(result.complete).toBe(true);
  });
});
