'use client';

import { useEffect } from 'react';
import { reportClientCritical } from '@/lib/report-client-critical';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void reportClientCritical({
      title: 'Next.js route error',
      message: error.message,
      fingerprint: `next-error:${error.digest ?? error.message.slice(0, 80)}`,
      meta: { digest: error.digest, stack: error.stack?.slice(0, 2000) },
    });
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-neutral-100">
      <h2 className="text-xl font-semibold text-red-300">Something went wrong</h2>
      <p className="max-w-md text-center text-sm text-neutral-400">
        The team has been notified. You can try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-neutral-800 px-4 py-2 text-sm ring-1 ring-neutral-700 hover:bg-neutral-700"
      >
        Try again
      </button>
    </div>
  );
}
