'use client';

import { useEffect, useState } from 'react';
import type { BeforeAfterConfig } from '@/lib/before-after-config';
import { beforeAfterFromDbRow } from '@/lib/before-after-config';
import { BeforeAfterWidget } from './BeforeAfterWidget';
import { WidgetSkeleton } from './WidgetSkeleton';

/**
 * Embed loader: fetches the before/after widget config from the host app's
 * API and renders the slider. Used by public/widget.js on external sites —
 * the page only provides the widget ID via data attribute.
 */
export function BeforeAfterEmbed({
  widgetId,
  apiOrigin = '',
}: {
  widgetId: string;
  apiOrigin?: string;
}) {
  const [config, setConfig] = useState<BeforeAfterConfig | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`${apiOrigin}/api/v1/before-after-widgets/${widgetId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Record<string, unknown>>;
      })
      .then((row) => {
        if (!cancelled) setConfig(beforeAfterFromDbRow(row));
      })
      .catch((err) => {
        console.warn(`[custom-widgets] Failed to load widget ${widgetId}:`, err);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [widgetId, apiOrigin]);

  if (failed) return null;
  if (!config) return <WidgetSkeleton />;

  return <BeforeAfterWidget config={config} />;
}
