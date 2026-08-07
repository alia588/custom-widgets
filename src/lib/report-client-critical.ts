/**
 * Browser-safe critical reporter. Posts to /api/v1/alerts (server sends email).
 * Safe to import from embed + admin client components — no secrets here.
 */
export async function reportClientCritical(input: {
  title: string;
  message: string;
  fingerprint?: string;
  meta?: Record<string, unknown>;
  /** Embed script origin when running on a third-party host. */
  apiOrigin?: string;
}): Promise<void> {
  const origin = input.apiOrigin ?? '';
  try {
    await fetch(`${origin}/api/v1/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: input.title,
        message: input.message,
        fingerprint: input.fingerprint,
        meta: input.meta,
        severity: 'critical',
      }),
      keepalive: true,
    });
  } catch (err) {
    console.error('[custom-widgets] failed to report critical alert', err);
  }
}
