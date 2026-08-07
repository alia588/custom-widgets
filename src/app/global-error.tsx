'use client';

import { useEffect } from 'react';
import { reportClientCritical } from '@/lib/report-client-critical';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void reportClientCritical({
      title: 'Next.js global error',
      message: error.message,
      fingerprint: `global-error:${error.digest ?? error.message.slice(0, 80)}`,
      meta: { digest: error.digest, stack: error.stack?.slice(0, 2000) },
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#f5f5f5',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h2 style={{ color: '#fca5a5' }}>Application error</h2>
          <p style={{ color: '#a3a3a3', fontSize: 14 }}>
            A critical failure occurred. An alert was sent.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              padding: '8px 14px',
              borderRadius: 8,
              background: '#262626',
              color: '#f5f5f5',
              border: '1px solid #404040',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
