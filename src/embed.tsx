import { createRoot } from 'react-dom/client';
import { getWidgetComponent } from './widget-registry';
import widgetStyles from './styles/widget.css?inline';

const SELECTORS = ['[data-designdetail-embed]', '[data-custom-widget]'];

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
    root.render(<Widget widgetId={widgetId} />);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountWidgets);
} else {
  mountWidgets();
}
