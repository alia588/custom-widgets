/**
 * Stable Gary's Auto Collision Center widget IDs (registry + embed test site).
 * Tests assert behavior against these IDs — not against fragile CSS.
 */
export const GARYS_WIDGET_IDS = {
  badge: '1cb98d3c-e962-45be-8fac-5859aa7143b8',
  beforeAfterAudi: 'a4462581-5eff-453d-9509-b00ce07fb6aa',
  beforeAfterBmw: '63ad3cd4-2a31-4b91-b965-f54b9335e8e3',
  beforeAfterSClass: 'db03edac-813a-4e04-881a-9eb122e2053e',
  carousel: '7f3a9c2e-4b1d-4e8f-9a6c-2d5e8f1a3b7c',
} as const;

export const TEST_NAME_PREFIX = '[TEST]';

export function isTestOnlyName(name: string): boolean {
  return name.trim().startsWith(TEST_NAME_PREFIX);
}

export function assertTestOnlyName(name: string): void {
  if (!isTestOnlyName(name)) {
    throw new Error(
      `Refusing to mutate "${name}" — only names starting with "${TEST_NAME_PREFIX}" are allowed in tests`
    );
  }
}
