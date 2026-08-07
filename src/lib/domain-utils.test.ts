import { describe, expect, it, afterEach, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  supabase: { from: vi.fn() },
}));

import {
  isOriginAllowed,
  normalizeDomain,
  getRequestOrigin,
} from '@/lib/domain-utils';
import {
  assertTestOnlyName,
  isTestOnlyName,
  TEST_NAME_PREFIX,
} from '@/lib/e2e-widget-ids';

describe('domain-utils', () => {
  afterEach(() => {
    delete process.env.ALLOW_LOCALHOST_EMBEDS;
  });

  it('normalizes domains', () => {
    expect(normalizeDomain('https://WWW.Example.com:443/path')).toBe('example.com');
    expect(normalizeDomain('*.example.com')).toBe('*.example.com');
  });

  it('allows exact and wildcard hosts', () => {
    const allowed = ['garysautocollisioncenter.com', '*.builtbyshah.com'];
    expect(isOriginAllowed('https://garysautocollisioncenter.com', allowed)).toBe(true);
    expect(isOriginAllowed('https://www.garysautocollisioncenter.com', allowed)).toBe(true);
    expect(isOriginAllowed('https://widgets.builtbyshah.com', allowed)).toBe(true);
    expect(isOriginAllowed('https://evil.com', allowed)).toBe(false);
  });

  it('denies empty allowlist and missing origin', () => {
    expect(isOriginAllowed('https://example.com', [])).toBe(false);
    expect(isOriginAllowed(null, ['example.com'])).toBe(false);
  });

  it('allows localhost only when ALLOW_LOCALHOST_EMBEDS=true', () => {
    const allowed = ['example.com'];
    expect(isOriginAllowed('http://localhost:3000', allowed)).toBe(false);
    process.env.ALLOW_LOCALHOST_EMBEDS = 'true';
    expect(isOriginAllowed('http://localhost:3000', allowed)).toBe(true);
    expect(isOriginAllowed('http://127.0.0.1:3000', allowed)).toBe(true);
  });

  it('reads origin from Origin or Referer', () => {
    expect(
      getRequestOrigin(
        new Request('https://api.example.com', {
          headers: { origin: 'https://shop.example.com' },
        })
      )
    ).toBe('https://shop.example.com');

    expect(
      getRequestOrigin(
        new Request('https://api.example.com', {
          headers: { referer: 'https://shop.example.com/page' },
        })
      )
    ).toBe('https://shop.example.com');
  });
});

describe('test-only name guard', () => {
  it('accepts [TEST] prefix only', () => {
    expect(isTestOnlyName(`${TEST_NAME_PREFIX} Widget`)).toBe(true);
    expect(isTestOnlyName('GARYS AUTO COLLISION CENTER')).toBe(false);
    expect(() => assertTestOnlyName('live widget')).toThrow(/Refusing to mutate/);
  });
});
