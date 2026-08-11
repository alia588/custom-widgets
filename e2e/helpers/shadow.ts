import type { Page, Locator } from '@playwright/test';

/** Same IDs as src/lib/e2e-widget-ids.ts (kept local so Playwright resolves cleanly). */
export const GARYS_WIDGET_IDS = {
  badge: '1cb98d3c-e962-45be-8fac-5859aa7143b8',
  beforeAfterAudi: 'a4462581-5eff-453d-9509-b00ce07fb6aa',
  beforeAfterBmw: '63ad3cd4-2a31-4b91-b965-f54b9335e8e3',
  beforeAfterSClass: 'db03edac-813a-4e04-881a-9eb122e2053e',
  carousel: '7f3a9c2e-4b1d-4e8f-9a6c-2d5e8f1a3b7c',
} as const;

/** Pierce open shadow roots for a data-bbs-widget marker. */
export function shadowWidget(page: Page, kind: string, embedId?: string): Locator {
  if (embedId) {
    return page.locator(`[data-bbs-embed="${embedId}"]`).locator(`[data-bbs-widget="${kind}"]`);
  }
  return page.locator(`[data-bbs-widget="${kind}"]`);
}

export async function expectShadowMounted(page: Page, embedId: string) {
  await page.waitForFunction(
    (id) => {
      const el = document.querySelector(`[data-bbs-embed="${id}"]`);
      return !!(el && el.shadowRoot && el.shadowRoot.querySelector('.custom-widget-root'));
    },
    embedId,
    { timeout: 30_000 }
  );
}

export async function expectWidgetKind(page: Page, embedId: string, kind: string) {
  await page.waitForFunction(
    ({ id, k }) => {
      const el = document.querySelector(`[data-bbs-embed="${id}"]`);
      return !!el?.shadowRoot?.querySelector(`[data-bbs-widget="${k}"]`);
    },
    { id: embedId, k: kind },
    { timeout: 30_000 }
  );
}
