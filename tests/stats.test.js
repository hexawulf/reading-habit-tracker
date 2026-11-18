// Unit tests for the shared stats module (RH-09).
const { generateStats, calculateGoalProgress, averageRating } = require('../shared/stats');

const NOW = new Date('2026-06-15T12:00:00Z');

function book(overrides) {
  return { title: 't', author: 'a', myRating: 0, pages: 0, dateRead: null, ...overrides };
}

describe('averageRating ignores unrated books', () => {
  test('a 0-rated book is not counted as a zero', () => {
    const books = [
      book({ myRating: 5 }),
      book({ myRating: 3 }),
      book({ myRating: 0 }), // unrated — excluded
    ];
    expect(averageRating(books)).toBe(4); // (5+3)/2, not (5+3+0)/3
  });

  test('all unrated gives 0', () => {
    expect(averageRating([book({ myRating: 0 }), book({})])).toBe(0);
  });
});

describe('booksPerYear counts the current calendar year only', () => {
  test('older years are excluded', () => {
    const books = [
      book({ dateRead: '2026-01-10' }),
      book({ dateRead: '2026-05-01' }),
      book({ dateRead: '2024-05-01' }), // previous year
    ];
    const stats = generateStats(books, NOW);
    expect(stats.readingPace.booksPerYear).toBe(2);
  });
});

describe('pagesPerDay uses the last 365 days / 365', () => {
  test('pages older than a year are excluded', () => {
    const books = [
      book({ pages: 365, dateRead: '2026-06-01' }), // within last year
      book({ pages: 730, dateRead: '2020-01-01' }), // older than a year
    ];
    const stats = generateStats(books, NOW);
    expect(stats.readingPace.pagesPerDay).toBe(parseFloat((365 / 365).toFixed(2))); // == 1
  });
});

describe('totals and distribution', () => {
  test('totalBooks and totalPages count every book', () => {
    const books = [book({ pages: 100 }), book({ pages: 200 })];
    const stats = generateStats(books, NOW);
    expect(stats.totalBooks).toBe(2);
    expect(stats.totalPages).toBe(300);
  });
});

describe('calculateGoalProgress uses stored goals, not hard-coded 52/4', () => {
  test('a custom yearly goal of 10 is used', () => {
    const books = [
      book({ dateRead: '2026-01-10' }),
      book({ dateRead: '2026-02-10' }),
    ];
    const progress = calculateGoalProgress(books, { yearly: 10, monthly: 2 }, NOW);
    expect(progress.yearly.target).toBe(10);
    expect(progress.yearly.current).toBe(2);
    expect(progress.yearly.percentage).toBe(20);
    expect(progress.monthly.target).toBe(2);
  });

  test('falls back to 52/4 when goals are missing', () => {
    const progress = calculateGoalProgress([], null, NOW);
    expect(progress.yearly.target).toBe(52);
    expect(progress.monthly.target).toBe(4);
  });
});
