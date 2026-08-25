import { describe, expect, it } from 'vitest';
import { reviewSyncStatus } from './review-sync-status';

describe('reviewSyncStatus', () => {
  it('reports a partial sync without discarding the stored result', () => {
    expect(reviewSyncStatus({
      complete: false,
      reviewsFetched: 125,
      reviewsStored: 125,
      targetReviews: 500,
      pagesFetched: 7,
    })).toEqual({
      state: 'partial',
      message: '125 of 500 fetched; 125 stored. Scrape.do pagination stopped after 7 pages. Try Refresh again.',
    });
  });

  it('reports a completed sync', () => {
    expect(reviewSyncStatus({
      complete: true,
      reviewsFetched: 500,
      reviewsStored: 500,
    })).toEqual({
      state: 'complete',
      message: '500 latest reviews fetched · 500 stored',
    });
  });
});
