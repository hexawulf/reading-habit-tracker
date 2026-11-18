// Tests for RH-11: cache headers and 404 for missing static assets.
// Creates a minimal client/build fixture (gitignored) and cleans it up.
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server.js');

const buildDir = path.join(__dirname, '..', 'client', 'build');
const staticJsDir = path.join(buildDir, 'static', 'js');
let createdBuild = false;

beforeAll(() => {
  if (!fs.existsSync(buildDir)) {
    createdBuild = true;
    fs.mkdirSync(staticJsDir, { recursive: true });
    fs.writeFileSync(path.join(buildDir, 'index.html'), '<!doctype html><title>mybooks</title>');
    fs.writeFileSync(path.join(staticJsDir, 'main.abc123.js'), 'console.log(1);');
  }
});

afterAll(() => {
  if (createdBuild) fs.rmSync(buildDir, { recursive: true, force: true });
});

describe('RH-11: caching and static 404s', () => {
  test('a hashed /static/ asset is immutable and long-cached', async () => {
    const res = await request(app).get('/static/js/main.abc123.js');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toMatch(/immutable/);
    expect(res.headers['cache-control']).toMatch(/max-age=31536000/);
  });

  test('the HTML shell is no-cache', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toMatch(/no-cache/);
  });

  test('a missing /static/ file gives 404, not the SPA shell', async () => {
    const res = await request(app).get('/static/js/does-not-exist.js');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('an unknown non-static route gets the SPA shell with no-cache', async () => {
    const res = await request(app).get('/some/spa/route');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toMatch(/no-cache/);
  });
});
