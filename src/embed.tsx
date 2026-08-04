import { createRoot } from 'react-dom/client';
import { getWidgetComponent } from './widget-registry';
import widgetStyles from './styles/widget.css?inline';

const SELECTORS = ['[data-designdetail-embed]', '[data-custom-widget]'];

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

function mountWidgets() {
  const placeholders = document.querySelectorAll<HTMLElement>(
    SELECTORS.join(', ')
  );

  if (placeholders.length === 0) {
    console.warn('[custom-widgets] No widget placeholders found.');
    return;
  }

  placeholders.forEach((placeholder) => {
    const widgetId =
      placeholder.dataset.designdetailEmbed ||
      placeholder.dataset.customWidget;

    if (!widgetId) {
      console.warn('[custom-widgets] Placeholder is missing a widget ID.');
      return;
    }

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
