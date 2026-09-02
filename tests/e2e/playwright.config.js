import { defineConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: '.',
  testMatch: ['*.spec.js'],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [['line']],
  use: {
    baseURL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
