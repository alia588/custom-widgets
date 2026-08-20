'use client';

import { useEffect, useState } from 'react';
import type { FormConfig } from '@/lib/form-config';
import { formFromDbRow } from '@/lib/form-config';
import { getBootstrappedData } from '@/lib/bootstrap';
import { getFormWidget } from '@/lib/prefetch';
import { FormWidget } from './FormWidget';
import { WidgetSkeleton } from './WidgetSkeleton';

/**
 * Embed loader for multi-step forms. With the data.js bootstrap snippet the
 * first React paint is the real widget (bootstrap config is the raw
 * form_widgets row, mapped with the same formFromDbRow used for the API
 * response); otherwise it paints a skeleton while the prefetch resolves. The
 * API is always re-fetched in the background to revalidate, but state only
 * updates when the payload actually differs — no spurious repaints.
 */
export function FormEmbed({
  widgetId,
  apiOrigin = '',
}: {
  widgetId: string;
  apiOrigin?: string;
}) {
  const [config, setConfig] = useState<FormConfig | null>(() => {
    const bootstrap = getBootstrappedData(widgetId);
    return bootstrap?.kind === 'form' ? formFromDbRow(bootstrap.config) : null;
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getFormWidget(widgetId, apiOrigin)
      .then((row) => {
        if (cancelled) return;
        const next = formFromDbRow(row);
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
  if (!config) return <WidgetSkeleton minHeight="460px" maxWidth="560px" />;

  return <FormWidget config={config} widgetId={widgetId} apiOrigin={apiOrigin} />;
}