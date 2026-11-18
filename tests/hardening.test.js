// Tests for RH-12 (security headers) and RH-15 (My files routes removed).
const request = require('supertest');
const app = require('../server.js');

describe('RH-12: security headers', () => {
  test('x-powered-by is not sent', async () => {
    const res = await request(app).get('/api/auth/status');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('a Content-Security-Policy header is present and allows Google sign-in', async () => {
    const res = await request(app).get('/api/auth/status');
    const csp = res.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toMatch(/apis\.google\.com/);
  });
});

describe('RH-15: the My files routes are gone', () => {
  test('GET /api/files/list returns the API 404, not data', async () => {
    const res = await request(app).get('/api/files/list');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('API endpoint not found');
  });

  test('DELETE /api/files/delete/:f returns the API 404', async () => {
    const res = await request(app).delete('/api/files/delete/x.csv');
    expect(res.status).toBe(404);
  });
});
