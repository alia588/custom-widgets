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
});
