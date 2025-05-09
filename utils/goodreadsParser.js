// Utility functions for parsing and analyzing Goodreads CSV data
// File: utils/goodreadsParser.js

const fs = require('fs');
const csv = require('csv-parser');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');

// Extend dayjs with custom parse format
dayjs.extend(customParseFormat);

/**
 * Parse a Goodreads CSV export file
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} - Promise resolving to an array of book objects
 */
function parseGoodreadsCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        try {
          // Validate the CSV format by checking for required fields
          if (!validateGoodreadsCSV(data)) {
            throw new Error('Invalid Goodreads CSV format');
          }

          // Process dates with proper format handling
          let dateRead = null;
          if (data['Date Read'] && data['Date Read'].trim() !== '') {
            // Goodreads date format is typically YYYY/MM/DD
            dateRead = parseGoodreadsDate(data['Date Read']);
          }

          let dateAdded = null;
          if (data['Date Added'] && data['Date Added'].trim() !== '') {
            dateAdded = parseGoodreadsDate(data['Date Added']);
          }

          // Handle numeric fields, providing defaults if parsing fails
          const myRating = parseInt(data['My Rating']) || 0;
          const averageRating = parseFloat(data['Average Rating']) || 0;
          const pages = parseInt(data['Number of Pages']) || 0;
          const yearPublished = parseInt(data['Year Published']) || null;
          const originalYear = parseInt(data['Original Publication Year']) || null;
          const readCount = parseInt(data['Read Count']) || 0;
          const ownedCopies = parseInt(data['Owned Copies']) || 0;

          // Create the transformed book object
          const book = {
            bookId: data['Book Id'] || '',
            title: data['Title'] || '',
            author: data['Author'] || '',
            authorLastFirst: data['Author l-f'] || '',
            additionalAuthors: data['Additional Authors'] || '',
            isbn: data['ISBN'] || '',
            isbn13: data['ISBN13'] || '',
            myRating,
            averageRating,
            publisher: data['Publisher'] || '',
            binding: data['Binding'] || '',
            pages,
            yearPublished,
            originalPublicationYear: originalYear,
            dateRead,
            dateAdded,
            bookshelves: data['Bookshelves'] || '',
            bookshelvesWithPositions: data['Bookshelves with positions'] || '',
            exclusiveShelf: data['Exclusive Shelf'] || '',
            myReview: data['My Review'] || '',
            readCount,
            ownedCopies
          };

          // Only include books that have been marked as read
          if (book.exclusiveShelf === 'read') {
            results.push(book);
          }
        } catch (error) {
          console.error('Error processing row:', error);
          // Continue processing other rows instead of rejecting the entire promise
        }
      })
      .on('end', () => {
        // Sort books by date read (most recent first)
        results.sort((a, b) => {
          if (!a.dateRead) return 1;
          if (!b.dateRead) return -1;
          return new Date(b.dateRead) - new Date(a.dateRead);
        });

        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Validates that the CSV row has the expected Goodreads format
 * @param {Object} row - CSV row object
 * @returns {boolean} - True if valid, false otherwise
 */
function validateGoodreadsCSV(row) {
  // Check for minimum required fields
  const requiredFields = ['Book Id', 'Title', 'Author', 'Exclusive Shelf'];
  return requiredFields.every(field => field in row);
}

/**
 * Parse a date string from Goodreads format
 * @param {string} dateString - Date string in Goodreads format
 * @returns {string} - ISO formatted date string
 */
function parseGoodreadsDate(dateString) {
  if (!dateString) return null;

  // Goodreads uses multiple date formats, try to handle the common ones
  const formats = [
    'YYYY/MM/DD', // Standard Goodreads export format
    'MM/DD/YYYY', // Alternative format sometimes used
    'YYYY-MM-DD', // ISO format
    'DD/MM/YYYY'  // European format
  ];

  for (const format of formats) {
    const parsedDate = dayjs(dateString, format);
    if (parsedDate.isValid()) {
      return parsedDate.format('YYYY-MM-DD');
    }
  }

  // If none of the formats work, return the original string
  console.warn(`Could not parse date: ${dateString}`);
  return null;
}

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
      const year = book.dateRead.split('-')[0];
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
      const dateParts = book.dateRead.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-indexed

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
  parseGoodreadsCSV,
  generateReadingStats
};