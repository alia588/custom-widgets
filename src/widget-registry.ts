import type { ComponentType } from 'react';
import { GoogleReviewsEmbed } from './components/GoogleReviewsEmbed';
import { GoogleReviewsCarouselEmbed } from './components/GoogleReviewsCarouselEmbed';
import { BeforeAfterEmbed } from './components/BeforeAfterEmbed';

export type WidgetComponent = ComponentType<{ widgetId: string; apiOrigin?: string }>;

/**
 * Maps widget IDs to React components.
 *
 * The loader supports these data attributes:
 *   <div data-bbs-embed="WIDGET_ID"></div>          (current)
 *   <div data-custom-widget="WIDGET_ID"></div>      (generic)
 *   <div data-designdetail-embed="WIDGET_ID"></div> (legacy, pre-rebrand)
 *
 * Add new widgets here when a new widget row is created in Supabase.
 */
const registry: Record<string, WidgetComponent> = {
  // SSR Diesel Repairs — Google Reviews badge
  '004a7b18-6bcc-4b2a-a8f9-454012312690': GoogleReviewsEmbed as WidgetComponent,
  // GARYS AUTO COLLISION CENTER — Google Reviews badge
  '1cb98d3c-e962-45be-8fac-5859aa7143b8': GoogleReviewsEmbed as WidgetComponent,
  // GARYS AUTO COLLISION CENTER — ALIS Audi Q5 Before/After Slider
  'a4462581-5eff-453d-9509-b00ce07fb6aa': BeforeAfterEmbed as WidgetComponent,
  // GARYS AUTO COLLISION CENTER — Google Reviews Carousel
  '7f3a9c2e-4b1d-4e8f-9a6c-2d5e8f1a3b7c': GoogleReviewsCarouselEmbed as WidgetComponent,
};

export function getWidgetComponent(widgetId: string): WidgetComponent | null {
  return registry[widgetId] || null;
}

export function listWidgetIds(): string[] {
  return Object.keys(registry);
}
