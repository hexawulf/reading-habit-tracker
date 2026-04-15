import React, { createContext, useContext, useState, useEffect } from 'react';
import storageService from '../services/storageService';

export const ReadingDataContext = createContext(null);

export const useReadingData = () => {
  const context = useContext(ReadingDataContext);
  if (!context) {
    throw new Error('useReadingData must be used within a ReadingDataProvider');
  }
  return context;
};

const EMPTY_STATS = {
  totalBooks: 0,
  averageRating: 0,
  readingByYear: {},
  readingByMonth: {},
  ratingDistribution: {},
  bestYear: null,
  worstYear: null,
  averagePerYear: 0,
  averagePerMonth: 0,
  readingPace: { booksPerMonth: 0, booksPerYear: 0, pagesPerDay: 0 },
  pageStats: { totalPages: 0, averageLength: 0, longestBook: { title: '', pages: 0 } },
  topAuthors: [],
  readingByGenre: {}
};

const EMPTY_GOAL_PROGRESS = {
  yearly: { current: 0, target: 52, percentage: 0 },
  monthly: { current: 0, target: 4, percentage: 0 }
};

// Pure functions — defined outside the component so their references are stable
// and can be safely listed as useEffect dependencies without causing infinite loops.

function calculateStats(books) {
  if (!books || books.length === 0) {
    return { ...EMPTY_STATS };
  }

  const booksWithValidDates = books.filter(
    book => book.dateRead && !isNaN(new Date(book.dateRead))
  );

  if (booksWithValidDates.length === 0) {
    return { ...EMPTY_STATS, totalBooks: books.length };
  }

  let earliestDate = new Date(booksWithValidDates[0].dateRead);
  let latestDate = new Date(booksWithValidDates[0].dateRead);

  booksWithValidDates.forEach(book => {
    const currentDate = new Date(book.dateRead);
    if (currentDate < earliestDate) earliestDate = currentDate;
    if (currentDate > latestDate) latestDate = currentDate;
  });

  const readingByYear = {};
  const readingByMonth = {};
  let totalPagesWithValidDates = 0;

  booksWithValidDates.forEach(book => {
    const year = new Date(book.dateRead).getFullYear().toString();
    const month = new Date(book.dateRead).getMonth();

    readingByYear[year] = (readingByYear[year] || 0) + 1;

    if (!readingByMonth[year]) readingByMonth[year] = Array(12).fill(0);
    readingByMonth[year][month]++;
    totalPagesWithValidDates += (book.pages || 0);
  });

  const authorCounts = {};
  booksWithValidDates.forEach(book => {
    if (book.author) {
      authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
    }
  });

  const topAuthors = Object.entries(authorCounts)
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count);

  const numBooksWithValidDates = booksWithValidDates.length;

  const currentYear = new Date().getFullYear();
  const booksThisYear = booksWithValidDates.filter(
    book => new Date(book.dateRead).getFullYear() === currentYear
  );
  const monthsElapsedThisYear = new Date().getMonth() + 1;
  const booksPerMonthCurrentYear =
    monthsElapsedThisYear > 0 ? booksThisYear.length / monthsElapsedThisYear : 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentBooks = booksWithValidDates.filter(
    book => new Date(book.dateRead) >= thirtyDaysAgo
  );
  const recentPages = recentBooks.reduce((sum, book) => sum + (book.pages || 0), 0);
  const pagesPerDayLast30Days = recentBooks.length > 0 ? recentPages / 30 : 0;

  return {
    totalBooks: books.length,
    averageRating:
      numBooksWithValidDates > 0
        ? booksWithValidDates.reduce((sum, book) => sum + (book.myRating || 0), 0) /
          numBooksWithValidDates
        : 0,
    readingByYear,
    readingByMonth,
    ratingDistribution:
      numBooksWithValidDates > 0
        ? booksWithValidDates.reduce(
            (dist, book) => {
              const rating = Number(book.myRating);
              if (rating >= 1 && rating <= 5) {
                dist[rating] = (dist[rating] || 0) + 1;
              }
              return dist;
            },
            { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          )
        : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    readingPace: {
      booksPerMonth: booksPerMonthCurrentYear,
      booksPerYear: numBooksWithValidDates,
      pagesPerDay: pagesPerDayLast30Days
    },
    pageStats: {
      totalPages: totalPagesWithValidDates,
      averageLength:
        numBooksWithValidDates > 0
          ? totalPagesWithValidDates / numBooksWithValidDates
          : 0,
      longestBook:
        numBooksWithValidDates > 0
          ? booksWithValidDates.reduce(
              (longest, book) =>
                book.pages > (longest?.pages || 0) ? book : longest,
              { title: '', pages: 0 }
            )
          : { title: '', pages: 0 }
    },
    topAuthors,
    readingByGenre: {}
  };
}

function calculateGoalProgress(books) {
  if (!books || !books.length) {
    return { ...EMPTY_GOAL_PROGRESS };
  }

  const currentYear = new Date().getFullYear().toString();
  const currentMonth = new Date().getMonth();

  const booksThisYear = books.filter(book => {
    if (!book.dateRead) return false;
    return new Date(book.dateRead).getFullYear().toString() === currentYear;
  }).length;

  const booksThisMonth = books.filter(book => {
    if (!book.dateRead) return false;
    const date = new Date(book.dateRead);
    return (
      date.getFullYear().toString() === currentYear &&
      date.getMonth() === currentMonth
    );
  }).length;

  return {
    yearly: {
      current: booksThisYear,
      target: 52,
      percentage: Math.round((booksThisYear / 52) * 100)
    },
    monthly: {
      current: booksThisMonth,
      target: 4,
      percentage: Math.round((booksThisMonth / 4) * 100)
    }
  };
}

export const ReadingDataProvider = ({ children }) => {
  const [readingData, setReadingData] = useState([]);
  const [stats, setStats] = useState({ ...EMPTY_STATS });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [goalProgress, setGoalProgress] = useState({ ...EMPTY_GOAL_PROGRESS });

  useEffect(() => {
    const loadLocalData = async () => {
      try {
        const saved = await storageService.loadData();
        let books = [];

        if (Array.isArray(saved?.readingData)) {
          books = saved.readingData;
        } else if (saved?.readingData?.books) {
          books = saved.readingData.books;
        }

        if (books.length > 0) {
          const freshStats = calculateStats(books);
          const freshGoalProgress = calculateGoalProgress(books);

          setReadingData(books);
          setStats(freshStats);
          setGoalProgress(freshGoalProgress);

          storageService.saveData({
            readingData: books,
            stats: freshStats,
            goalProgress: freshGoalProgress
          });
        }
      } catch (err) {
        setError(err.message);
        setReadingData([]);
      } finally {
        setLoading(false);
      }
    };

    loadLocalData();
  }, []); // calculateStats and calculateGoalProgress are module-level — stable references

  const processReadingData = (data) => {
    setLoading(true);
    try {
      const booksToProcess = data?.books
        ? data.books
        : Array.isArray(data)
        ? data
        : readingData;
      const calculatedStats = calculateStats(booksToProcess);
      const calculatedGoalProgress = calculateGoalProgress(booksToProcess);

      setReadingData(booksToProcess);
      setStats(calculatedStats);
      setGoalProgress(calculatedGoalProgress);

      storageService.saveData({
        readingData: booksToProcess,
        stats: calculatedStats,
        goalProgress: calculatedGoalProgress
      });
    } catch (err) {
      console.error('Error in processReadingData:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateGoals = (yearlyGoal, monthlyGoal) => {
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = new Date().getMonth();
    const yearCount = stats.readingByYear[currentYear] || 0;
    const monthCount = stats.readingByMonth?.[currentYear]?.[currentMonth] || 0;

    const newGoalProgress = {
      yearly: {
        current: yearCount,
        target: yearlyGoal,
        percentage: yearlyGoal > 0 ? Math.round((yearCount / yearlyGoal) * 100) : 0
      },
      monthly: {
        current: monthCount,
        target: monthlyGoal,
        percentage: monthlyGoal > 0 ? Math.round((monthCount / monthlyGoal) * 100) : 0
      }
    };

    setGoalProgress(newGoalProgress);
    storageService.saveData({ readingData, stats, goalProgress: newGoalProgress });
  };

  const clearAllData = () => {
    storageService.clearData();
    setReadingData([]);
    setStats({ ...EMPTY_STATS });
    setGoalProgress({ ...EMPTY_GOAL_PROGRESS });
  };

  const forceClearAndRecalculate = () => {
    storageService.clearData();
    if (readingData && readingData.length > 0) {
      const freshStats = calculateStats(readingData);
      const freshGoalProgress = calculateGoalProgress(readingData);
      setStats(freshStats);
      setGoalProgress(freshGoalProgress);
      storageService.saveData({
        readingData,
        stats: freshStats,
        goalProgress: freshGoalProgress
      });
    } else {
      setStats({ ...EMPTY_STATS });
      setGoalProgress({ ...EMPTY_GOAL_PROGRESS });
    }
  };

  const contextValue = {
    readingData,
    stats,
    loading,
    error,
    goalProgress,
    processReadingData,
    updateGoals,
    clearAllData,
    forceClearAndRecalculate
  };

  return (
    <ReadingDataContext.Provider value={contextValue}>
      {children}
    </ReadingDataContext.Provider>
  );
};
