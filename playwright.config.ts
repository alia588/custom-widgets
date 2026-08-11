import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// Load env files into process.env for Playwright + the Next webServer child.
for (const file of ['.env.local', '.env']) {
  const full = path.resolve(file);
  if (fs.existsSync(full)) {
    dotenv.config({ path: full, quiet: true });
  }
}

// Common aliases so middleware/auth and service-role data clients both work.
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL;
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
}

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';
const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  projects: [
    {
      name: 'local',
      testMatch: /.*\.(local|api)\.spec\.ts/,
      use: { baseURL },
    },
    {
      name: 'canary',
      testMatch: /.*\.canary\.spec\.ts/,
      use: {
        baseURL: process.env.E2E_CANARY_URL ?? 'https://embed-site-seven.vercel.app',
      },
    },
  ],
  webServer:
    process.env.E2E_SKIP_WEBSERVER || !hasServiceRole
      ? undefined
      : {
          command:
            'npm run build:widget && npx next dev --hostname 127.0.0.1 --port 3000',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
          env: {
            ...process.env,
            ENABLE_E2E_HARNESS: 'true',
            ALLOW_LOCALHOST_EMBEDS: 'true',
          },
        },
});
