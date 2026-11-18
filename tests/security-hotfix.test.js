// Tests for the 2026-11-18 security hotfix (PR A): RH-01, RH-03, RH-06.
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../server.js');
const User = require('../models/User');

// A tiny but valid Goodreads export. Only "read" rows are counted.
const CSV = [
  'Title,Author,My Rating,Number of Pages,Date Read,Exclusive Shelf',
  'Dune,Frank Herbert,5,412,2023/01/02,read',
  'Hyperion,Dan Simmons,4,482,2023/03/04,read',
  'Unread Book,Nobody,0,100,,to-read',
].join('\n');

async function makeUser(username, password) {
  const hashed = await bcrypt.hash(password, 10);
  return User.create({
    username,
    password: hashed,
    readingData: { books: [], stats: {}, goals: { yearly: 52, monthly: 4 } },
  });
}

// Log in a user and return an agent carrying the session cookie.
async function loginAgent(username, password) {
  const agent = request.agent(app);
  const res = await agent
    .post('/api/auth/login')
    .send({ username, password });
  expect(res.status).toBe(200);
  return agent;
}

describe('RH-01: /api/stats removed; uploads parsed in memory, per-user id', () => {
  test('anonymous GET /api/stats returns 404 (route removed)', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(404);
  });

  test('anonymous upload returns parsed data without persisting to a user', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from(CSV), { filename: 'export.csv', contentType: 'text/csv' });
    expect(res.status).toBe(200);
    expect(res.body.data.books).toHaveLength(2); // only the two "read" rows
    expect(res.body.data.stats.totalBooks).toBe(2);
    // No user should have been created or mutated by an anonymous upload.
    expect(await User.countDocuments()).toBe(0);
  });

  test('a signed-in upload stores books on that user only, keyed by id', async () => {
    const owner = await makeUser('owner', 'password123');
    const other = await makeUser('bystander', 'password123');
    const agent = await loginAgent('owner', 'password123');

    const res = await agent
      .post('/api/upload')
      .attach('file', Buffer.from(CSV), { filename: 'export.csv', contentType: 'text/csv' });
    expect(res.status).toBe(200);

    const ownerDoc = await User.findById(owner._id);
    const otherDoc = await User.findById(other._id);
    expect(ownerDoc.readingData.books).toHaveLength(2);
    expect(otherDoc.readingData.books).toHaveLength(0);
  });

  test('upload never writes a file to disk', async () => {
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const before = fs.existsSync(uploadsDir) ? countFiles(uploadsDir) : 0;

    await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from(CSV), { filename: 'export.csv', contentType: 'text/csv' });

    const after = fs.existsSync(uploadsDir) ? countFiles(uploadsDir) : 0;
    expect(after).toBe(before);
  });
});

describe('RH-03: Replit header login is gone', () => {
  test('login with only Replit headers does not authenticate or create a user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Replit-User-Id', 'spoofed-123')
      .set('X-Replit-User-Name', 'attacker')
      .send({}); // no username/password body
    expect([400, 401]).toContain(res.status);
    expect(await User.countDocuments()).toBe(0);
  });
});

describe('RH-06: upload is rate limited', () => {
  test('the 11th upload within the window is rejected with 429', async () => {
    const agent = request.agent(app);
    let last;
    for (let i = 0; i < 11; i++) {
      last = await agent
        .post('/api/upload')
        .attach('file', Buffer.from(CSV), { filename: 'export.csv', contentType: 'text/csv' });
    }
    expect(last.status).toBe(429);
  });
});

function countFiles(dir) {
  const fs = require('fs');
  const path = require('path');
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) n += countFiles(path.join(dir, entry.name));
    else n += 1;
  }
  return n;
}
