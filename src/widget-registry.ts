import type { ComponentType } from 'react';
import { GoogleReviewsWidget } from './components/GoogleReviewsWidget';

export type WidgetComponent = ComponentType<{ widgetId: string }>;

/**
 * Maps widget IDs to React components.
 *
 * The loader supports two data attributes:
 *   <div data-designdetail-embed="WIDGET_ID"></div>
 *   <div data-custom-widget="WIDGET_ID"></div>
 *
 * Add new widgets here and in src/widgets/.
 */
const registry: Record<string, WidgetComponent> = {
  // Google Reviews badge widget (replaces DesignDetail embed)
  '004a7b18-6bcc-4b2a-a8f9-454012312690': GoogleReviewsWidget as WidgetComponent,
};

export function getWidgetComponent(widgetId: string): WidgetComponent | null {
  return registry[widgetId] || null;
}

export function listWidgetIds(): string[] {
  return Object.keys(registry);
}
