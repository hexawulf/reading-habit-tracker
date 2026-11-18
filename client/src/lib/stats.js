// Client-side reading statistics (RH-09).
//
// ESM mirror of /shared/stats.js. The two files must stay in lockstep; the
// server (CommonJS) and the client (this file) share one algorithm so the
// dashboard and the API never disagree. Both are covered by unit tests.
//
// Book shape: { title, author, myRating (0 = unrated), pages, dateRead }.

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Average rating ignores unrated books (myRating <= 0), not counting them as 0.
export function averageRating(books) {
  const rated = books.filter((b) => b.myRating && b.myRating > 0);
  if (rated.length === 0) return 0;
  const sum = rated.reduce((acc, b) => acc + b.myRating, 0);
  return parseFloat((sum / rated.length).toFixed(2));
}

export function generateStats(books, now = new Date()) {
  const list = Array.isArray(books) ? books : [];
  const totalBooks = list.length;
  const totalPages = list.reduce((sum, b) => sum + (b.pages || 0), 0);

  const readingByYear = {};
  const readingByMonth = {};
  list.forEach((book) => {
    const d = toDate(book.dateRead);
    if (!d) return;
    const year = d.getFullYear();
    const month = d.getMonth();
    readingByYear[year] = (readingByYear[year] || 0) + 1;
    if (!readingByMonth[year]) readingByMonth[year] = Array(12).fill(0);
    readingByMonth[year][month]++;
  });

  const authorCounts = {};
  list.forEach((book) => {
    if (book.author) authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
  });
  const topAuthors = Object.entries(authorCounts)
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  list.forEach((book) => {
    if (book.myRating > 0 && book.myRating <= 5) ratingDistribution[book.myRating]++;
  });

  const currentYear = now.getFullYear();
  const booksThisYear = list.filter((b) => {
    const d = toDate(b.dateRead);
    return d && d.getFullYear() === currentYear;
  }).length;

  const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const pagesLastYear = list.reduce((sum, b) => {
    const d = toDate(b.dateRead);
    if (d && d >= yearAgo && d <= now) return sum + (b.pages || 0);
    return sum;
  }, 0);

  const readingPace = {
    booksPerYear: booksThisYear,
    booksPerMonth: parseFloat((booksThisYear / 12).toFixed(2)),
    pagesPerDay: parseFloat((pagesLastYear / 365).toFixed(2)),
  };

  let longestBook = { title: '', author: '', pages: 0 };
  let shortestBook = { title: '', author: '', pages: Number.MAX_SAFE_INTEGER };
  list.forEach((book) => {
    if ((book.pages || 0) > longestBook.pages) {
      longestBook = { title: book.title, author: book.author, pages: book.pages };
    }
    if (book.pages > 0 && book.pages < shortestBook.pages) {
      shortestBook = { title: book.title, author: book.author, pages: book.pages };
    }
  });
  if (shortestBook.pages === Number.MAX_SAFE_INTEGER) {
    shortestBook = { title: '', author: '', pages: 0 };
  }
  const averageLength = totalBooks ? Math.round(totalPages / totalBooks) : 0;

  return {
    totalBooks,
    totalPages,
    averageRating: averageRating(list),
    readingByYear,
    readingByMonth,
    readingByGenre: {},
    topAuthors,
    ratingDistribution,
    readingPace,
    pageStats: { totalPages, averageLength, longestBook, shortestBook },
  };
}

// Goal progress against the user's stored goals (not hard-coded 52 / 4).
export function calculateGoalProgress(books, goals, now = new Date()) {
  const yearlyTarget = goals && goals.yearly > 0 ? goals.yearly : 52;
  const monthlyTarget = goals && goals.monthly > 0 ? goals.monthly : 4;
  const list = Array.isArray(books) ? books : [];
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const booksThisYear = list.filter((b) => {
    const d = toDate(b.dateRead);
    return d && d.getFullYear() === currentYear;
  }).length;

  const booksThisMonth = list.filter((b) => {
    const d = toDate(b.dateRead);
    return d && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  }).length;

  return {
    yearly: {
      current: booksThisYear,
      target: yearlyTarget,
      percentage: yearlyTarget > 0 ? Math.round((booksThisYear / yearlyTarget) * 100) : 0,
    },
    monthly: {
      current: booksThisMonth,
      target: monthlyTarget,
      percentage: monthlyTarget > 0 ? Math.round((booksThisMonth / monthlyTarget) * 100) : 0,
    },
  };
}
