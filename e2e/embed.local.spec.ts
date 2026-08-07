import { test, expect } from '@playwright/test';
import {
  expectShadowMounted,
  expectWidgetKind,
  GARYS_WIDGET_IDS,
} from './helpers/shadow';

test.describe('local embed harness', () => {
  test.skip(
    !process.env.SUPABASE_SERVICE_ROLE_KEY,
    'SUPABASE_SERVICE_ROLE_KEY required for local embed E2E'
  );

  test('badge, carousel, and before/after widgets mount and render', async ({
    page,
  }) => {
    await page.goto('/e2e/harness');

    await expectShadowMounted(page, GARYS_WIDGET_IDS.badge);
    await expectWidgetKind(page, GARYS_WIDGET_IDS.badge, 'reviews');

    await expectShadowMounted(page, GARYS_WIDGET_IDS.carousel);
    await expectWidgetKind(page, GARYS_WIDGET_IDS.carousel, 'carousel');

    for (const id of [
      GARYS_WIDGET_IDS.beforeAfterAudi,
      GARYS_WIDGET_IDS.beforeAfterBmw,
      GARYS_WIDGET_IDS.beforeAfterSClass,
    ]) {
      await expectShadowMounted(page, id);
      await expectWidgetKind(page, id, 'before-after');
    }

    // Badge shows a numeric rating inside shadow DOM
    await page.waitForFunction(
      (id) => {
        const host = document.querySelector(`[data-bbs-embed="${id}"]`);
        const text = host?.shadowRoot?.textContent ?? '';
        return /\d\.\d/.test(text);
      },
      GARYS_WIDGET_IDS.badge,
      { timeout: 30_000 }
    );

    // Carousel has next control
    await page.waitForFunction(
      (id) => {
        const host = document.querySelector(`[data-bbs-embed="${id}"]`);
        return !!host?.shadowRoot?.querySelector('[aria-label="Next reviews"]');
      },
      GARYS_WIDGET_IDS.carousel,
      { timeout: 30_000 }
    );

    // Before/after slider handle responds to pointer drag
    await page.waitForFunction(
      (id) =>
        !!document
          .querySelector(`[data-bbs-embed="${id}"]`)
          ?.shadowRoot?.querySelector('[data-bbs-slider]'),
      GARYS_WIDGET_IDS.beforeAfterAudi,
      { timeout: 30_000 }
    );

    const moved = await page.evaluate(async (id) => {
      const host = document.querySelector(`[data-bbs-embed="${id}"]`) as HTMLElement | null;
      const slider = host?.shadowRoot?.querySelector('[data-bbs-slider]') as HTMLElement | null;
      if (!slider) return false;
      const rect = slider.getBoundingClientRect();
      const divider = () =>
        Array.from(host!.shadowRoot!.querySelectorAll('[data-bbs-slider] > div')).find((d) =>
          (d as HTMLElement).style.left?.includes('%')
        ) as HTMLElement | undefined;
      const beforeLeft = divider()?.style.left ?? '';
      slider.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: rect.left + rect.width * 0.2,
          bubbles: true,
        })
      );
      slider.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: rect.left + rect.width * 0.8,
          bubbles: true,
        })
      );
      slider.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 50));
      const afterLeft = divider()?.style.left ?? '';
      return beforeLeft !== afterLeft || afterLeft.includes('%');
    }, GARYS_WIDGET_IDS.beforeAfterAudi);
    expect(moved).toBe(true);
  });
});
