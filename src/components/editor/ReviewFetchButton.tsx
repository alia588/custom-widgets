'use client';

export function ReviewFetchButton({
  hasReviews,
  loading,
  disabled,
  onClick,
}: {
  hasReviews: boolean;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const idleLabel = hasReviews ? 'Refresh Reviews' : 'Fetch Reviews';
  const loadingLabel = hasReviews ? 'Refreshing Reviews…' : 'Fetching Reviews…';

  return (
    <div className="mt-4 border-t border-[var(--color-border)] pt-4">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-busy={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white transition-[opacity,transform] hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && (
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {loading ? loadingLabel : idleLabel}
      </button>
      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
        Fetches up to the latest 500 Google reviews for this business.
      </p>
    </div>
  );
}
