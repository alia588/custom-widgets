export type ReviewLoadStatus = {
  state: 'loading' | 'complete' | 'partial' | 'error';
  message: string;
};

interface ReviewSyncApiResult {
  complete?: boolean;
  reviewsFetched?: number;
  reviewsStored?: number;
  targetReviews?: number;
  pagesFetched?: number;
}

export function reviewSyncStatus(result: ReviewSyncApiResult): ReviewLoadStatus {
  const fetched = Number(result.reviewsFetched ?? 0);
  const stored = Number(result.reviewsStored ?? 0);

  if (result.complete === false) {
    const target = Number(result.targetReviews ?? 500);
    const pages = Number(result.pagesFetched ?? 0);
    return {
      state: 'partial',
      message: `${fetched} of ${target} fetched; ${stored} stored. Scrape.do pagination stopped after ${pages} pages. Try Refresh again.`,
    };
  }

  return {
    state: 'complete',
    message: `${fetched} latest reviews fetched · ${stored} stored`,
  };
}
