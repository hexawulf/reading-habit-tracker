// e2e/smoke.spec.mjs
//
// Playwright smoke suite for reading-habit-tracker (mybooks). Covers health and
// API fail-closed behaviour, the guest CSV upload workflow with localStorage
// persistence, sidebar navigation across all 8 views, author drill-down, theme
// toggle, the About modal (open / attribution / Escape to close) and a mobile
// no-horizontal-overflow check.
//
// Guest mode only: the CSV upload parses in memory and persists to browser
// localStorage, never to any user account — so every test here is safe against
// the live site too (MYBOOKS_BASE_URL).
//
// author: 0xWulf
// description: E2E smoke tests (chromium)
// date modified: 2026-11-22

import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_CSV = join(__dirname, 'fixtures', 'sample-goodreads.csv');

// The fixture has 8 rows; 7 are on the "read" shelf (one is "to-read"), so the
// parser keeps exactly 7 books.
const EXPECTED_READ_BOOKS = 7;
const IS_LIVE = Boolean(process.env.MYBOOKS_BASE_URL);

// Collect page errors and >=500 responses for the whole-run assertions.
function installErrorGuards(page, sink) {
  page.on('pageerror', (err) => sink.pageErrors.push(String(err)));
  page.on('response', (res) => {
    if (res.status() >= 500) sink.serverErrors.push(`${res.status()} ${res.url()}`);
  });
}

test.describe('mybooks smoke', () => {
  const sink = { pageErrors: [], serverErrors: [] };

  test.beforeEach(async ({ page }) => {
    installErrorGuards(page, sink);
  });

  test('healthz responds cleanly', async ({ request }) => {
    const res = await request.get('/healthz');
    if (IS_LIVE && res.status() === 204) {
      // Production nginx edge answers /healthz directly with 204 No Content.
      expect(res.status()).toBe(204);
      return;
    }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('GET /api/auth/status returns isAuthenticated false for a guest', async ({ request }) => {
    // The route answers 401 with { isAuthenticated: false } when there is no
    // session (fail-closed). This status code is a behavioral invariant.
    const res = await request.get('/api/auth/status');
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.isAuthenticated).toBe(false);
  });

  test('GET /api/user/data fails closed with 401 for a guest', async ({ request }) => {
    const res = await request.get('/api/user/data');
    expect(res.status()).toBe(401);
  });

  test('guest upload workflow: parse CSV, render dashboard, survive reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Reading Dashboard' })).toBeVisible();

    // Navigate to the upload view via the sidebar.
    await page.getByRole('link', { name: 'Upload Data' }).click();
    await expect(page).toHaveURL(/\/upload$/);
    await expect(page.getByRole('heading', { name: 'Upload Your Reading Data' })).toBeVisible();

    // Set the hidden file input and submit.
    await page.locator('input[type="file"]#file').setInputFiles(FIXTURE_CSV);
    await page.getByRole('button', { name: 'Upload File' }).click();

    // On success the app navigates back to the dashboard.
    await expect(page).toHaveURL(/\/$|\/$/);
    await expect(page.getByRole('heading', { name: 'Reading Dashboard' })).toBeVisible();

    // Total Books card shows the parsed read-book count.
    const totalCard = page.locator('.stat-card.books-read');
    await expect(totalCard.locator('.stat-value')).toHaveText(String(EXPECTED_READ_BOOKS));

    // localStorage holds the guest reading data (saveData checks /api/auth/status
    // asynchronously before writing to localStorage, so poll until it lands).
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem('readingData');
          if (!raw) return -1;
          try { return JSON.parse(raw).length; } catch { return -2; }
        }),
      )
      .toBe(EXPECTED_READ_BOOKS);

    // Reload and confirm persistence survives (localStorage-backed).
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Reading Dashboard' })).toBeVisible();
    await expect(totalCard.locator('.stat-value')).toHaveText(String(EXPECTED_READ_BOOKS));
  });

  test('sidebar navigation across all 8 views and author drill-down', async ({ page }) => {
    // Seed guest data first so data-dependent views render fully.
    await page.goto('/upload');
    await page.locator('input[type="file"]#file').setInputFiles(FIXTURE_CSV);
    await page.getByRole('button', { name: 'Upload File' }).click();
    await expect(page.getByRole('heading', { name: 'Reading Dashboard' })).toBeVisible();

    const views = [
      { link: 'Dashboard', url: /\/$/, heading: 'Reading Dashboard' },
      { link: 'Yearly Progress', url: /\/yearly-progress$/, heading: /Yearly/ },
      { link: 'Monthly Progress', url: /\/monthly-progress$/, heading: /Monthly/ },
      { link: 'Reading Stats', url: /\/reading-stats$/, heading: /Reading Stat/ },
      { link: 'Recent Books', url: /\/recent-books$/, heading: /Recent/ },
      { link: 'Top Authors', url: /\/top-authors$/, heading: /Top Authors/ },
      { link: 'Upload Data', url: /\/upload$/, heading: /Upload/ },
      { link: 'Data Management', url: /\/data-management$/, heading: /Data Management/ },
    ];

    for (const view of views) {
      await page.getByRole('link', { name: view.link, exact: true }).click();
      await expect(page).toHaveURL(view.url);
      await expect(page.locator('h1, h2').filter({ hasText: view.heading }).first()).toBeVisible();
    }

    // Author drill-down: open Top Authors and click the first author card.
    await page.getByRole('link', { name: 'Top Authors', exact: true }).click();
    await expect(page).toHaveURL(/\/top-authors$/);
    const firstAuthor = page.locator('a.author-card-item').first();
    await expect(firstAuthor).toBeVisible();
    await firstAuthor.click();
    await expect(page).toHaveURL(/\/author\/.+/);
  });

  test('theme toggle switches light and dark cleanly', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('.theme-toggle-icon');
    await expect(toggle).toBeVisible();

    const wasLight = await page.evaluate(() => document.body.classList.contains('light-theme'));
    await toggle.click();
    const afterFirst = await page.evaluate(() => document.body.classList.contains('light-theme'));
    expect(afterFirst).toBe(!wasLight);

    await toggle.click();
    const afterSecond = await page.evaluate(() => document.body.classList.contains('light-theme'));
    expect(afterSecond).toBe(wasLight);
  });

  test('About modal opens, shows attribution, and closes on Escape', async ({ page }) => {
    await page.goto('/');
    await page.locator('.about-icon').click();

    const modal = page.locator('.about-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Erling Wulf Weinreich (0xWulf)');
    await expect(modal.locator('a[href="mailto:dev@0xwulf.dev"]')).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
  });

  test('mobile viewport (390x844) renders without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Reading Dashboard' })).toBeVisible();

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test.afterAll(() => {
    expect(sink.pageErrors, `page errors:\n${sink.pageErrors.join('\n')}`).toEqual([]);
    expect(sink.serverErrors, `>=500 responses:\n${sink.serverErrors.join('\n')}`).toEqual([]);
  });
});
