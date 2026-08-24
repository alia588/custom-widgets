import Script from 'next/script';
import { notFound } from 'next/navigation';
import { InteractiveTablePreview } from '@/components/e2e/InteractiveTablePreview';
import { GARYS_WIDGET_IDS } from '@/lib/e2e-widget-ids';

/**
 * Local embed harness mirroring https://embed-site-seven.vercel.app/
 * Only available when ENABLE_E2E_HARNESS=true (Playwright webServer sets this).
 */
export default function E2eHarnessPage() {
  if (process.env.ENABLE_E2E_HARNESS !== 'true') {
    notFound();
  }

  return (
    <main
      style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '32px 16px',
        fontFamily: 'system-ui, sans-serif',
        background: '#f8fafc',
        minHeight: '100vh',
      }}
    >
      <h1>E2E Embed Harness</h1>
      <p style={{ color: '#64748b' }}>
        Same widget IDs as the Gary&apos;s embed test site — loads local{' '}
        <code>/api/embeds/widget.js</code>.
      </p>

      <InteractiveTablePreview />

      <section style={{ marginTop: 32 }}>
        <h2>Google Reviews Badge</h2>
        <div data-bbs-embed={GARYS_WIDGET_IDS.badge} />
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Audi Q5 — Before/After Slider</h2>
        <div data-bbs-embed={GARYS_WIDGET_IDS.beforeAfterAudi} />
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>BMW X7 X40i — Before/After Slider</h2>
        <div data-bbs-embed={GARYS_WIDGET_IDS.beforeAfterBmw} />
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>S Class — Before/After Slider</h2>
        <div data-bbs-embed={GARYS_WIDGET_IDS.beforeAfterSClass} />
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Google Reviews Carousel</h2>
        <div data-bbs-embed={GARYS_WIDGET_IDS.carousel} />
      </section>

      <Script src="/api/embeds/widget.js" strategy="afterInteractive" />
    </main>
  );
}
