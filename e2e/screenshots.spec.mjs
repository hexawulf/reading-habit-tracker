// e2e/screenshots.spec.mjs
//
// README screenshot capture (Phase 5), written as a Playwright spec so the
// runner boots and tears down the local E2E server automatically. It is skipped
// in normal runs and only executes when CAPTURE_SCREENSHOTS=1, e.g.:
//
//   CAPTURE_SCREENSHOTS=1 npm run test:e2e -- e2e/screenshots.spec.mjs
//
// It seeds ONLY the synthetic sample-goodreads.csv fixture via the guest upload
// flow (localStorage, never a real account), asserts the rendered DOM contains
// no private IPs / internal hostnames / personal emails, and writes:
//   docs/screenshots/dashboard-dark.png
//   docs/screenshots/dashboard-light.png
//   docs/screenshots/monthly-progress.png
//
// author: 0xWulf
// description: synthetic-data README screenshots
// date modified: 2026-11-22

import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FIXTURE_CSV = join(__dirname, 'fixtures', 'sample-goodreads.csv');
const OUT_DIR = join(ROOT, 'docs', 'screenshots');

// Strings that must never appear in a committed screenshot's DOM text.
const FORBIDDEN = [
  /192\.168\.\d{1,3}\.\d{1,3}/,
  /10\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  /piapps\d?/i,
  /linuxsvr|ds920|ds718|brixhouse/i,
  /0x316aa@|hex316aa@|zk@hexawulf/i,
];

async function assertNoLeak(page, label) {
  const text = await page.evaluate(() => document.body.innerText || '');
  for (const pat of FORBIDDEN) {
    expect(pat.test(text), `${pat} must not appear in ${label}`).toBe(false);
  }
}

test.describe('README screenshots', () => {
  test.skip(process.env.CAPTURE_SCREENSHOTS !== '1', 'set CAPTURE_SCREENSHOTS=1 to capture');
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('capture dashboard (dark/light) and monthly progress', async ({ page }) => {
    mkdirSync(OUT_DIR, { recursive: true });

    // Seed guest data.
    await page.goto('/upload');
    await page.locator('input[type="file"]#file').setInputFiles(FIXTURE_CSV);
    await page.getByRole('button', { name: 'Upload File' }).click();
    await expect(page.getByRole('heading', { name: 'Reading Dashboard' })).toBeVisible();

    // Dashboard — dark (default).
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Reading Dashboard' })).toBeVisible();
    await page.mouse.move(1435, 2);
    await page.waitForTimeout(800);
    await assertNoLeak(page, 'dashboard-dark');
    await page.screenshot({ path: join(OUT_DIR, 'dashboard-dark.png'), fullPage: true });

    // Dashboard — light.
    await page.locator('.theme-toggle-icon').click();
    await page.mouse.move(1435, 2);
    await page.waitForTimeout(500);
    await assertNoLeak(page, 'dashboard-light');
    await page.screenshot({ path: join(OUT_DIR, 'dashboard-light.png'), fullPage: true });

    // Back to dark, then Monthly Progress.
    await page.locator('.theme-toggle-icon').click();
    await page.waitForTimeout(300);
    await page.getByRole('link', { name: 'Monthly Progress', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Monthly Reading Progress/ })).toBeVisible();
    // Pick a year that has data in the fixture so the charts are populated.
    const yearSelect = page.locator('select').first();
    if (await yearSelect.count()) {
      const opts = await yearSelect.locator('option').allTextContents();
      if (opts.includes('2023')) await yearSelect.selectOption('2023');
    }
    // Move the pointer to an empty area (top-right corner, off any chart bar
    // and off the hover-expand sidebar) so no tooltip appears in the capture.
    await page.mouse.move(1435, 2);
    await page.waitForTimeout(900);
    await assertNoLeak(page, 'monthly-progress');
    await page.screenshot({ path: join(OUT_DIR, 'monthly-progress.png'), fullPage: true });
  });
});
