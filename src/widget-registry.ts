import type { ComponentType } from 'react';
import { GoogleReviewsEmbed } from './components/GoogleReviewsEmbed';

export type WidgetComponent = ComponentType<{ widgetId: string; apiOrigin?: string }>;

/**
 * Maps widget IDs to React components.
 *
 * The loader supports two data attributes:
 *   <div data-designdetail-embed="WIDGET_ID"></div>
 *   <div data-custom-widget="WIDGET_ID"></div>
 *
 * Add new widgets here when a new widget row is created in Supabase.
 */
const registry: Record<string, WidgetComponent> = {
  // SSR Diesel Repairs — Google Reviews badge (replaces DesignDetail embed)
  '004a7b18-6bcc-4b2a-a8f9-454012312690': GoogleReviewsEmbed as WidgetComponent,
  // GARYS AUTO COLLISION CENTER — Google Reviews badge
  '1cb98d3c-e962-45be-8fac-5859aa7143b8': GoogleReviewsEmbed as WidgetComponent,
};

export function getWidgetComponent(widgetId: string): WidgetComponent | null {
  return registry[widgetId] || null;
}

export function listWidgetIds(): string[] {
  return Object.keys(registry);
}
