import { createRoot } from 'react-dom/client';
import { getWidgetComponent, getWidgetKind } from './widget-registry';
import {
  getBeforeAfterWidget,
  getWidgetConfig,
  getWidgetReviews,
} from './lib/prefetch';
import { getBootstrappedData } from './lib/bootstrap';
import widgetStyles from './styles/widget.css?inline';

// data-designdetail-embed is kept for backward compatibility with embeds
// pasted on live sites before the rebrand; new embed codes use data-bbs-embed.
const SELECTORS = [
  '[data-bbs-embed]',
  '[data-custom-widget]',
  '[data-designdetail-embed]',
];

// Resolve the API origin at script-eval time: the page is on an external
// domain (GHL etc.), so API calls must go to wherever widget.js was loaded
// from. window.__CUSTOM_WIDGETS_API_ORIGIN__ can override for testing.
const SCRIPT_ORIGIN = (() => {
  const w = window as unknown as { __CUSTOM_WIDGETS_API_ORIGIN__?: string };
  if (w.__CUSTOM_WIDGETS_API_ORIGIN__) return w.__CUSTOM_WIDGETS_API_ORIGIN__;
  try {
    const src = (document.currentScript as HTMLScriptElement | null)?.src;
    if (src) return new URL(src).origin;
  } catch {
    // fall through to same-origin relative requests
  }
  return '';
})();

// Widgets whose prefetch was already kicked off; guards the DOMContentLoaded
// pass against re-issuing (the prefetch module's promise cache would dedupe
// anyway, this just avoids the re-scan).
const prefetched = new Set<string>();

function readWidgetId(placeholder: HTMLElement): string | null {
  return (
    placeholder.dataset.bbsEmbed ||
    placeholder.dataset.customWidget ||
    placeholder.dataset.designdetailEmbed ||
    null
  );
}

/**
 * Starts the correct API prefetch for a placeholder before React mounts, so
 * the request races the bundle instead of waiting for a fetch-in-useEffect
 * waterfall. Skipped when the data.js bootstrap already delivered the payload
 * (the components still background-revalidate on mount).
 */
function prefetchWidgetData(widgetId: string) {
  if (prefetched.has(widgetId)) return;
  if (getBootstrappedData(widgetId)) return;

  const kind = getWidgetKind(widgetId);
  if (!kind) return;
  prefetched.add(widgetId);

  if (kind === 'before-after') {
    getBeforeAfterWidget(widgetId, SCRIPT_ORIGIN).catch(() => {});
    return;
  }

  // reviews and carousel both need config + reviews
  getWidgetConfig(widgetId, SCRIPT_ORIGIN).catch(() => {});
  getWidgetReviews(widgetId, SCRIPT_ORIGIN).catch(() => {});
}

// Phase 1: widgets already in the DOM when this script evaluates (classic
// snippets placed after the placeholder) get their data fetched immediately.
document
  .querySelectorAll<HTMLElement>(SELECTORS.join(', '))
  .forEach((placeholder) => {
    const widgetId = readWidgetId(placeholder);
    if (widgetId) prefetchWidgetData(widgetId);
  });

function mountWidgets() {
  const placeholders = document.querySelectorAll<HTMLElement>(
    SELECTORS.join(', ')
  );

  if (placeholders.length === 0) {
    console.warn('[custom-widgets] No widget placeholders found.');
    return;
  }

  placeholders.forEach((placeholder) => {
    const widgetId = readWidgetId(placeholder);

    if (!widgetId) {
      console.warn('[custom-widgets] Placeholder is missing a widget ID.');
      return;
    }

    // Phase 2: pick up placeholders added after script eval (async widget.js
    // on a busy page) and start their data fetch before mounting.
    prefetchWidgetData(widgetId);

    const Widget = getWidgetComponent(widgetId);

    if (!Widget) {
      console.warn(
        `[custom-widgets] No widget registered for ID: ${widgetId}`
      );
      return;
    }

    // Use Shadow DOM to keep widget styles isolated from the host page.
    const shadowRoot = placeholder.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = widgetStyles;
    shadowRoot.appendChild(styleEl);

    const mountPoint = document.createElement('div');
    mountPoint.className = 'custom-widget-root';
    shadowRoot.appendChild(mountPoint);

    const root = createRoot(mountPoint);
    root.render(<Widget widgetId={widgetId} apiOrigin={SCRIPT_ORIGIN} />);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountWidgets);
} else {
  mountWidgets();
}
