'use client';

import { useEffect, useState } from 'react';
import type { BeforeAfterConfig } from '@/lib/before-after-config';
import { beforeAfterFromDbRow } from '@/lib/before-after-config';
import { getBootstrappedData } from '@/lib/bootstrap';
import { getBeforeAfterWidget } from '@/lib/prefetch';
import { BeforeAfterWidget } from './BeforeAfterWidget';
import { WidgetSkeleton } from './WidgetSkeleton';

/**
 * Embed loader for before/after sliders. With the data.js bootstrap snippet
 * the first React paint is the real widget (bootstrap config is the raw
 * before_after_widgets row, mapped with the same beforeAfterFromDbRow used
 * for the API response); otherwise it paints a skeleton while the
 * script-eval-time prefetch (from embed.tsx) resolves. The API is always
 * re-fetched in the background to revalidate, but state only updates when the
 * payload actually differs — no spurious repaints.
 */
export function BeforeAfterEmbed({
  widgetId,
  apiOrigin = '',
}: {
  widgetId: string;
  apiOrigin?: string;
}) {
  const [config, setConfig] = useState<BeforeAfterConfig | null>(() => {
    const bootstrap = getBootstrappedData(widgetId);
    return bootstrap?.kind === 'before-after'
      ? beforeAfterFromDbRow(bootstrap.config)
      : null;
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getBeforeAfterWidget(widgetId, apiOrigin)
      .then((row) => {
        if (cancelled) return;
        const next = beforeAfterFromDbRow(row);
        setConfig((current) =>
          current && JSON.stringify(current) === JSON.stringify(next)
            ? current
            : next
        );
      })
      .catch((err) => {
        console.warn(`[custom-widgets] Failed to load widget ${widgetId}:`, err);
        if (!cancelled && !getBootstrappedData(widgetId)) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [widgetId, apiOrigin]);

  if (failed) return null;
  if (!config) return <WidgetSkeleton minHeight="320px" />;

  return <BeforeAfterWidget config={config} />;
}
