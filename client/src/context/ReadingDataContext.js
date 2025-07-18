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

export const ReadingDataProvider = ({ children }) => {
  const [readingData, setReadingData] = useState([]);
  const [stats, setStats] = useState({
    totalBooks: 0,
    averageRating: 0,
    readingByYear: {},
    readingByMonth: {},
    ratingDistribution: {},
    bestYear: null,
    worstYear: null,
    averagePerYear: 0,
    averagePerMonth: 0,
    readingPace: {
      booksPerMonth: 0,
      booksPerYear: 0,
      pagesPerDay: 0
    },
    pageStats: {
      totalPages: 0,
      averageLength: 0,
      longestBook: { title: '', pages: 0 }
    },
    topAuthors: [],
    readingByGenre: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [goalProgress, setGoalProgress] = useState({
    yearly: { current: 0, target: 0, percentage: 0 },
    monthly: { current: 0, target: 0, percentage: 0 }
  });

  const calculateStats = (books) => {
    // If books is empty or undefined, return the current stats object (which has defaults)
    if (!books || books.length === 0) {
      return stats;
    }

    const booksWithValidDates = books.filter(book => book.dateRead && !isNaN(new Date(book.dateRead)));

    const booksIn2025 = booksWithValidDates.filter(book => {
      const year = new Date(book.dateRead).getFullYear();
      return year === 2025;
    });

    // If no books have valid dates, return existing stats or a default for readingPace
    if (booksWithValidDates.length === 0) {
      return {
        ...stats, // Return existing stats
        readingPace: { // Ensure readingPace is explicitly zeroed out
          booksPerMonth: 0,
          booksPerYear: 0,
          pagesPerDay: 0
        }
      };
    }

    let earliestDate = new Date(booksWithValidDates[0].dateRead);
    let latestDate = new Date(booksWithValidDates[0].dateRead);

    booksWithValidDates.forEach(book => {
      const currentDate = new Date(book.dateRead);
      if (currentDate < earliestDate) {
        earliestDate = currentDate;
      }
      if (currentDate > latestDate) {
        latestDate = currentDate;
      }
    });

    let totalReadingDays = Math.max(1, Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24)));
    if (earliestDate.getTime() === latestDate.getTime()) {
      totalReadingDays = 1;
    }

    let totalReadingMonths =
      (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 +
      (latestDate.getMonth() - earliestDate.getMonth()) + 1;
    totalReadingMonths = Math.max(1, totalReadingMonths);


    // Group books by year and month using booksWithValidDates
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

    // Calculate top authors using booksWithValidDates
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

    // New logic for Books/Month
    const currentYear = new Date().getFullYear();
    const booksThisYear = booksWithValidDates.filter(book => {
      const year = new Date(book.dateRead).getFullYear();
      return year === currentYear;
    });
    const monthsElapsedThisYear = new Date().getMonth() + 1; // January is 0, so add 1
    const booksPerMonthCurrentYear = monthsElapsedThisYear > 0 ? booksThisYear.length / monthsElapsedThisYear : 0;

    // New logic for Pages/Day
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBooks = booksWithValidDates.filter(book => {
      const readDate = new Date(book.dateRead);
      return readDate >= thirtyDaysAgo;
    });

    const recentPages = recentBooks.reduce((sum, book) => sum + (book.pages || 0), 0);
    const pagesPerDayLast30Days = recentBooks.length > 0 ? recentPages / 30 : 0;

    return {
      totalBooks: books.length, // Original total books
      averageRating: numBooksWithValidDates > 0
        ? booksWithValidDates.reduce((sum, book) => sum + (book.myRating || 0), 0) / numBooksWithValidDates
        : 0,
      readingByYear,
      readingByMonth,
      ratingDistribution: numBooksWithValidDates > 0
        ? booksWithValidDates.reduce((dist, book) => {
            const rating = Number(book.myRating);
            if (rating >= 1 && rating <= 5) {
              dist[rating] = (dist[rating] || 0) + 1;
            }
            return dist;
          }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
        : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, // Default if no books with valid dates
      readingPace: {
        booksPerMonth: booksPerMonthCurrentYear, // Updated calculation
        booksPerYear: numBooksWithValidDates, // As per instruction, keep this based on count
        pagesPerDay: pagesPerDayLast30Days, // Updated calculation
      },
      pageStats: {
        totalPages: totalPagesWithValidDates,
        averageLength: numBooksWithValidDates > 0 ? totalPagesWithValidDates / numBooksWithValidDates : 0,
        longestBook: numBooksWithValidDates > 0
          ? booksWithValidDates.reduce((longest, book) =>
              (book.pages > (longest?.pages || 0)) ? book : longest,
              { title: '', pages: 0 }
            )
          : { title: '', pages: 0 } // Default if no books with valid dates
      },
      topAuthors,
      readingByGenre: {} // Assuming this will be populated elsewhere or is fine as default
    };
  };

  const calculateGoalProgress = (books) => {
    if (!books || !books.length) {
      return {
        yearly: { current: 0, target: 52, percentage: 0 },
        monthly: { current: 0, target: 4, percentage: 0 }
      };
    }

    // Time variables removed as they're not currently used

    const currentYear = new Date().getFullYear().toString();
    const currentMonth = new Date().getMonth();

    const booksThisYear = books.filter(book => 
      new Date(book.dateRead).getFullYear().toString() === currentYear
    ).length;

    const booksThisMonth = books.filter(book => {
      const date = new Date(book.dateRead);
      return date.getFullYear().toString() === currentYear && 
             date.getMonth() === currentMonth;
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
  };

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

      // ✅ FORCE RECALCULATION - Don't load cached stats
      if (books.length > 0) {
        const freshStats = calculateStats(books); // Ensure calculateStats is available here
        const freshGoalProgress = calculateGoalProgress(books); // Ensure calculateGoalProgress is available here

        setReadingData(books);
        setStats(freshStats);
        setGoalProgress(freshGoalProgress);

        // Save the recalculated stats
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
}, [calculateStats, calculateGoalProgress]); // Add dependencies if they are defined outside the effect

  const processReadingData = (data) => {
    setLoading(true);
    try {
      // ✅ ALWAYS recalculate stats, never trust pre-calculated ones
      const booksToProcess = (data && data.books) ? data.books : (Array.isArray(data) ? data : readingData);
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
    } catch (error) {
      console.error("Error in processReadingData:", error); // It's good to log the actual error
      setError(error.message); // Set error message
    } finally {
      setLoading(false);
    }
  };

  const updateGoals = (yearlyGoal, monthlyGoal) => {
    const newGoalProgress = {
      yearly: {
        current: stats.readingByYear[new Date().getFullYear()] || 0,
        target: yearlyGoal,
        percentage: yearlyGoal > 0 ? Math.round(((stats.readingByYear[new Date().getFullYear()] || 0) / yearlyGoal) * 100) : 0
      },
      monthly: {
        current: stats.readingByMonth?.[new Date().getFullYear()]?.[new Date().getMonth()] || 0,
        target: monthlyGoal,
        percentage: monthlyGoal > 0 ? Math.round(((stats.readingByMonth?.[new Date().getFullYear()]?.[new Date().getMonth()] || 0) / monthlyGoal) * 100) : 0
      }
    };

    setGoalProgress(newGoalProgress);
    storageService.saveData({ readingData, stats, goalProgress: newGoalProgress });
  };

  const clearAllData = () => {
    storageService.clearData();
    setReadingData([]);
    setStats({
      totalBooks: 0,
      averageRating: 0,
      readingByYear: {},
      readingByMonth: {},
      ratingDistribution: {},
      readingPace: { booksPerMonth: 0, booksPerYear: 0, pagesPerDay: 0 },
      pageStats: { totalPages: 0, averageLength: 0, longestBook: { title: '', pages: 0 } },
      topAuthors: [],
      readingByGenre: {}
    });
    setGoalProgress({
      yearly: { current: 0, target: 0, percentage: 0 },
      monthly: { current: 0, target: 0, percentage: 0 }
    });
  };

const forceClearAndRecalculate = () => {
  storageService.clearData();
  if (readingData && readingData.length > 0) { // Ensure readingData is not null and has items
    const freshStats = calculateStats(readingData);
    const freshGoalProgress = calculateGoalProgress(readingData);
    setStats(freshStats);
    setGoalProgress(freshGoalProgress);
    storageService.saveData({
      readingData, // readingData itself doesn't change here, just its stats
      stats: freshStats,
      goalProgress: freshGoalProgress
    });
  } else {
    // If readingData is empty, still clear stats and goalProgress from state
    setStats({
      totalBooks: 0,
      averageRating: 0,
      readingByYear: {},
      readingByMonth: {},
      ratingDistribution: {},
      readingPace: { booksPerMonth: 0, booksPerYear: 0, pagesPerDay: 0 },
      pageStats: { totalPages: 0, averageLength: 0, longestBook: { title: '', pages: 0 } },
      topAuthors: [],
      readingByGenre: {}
    });
    setGoalProgress({
      yearly: { current: 0, target: 0, percentage: 0 },
      monthly: { current: 0, target: 0, percentage: 0 }
    });
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
    forceClearAndRecalculate // <--- new function added
  };

  return (
    <ReadingDataContext.Provider 
      value={contextValue}
    >
      {children}
    </ReadingDataContext.Provider>
  );
};