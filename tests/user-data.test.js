// Tests for RH-10: JSON body limit + book-array validation on /api/user/data.
const request = require('supertest');
const app = require('../server.js');

async function signedInAgent(username) {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({ username, password: 'password123' });
  return agent;
}

describe('RH-10: saving the library', () => {
  test('1,500 valid books save fine', async () => {
    const agent = await signedInAgent('libuser');
    const books = Array.from({ length: 1500 }, (_, i) => ({
      title: `Book ${i}`,
      author: 'Author',
      myRating: (i % 5) + 1,
      pages: 100 + i,
      dateRead: '2026-01-01',
    }));
    const res = await agent.post('/api/user/data').send({ readingData: books, stats: {} });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('a malformed book array gives 400, not 500', async () => {
    const agent = await signedInAgent('baduser');
    const res = await agent
      .post('/api/user/data')
      .send({ readingData: [{ title: 123, author: {} }], stats: {} });
    expect(res.status).toBe(400);
  });

  test('a non-array readingData gives 400', async () => {
    const agent = await signedInAgent('baduser2');
    const res = await agent.post('/api/user/data').send({ readingData: 'nope' });
    expect(res.status).toBe(400);
  });
});
