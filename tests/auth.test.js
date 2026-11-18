// Tests for RH-04 (session behind proxy) and RH-08 (auth body validation).
const request = require('supertest');
const app = require('../server.js');
const User = require('../models/User');

describe('RH-04: session works behind a proxy', () => {
  test('register sets a session cookie and status reflects it', async () => {
    const agent = request.agent(app);
    const reg = await agent
      .post('/api/auth/register')
      .set('X-Forwarded-Proto', 'https')
      .send({ username: 'alice', password: 'password123' });
    expect(reg.status).toBe(200);
    expect(reg.headers['set-cookie']).toBeDefined();
    expect(reg.body.user).toEqual(
      expect.objectContaining({ name: 'alice' })
    );
    // The DTO must not leak the password hash.
    expect(reg.body.user.password).toBeUndefined();

    const status = await agent
      .get('/api/auth/status')
      .set('X-Forwarded-Proto', 'https');
    expect(status.status).toBe(200);
    expect(status.body.isAuthenticated).toBe(true);
    expect(status.body.user.name).toBe('alice');
  });

  test('login issues a cookie and a follow-up status is authenticated', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'bob', password: 'password123' });

    const agent = request.agent(app);
    const login = await agent
      .post('/api/auth/login')
      .set('X-Forwarded-Proto', 'https')
      .send({ username: 'bob', password: 'password123' });
    expect(login.status).toBe(200);
    expect(login.headers['set-cookie']).toBeDefined();

    const status = await agent.get('/api/auth/status');
    expect(status.status).toBe(200);
    expect(status.body.isAuthenticated).toBe(true);
  });
});

describe('RH-08: auth body validation', () => {
  test('a non-string username gives 400, not 500, and queries nothing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
    expect(await User.countDocuments()).toBe(0);
  });

  test('register rejects a short password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'carol', password: 'short' });
    expect(res.status).toBe(400);
  });

  test('login does not leak error.message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });
});
