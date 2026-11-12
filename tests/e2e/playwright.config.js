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
  reporter: [['line'], ['junit', { outputFile: 'test-results/e2e.xml' }]],
  use: {
    baseURL,
    headless: true,
    // Keep text/JUnit evidence without generating screenshots, videos or traces.
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});
