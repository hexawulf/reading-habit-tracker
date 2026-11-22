// playwright.config.mjs
//
// Playwright E2E smoke suite for reading-habit-tracker (mybooks).
//
// Local runs (`npm run test:e2e`): Playwright boots the real server.js against
// an in-memory MongoDB on 127.0.0.1:5093 via e2e/start-test-server.mjs, then
// runs the Chromium smoke tests against it.
//
// Live runs (`npm run test:e2e:live`): MYBOOKS_BASE_URL is set to the public
// site; no local server is started and only read-only / guest-safe assertions
// run (the suite never writes to any user account).
//
// author: 0xWulf
// description: Playwright config (chromium project)
// date modified: 2026-11-22

import { defineConfig, devices } from '@playwright/test';

const LOCAL_PORT = process.env.MYBOOKS_E2E_PORT || '5093';
const LOCAL_URL = `http://127.0.0.1:${LOCAL_PORT}`;
const baseURL = process.env.MYBOOKS_BASE_URL || LOCAL_URL;
const isLive = !!process.env.MYBOOKS_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.mjs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Only boot a local server when testing the local build (not the live site).
  webServer: isLive
    ? undefined
    : {
        command: 'node e2e/start-test-server.mjs',
        url: `${LOCAL_URL}/healthz`,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
