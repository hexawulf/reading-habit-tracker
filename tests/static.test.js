// Tests for RH-11: cache headers and 404 for missing static assets.
// Vite emits hashed bundles under client/build/assets/ (CRA used /static/).
// Creates a minimal client/build fixture (gitignored) and cleans it up.
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server.js');

const buildDir = path.join(__dirname, '..', 'client', 'build');
const assetsDir = path.join(buildDir, 'assets');
const FIXTURE_JS = 'kiro-test-fixture.abc123.js';
let createdBuild = false;
let createdIndex = false;
let createdFixtureJs = false;

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
});

afterAll(() => {
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
});
