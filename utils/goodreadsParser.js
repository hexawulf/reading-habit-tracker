// Utility functions for parsing and analyzing Goodreads CSV data
// File: utils/goodreadsParser.js

const csv = require('csv-parser');
const fs = require('fs');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

const parseGoodreadsCsv = (filePath) =>
  new Promise((resolve, reject) => {
    const books = [];
    fs.createReadStream(filePath)
      .on('error', (e) => reject(new Error('File read failed: ' + e.message)))
      .pipe(csv())
      .on('data', (row) => {
        if (row['Exclusive Shelf']?.trim() === 'read') {
          const dateRead = row['Date Read'] ? dayjs(row['Date Read'], ['YYYY/MM/DD', 'YYYY-MM-DD']).toDate() : null;
          books.push({
            title: row['Title']?.trim(),
            author: row['Author']?.trim(),
            dateRead,
            myRating: parseInt(row['My Rating']) || 0,
            pages: parseInt(row['Number of Pages']) || 0,
            isbn: row['ISBN13'] || row['ISBN'] || '',
            shelf: row['Exclusive Shelf']?.trim()
          });
        }
      })
      .on('error', (e) => reject(new Error('CSV parse failed: ' + e.message)))
      .on('end', () => resolve(books));
  });

/**
 * Generate comprehensive reading statistics from book data
 * @param {Array} books - Array of book objects
 * @returns {Object} - Statistics object
 */
function generateReadingStats(books) {
  if (!books || books.length === 0) {
    return getEmptyStats();
  }

  // Basic stats
  const totalBooks = books.length;
  const totalPages = books.reduce((sum, book) => sum + (book.pages || 0), 0);

  // Rating stats
  const booksWithRatings = books.filter(book => book.myRating > 0);
  const averageRating = booksWithRatings.length > 0
    ? booksWithRatings.reduce((sum, book) => sum + book.myRating, 0) / booksWithRatings.length
    : 0;

  // Calculate reading progress over time
  const readingByYear = calculateReadingByYear(books);
  const readingByMonth = calculateReadingByMonth(books);
  const readingByGenre = calculateReadingByGenre(books);

  // Author statistics
  const topAuthors = calculateTopAuthors(books);

  // Rating distribution
  const ratingDistribution = calculateRatingDistribution(books);

  // Page statistics
  const pageStats = calculatePageStats(books);

  // Reading pace
  const readingPace = calculateReadingPace(books);

  // Reading streaks
  const streaks = calculateReadingStreaks(books);

  return {
    totalBooks,
    totalPages,
    averageRating: parseFloat(averageRating.toFixed(2)),
    readingByYear,
    readingByMonth,
    readingByGenre,
    topAuthors,
    ratingDistribution,
    pageStats,
    readingPace,
    streaks,
    recentBooks: books.slice(0, 30) // Most recent 30 books
  };
}

/**
 * Returns empty stats object with default values
 * @returns {Object} - Empty stats object
 */
function getEmptyStats() {
  return {
    totalBooks: 0,
    totalPages: 0,
    averageRating: 0,
    readingByYear: {},
    readingByMonth: {},
    readingByGenre: {},
    topAuthors: [],
    ratingDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
    pageStats: {
      shortestBook: null,
      longestBook: null,
      averageLength: 0
    },
    readingPace: {
      booksPerYear: 0,
      booksPerMonth: 0,
      pagesPerDay: 0
    },
    streaks: {
      current: 0,
      longest: 0
    },
    recentBooks: []
  };
}

/**
 * Calculate reading distribution by year
 * @param {Array} books - Array of book objects
 * @returns {Object} - Year-based reading counts
 */
function calculateReadingByYear(books) {
  const byYear = {};

  books.forEach(book => {
    if (book.dateRead) {
      // Extract year from ISO date string
      const year = book.dateRead.getFullYear();
      byYear[year] = (byYear[year] || 0) + 1;
    }
  });

  return byYear;
}

/**
 * Calculate reading distribution by month for recent years
 * @param {Array} books - Array of book objects
 * @returns {Object} - Month-based reading counts for recent years
 */
function calculateReadingByMonth(books) {
  const currentYear = new Date().getFullYear();
  const byMonth = {};

  // Initialize data structure for current and previous year
  [currentYear, currentYear - 1, currentYear - 2].forEach(year => {
    byMonth[year] = Array(12).fill(0);
  });

  books.forEach(book => {
    if (book.dateRead) {
      const year = book.dateRead.getFullYear();
      const month = book.dateRead.getMonth();

      if (byMonth[year]) {
        byMonth[year][month] += 1;
      }
    }
  });

  return byMonth;
}

/**
 * Calculate reading distribution by genre/bookshelf
 * @param {Array} books - Array of book objects
 * @returns {Object} - Genre-based reading counts
 */
function calculateReadingByGenre(books) {
  const byGenre = {};

  books.forEach(book => {
    if (book.bookshelves) {
      const shelves = book.bookshelves.split(',').map(s => s.trim());

      shelves.forEach(shelf => {
        if (shelf && shelf !== '') {
          byGenre[shelf] = (byGenre[shelf] || 0) + 1;
        }
      });
    }
  });

  // Sort by count (descending) and return top 20
  return Object.entries(byGenre)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .reduce((obj, [genre, count]) => {
      obj[genre] = count;
      return obj;
    }, {});
}

/**
 * Calculate top authors by book count
 * @param {Array} books - Array of book objects
 * @returns {Array} - Top authors with book counts
 */
function calculateTopAuthors(books) {
  const authorCounts = {};

  books.forEach(book => {
    if (book.author) {
      authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
    }
  });

  return Object.entries(authorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([author, count]) => ({ author, count }));
}

/**
 * Calculate rating distribution
 * @param {Array} books - Array of book objects
 * @returns {Object} - Rating distribution
 */
function calculateRatingDistribution(books) {
  const distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};

  books.forEach(book => {
    if (book.myRating > 0) {
      distribution[book.myRating] += 1;
    }
  });

  return distribution;
}

/**
 * Calculate page-related statistics
 * @param {Array} books - Array of book objects
 * @returns {Object} - Page statistics
 */
function calculatePageStats(books) {
  if (!books || books.length === 0) {
    return {
      shortestBook: null,
      longestBook: null,
      averageLength: 0
    };
  }

  // Filter books with page counts
  const booksWithPages = books.filter(book => book.pages > 0);

  if (booksWithPages.length === 0) {
    return {
      shortestBook: null,
      longestBook: null,
      averageLength: 0
    };
  }

  // Find shortest and longest books
  const shortestBook = booksWithPages.reduce((shortest, book) => 
    (!shortest || book.pages < shortest.pages) ? book : shortest, null);

  const longestBook = booksWithPages.reduce((longest, book) => 
    (!longest || book.pages > longest.pages) ? book : longest, null);

  // Calculate average page count
  const totalPages = booksWithPages.reduce((sum, book) => sum + book.pages, 0);
  const averageLength = Math.round(totalPages / booksWithPages.length);

  return {
    shortestBook: {
      title: shortestBook.title,
      author: shortestBook.author,
      pages: shortestBook.pages
    },
    longestBook: {
      title: longestBook.title,
      author: longestBook.author,
      pages: longestBook.pages
    },
    averageLength
  };
}

/**
 * Calculate reading pace statistics
 * @param {Array} books - Array of book objects
 * @returns {Object} - Reading pace statistics
 */
function calculateReadingPace(books) {
  if (!books || books.length === 0) {
    return {
      booksPerYear: 0,
      booksPerMonth: 0,
      pagesPerDay: 0
    };
  }

  // Get books with valid dates
  const booksWithDates = books.filter(book => book.dateRead);

  if (booksWithDates.length === 0) {
    return {
      booksPerYear: 0,
      booksPerMonth: 0,
      pagesPerDay: 0
    };
  }

  // Sort by date
  booksWithDates.sort((a, b) => new Date(a.dateRead) - new Date(b.dateRead));

  // Calculate date range
  const firstDate = new Date(booksWithDates[0].dateRead);
  const lastDate = new Date(booksWithDates[booksWithDates.length - 1].dateRead);

  // Calculate days between first and last read
  const daysDiff = Math.max(1, Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
  const yearsDiff = daysDiff / 365.25;
  const monthsDiff = yearsDiff * 12;

  // Calculate reading pace
  const booksPerYear = parseFloat((booksWithDates.length / yearsDiff).toFixed(2));
  const booksPerMonth = parseFloat((booksWithDates.length / monthsDiff).toFixed(2));

  // Calculate pages per day
  const totalPages = booksWithDates.reduce((sum, book) => sum + (book.pages || 0), 0);
  const pagesPerDay = parseFloat((totalPages / daysDiff).toFixed(2));

  return {
    booksPerYear,
    booksPerMonth,
    pagesPerDay
  };
}

/**
 * Calculate reading streak statistics
 * @param {Array} books - Array of book objects
 * @returns {Object} - Reading streak statistics
 */
function calculateReadingStreaks(books) {
  // This is a simplified version that could be expanded
  // For now, we'll just calculate consecutive days/months with reading

  if (!books || books.length === 0) {
    return {
      current: 0,
      longest: 0
    };
  }

  // For a proper streak calculation, we would need to track daily reading
  // which would require more detailed data than we have in the Goodreads export

  // As a placeholder, we'll return some basic values
  return {
    current: 0, // Would require daily tracking
    longest: 0  // Would require daily tracking
  };
}

module.exports = {
  parseGoodreadsCsv,
  generateReadingStats
};