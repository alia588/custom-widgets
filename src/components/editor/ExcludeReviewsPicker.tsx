'use client';

import { useMemo, useState } from 'react';
import type { Review } from '@/lib/reviews-data';

function MiniStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-px">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={i < rating ? '#FACC15' : 'none'}
          stroke={i < rating ? '#FACC15' : '#52525B'}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

interface ExcludeReviewsPickerProps {
  reviews: Review[];
  minRating: number;
  maxReviews: number;
  excludedIds: string[];
  onChange: (ids: string[]) => void;
}

export function ExcludeReviewsPicker({
  reviews,
  minRating,
  maxReviews,
  excludedIds,
  onChange,
}: ExcludeReviewsPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const eligible = useMemo(
    () => reviews.filter((r) => r.rating >= minRating).slice(0, maxReviews),
    [reviews, minRating, maxReviews]
  );

  const shownCount = eligible.filter((r) => !excludedIds.includes(r.id)).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return eligible;
    return eligible.filter((r) => r.authorName.toLowerCase().includes(q));
  }, [eligible, query]);

  const toggle = (id: string) => {
    if (excludedIds.includes(id)) {
      onChange(excludedIds.filter((x) => x !== id));
    } else {
      onChange([...excludedIds, id]);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg bg-neutral-800 px-3 py-2.5 text-sm text-neutral-100 ring-1 ring-neutral-700"
      >
        {shownCount} of {eligible.length} reviews shown
        <svg
          className={`h-4 w-4 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl bg-neutral-900 shadow-2xl ring-1 ring-neutral-700">
            <div className="border-b border-neutral-800 p-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by author name..."
                autoFocus
                className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none ring-1 ring-neutral-700 placeholder:text-neutral-600 focus:ring-2 focus:ring-neutral-500"
              />
            </div>

            <div className="editor-scroll max-h-72 overflow-y-auto p-1.5">
              {visible.length === 0 && (
                <div className="p-4 text-center text-sm text-neutral-500">No reviews match.</div>
              )}
              {visible.map((r) => {
                const included = !excludedIds.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className="flex cursor-pointer gap-3 rounded-lg p-3 transition-colors hover:bg-neutral-800"
                  >
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => toggle(r.id)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 accent-white"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-semibold text-neutral-100">
                          {r.authorName}
                        </span>
                        <MiniStars rating={r.rating} />
                        <span className="text-xs text-neutral-500">{r.relativeTime}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-400">
                        {r.text}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
