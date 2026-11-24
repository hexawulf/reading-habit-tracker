// Tests for RH-11: cache headers and 404 for missing static assets.
// Vite emits hashed bundles under client/build/assets/ (CRA used /static/).
// Creates a minimal client/build fixture (gitignored) and cleans it up.
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server.js');

const buildDir = path.join(__dirname, '..', 'client', 'build');
const publicDir = path.join(__dirname, '..', 'client', 'public');
const assetsDir = path.join(buildDir, 'assets');
const FIXTURE_JS = 'kiro-test-fixture.abc123.js';
const CRAWL_FILES = ['robots.txt', 'sitemap.xml'];
let createdBuild = false;
let createdIndex = false;
let createdFixtureJs = false;
const createdCrawlFiles = new Set();

beforeAll(() => {
  if (!fs.existsSync(buildDir)) {
    createdBuild = true;
    fs.mkdirSync(assetsDir, { recursive: true });
  } else if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  const indexPath = path.join(buildDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    createdIndex = true;
    fs.writeFileSync(indexPath, '<!doctype html><title>mybooks</title>');
  }
  const fixturePath = path.join(assetsDir, FIXTURE_JS);
  if (!fs.existsSync(fixturePath)) {
    createdFixtureJs = true;
    fs.writeFileSync(fixturePath, 'console.log(1);');
  }
  // Stage the real public crawl files when this run has no Vite build yet.
  // express.static serves whatever is in client/build, which is where Vite
  // copies client/public.
  for (const name of CRAWL_FILES) {
    const dest = path.join(buildDir, name);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(path.join(publicDir, name), dest);
      createdCrawlFiles.add(name);
    }
  }
});

afterAll(() => {
  for (const name of createdCrawlFiles) {
    fs.rmSync(path.join(buildDir, name), { force: true });
  }
  if (createdFixtureJs) fs.rmSync(path.join(assetsDir, FIXTURE_JS), { force: true });
  if (createdIndex) fs.rmSync(path.join(buildDir, 'index.html'), { force: true });
  if (createdBuild) fs.rmSync(buildDir, { recursive: true, force: true });
});

describe('RH-11: caching and static 404s', () => {
  test('a hashed /assets/ bundle is immutable and long-cached', async () => {
    const res = await request(app).get(`/assets/${FIXTURE_JS}`);
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toMatch(/immutable/);
    expect(res.headers['cache-control']).toMatch(/max-age=31536000/);
  });

  test('the HTML shell is no-cache', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toMatch(/no-cache/);
  });

  test('a missing /assets/ file gives 404, not the SPA shell', async () => {
    const res = await request(app).get('/assets/does-not-exist.js');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('an unknown non-asset route gets the SPA shell with no-cache', async () => {
    const res = await request(app).get('/some/spa/route');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toMatch(/no-cache/);
  });

  test('robots.txt is plain text that allows crawling and names the sitemap', async () => {
    const res = await request(app).get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toMatch(/User-agent:\s*\*/);
    expect(res.text).toMatch(/Allow:\s*\//);
    expect(res.text).toContain('Sitemap: https://mybooks.piapps.dev/sitemap.xml');
    expect(res.text).not.toMatch(/<html/i);
    expect(res.text).not.toMatch(/<!doctype html/i);
  });

  test('sitemap.xml is XML for the homepage, not the SPA shell', async () => {
    const res = await request(app).get('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
    expect(res.text).toContain('<loc>https://mybooks.piapps.dev/</loc>');
    expect(res.text).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');
    expect(res.text).not.toMatch(/<html/i);
    expect(res.text).not.toMatch(/<!doctype html/i);
  });

  test('a missing robots.txt is plain-text 404, not the SPA shell', async () => {
    const robotsPath = path.join(buildDir, 'robots.txt');
    const backup = fs.readFileSync(robotsPath);
    fs.rmSync(robotsPath);
    try {
      const res = await request(app).get('/robots.txt');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/text\/plain/);
      expect(res.text).not.toMatch(/<html/i);
      expect(res.text).not.toMatch(/<!doctype html/i);
    } finally {
      fs.writeFileSync(robotsPath, backup);
    }
  });
});

describe('homepage SEO tags in the Vite HTML entry', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'client', 'index.html'), 'utf8');

  test('declares a canonical URL for the public site', () => {
    expect(html).toContain('<link rel="canonical" href="https://mybooks.piapps.dev/"');
  });

  test('has a concise, accurate meta description', () => {
    const match = html.match(/name="description"[\s\S]*?content="([^"]+)"/);
    expect(match).not.toBeNull();
    const description = match[1];
    expect(description.length).toBeGreaterThan(40);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toMatch(/Goodreads/i);
    expect(description).toMatch(/reading/i);
  });
});
