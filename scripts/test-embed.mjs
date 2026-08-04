/**
 * End-to-end embed test: simulates an external site (GHL) loading
 * public/widget.js with the DesignDetail snippet markup, then checks that
 * the widget fetches live data from the API and renders into Shadow DOM.
 *
 * Usage: node scripts/test-embed.mjs [widgetId]
 * Requires the dev server on localhost:3000.
 */
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const widgetId = process.argv[2] || '004a7b18-6bcc-4b2a-a8f9-454012312690';
const API_ORIGIN = 'http://localhost:3000';

const bundle = readFileSync('public/widget.js', 'utf8');

const html = `<!DOCTYPE html>
<html>
  <body>
    <!-- Design Detail Embed -->
    <div data-designdetail-embed="${widgetId}"></div>
    <!-- End Design Detail Embed -->
  </body>
</html>`;

const { VirtualConsole } = await import('jsdom');
const virtualConsole = new VirtualConsole();
const consoleMessages = [];
virtualConsole.on('error', (...a) => consoleMessages.push(['error', a.join(' ')]));
virtualConsole.on('warn', (...a) => consoleMessages.push(['warn', a.join(' ')]));
virtualConsole.on('jsdomError', (e) => consoleMessages.push(['jsdomError', e.message]));

const dom = new JSDOM(html, {
  url: 'https://ghl-hosted-site.example.com/', // external origin, like GHL
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole,
  beforeParse(window) {
    // jsdom has no fetch; give it Node's (no CORS enforcement, headers
    // verified separately via curl).
    window.fetch = globalThis.fetch;
    // Simulate the script having been loaded from our app.
    window.__CUSTOM_WIDGETS_API_ORIGIN__ = API_ORIGIN;
  },
});

// Execute the bundle as the page's inline script would.
const scriptEl = dom.window.document.createElement('script');
scriptEl.textContent = bundle;
dom.window.document.body.appendChild(scriptEl);

// Poll for the widget to fetch + render (check the React mount point, not the
// shadow root itself — the injected <style> makes its text non-empty).
const deadline = Date.now() + 15000;
let rendered = '';
while (Date.now() < deadline) {
  const placeholder = dom.window.document.querySelector('[data-designdetail-embed]');
  rendered = placeholder?.shadowRoot?.querySelector('.custom-widget-root')?.textContent ?? '';
  if (rendered.trim().length > 0) break;
  await new Promise((r) => setTimeout(r, 250));
}

console.log('--- console messages from the page ---');
for (const [level, msg] of consoleMessages) console.log(`[${level}]`, msg.slice(0, 300));
if (consoleMessages.length === 0) console.log('(none)');

console.log('\n--- rendered shadow DOM text ---');
console.log(rendered.trim() || '(nothing rendered)');

const ok =
  rendered.includes('SSR Diesel Repairs') ||
  rendered.includes('GARYS AUTO COLLISION');
console.log('\nRESULT:', ok ? 'PASS — widget rendered live business data' : 'FAIL');
process.exit(ok ? 0 : 1);
