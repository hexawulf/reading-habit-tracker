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

  useEffect(() => {
    const loadLocalData = () => {
      try {
        const localData = storageService.loadData();
        if (localData) {
          setReadingData(localData.readingData || []);
          setStats(localData.stats || stats);
          setGoalProgress(localData.goalProgress || goalProgress);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadLocalData();
  }, []);

  const processReadingData = (data) => {
    try {
      setLoading(true);
      const calculatedStats = calculateStats(data);
      const calculatedGoals = calculateGoalProgress(data);

      setReadingData(data);
      setStats(calculatedStats);
      setGoalProgress(calculatedGoals);

      storageService.saveData({
        readingData: data,
        stats: calculatedStats,
        goalProgress: calculatedGoals
      });
    } catch (err) {
      setError(err.message);
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

  const calculateStats = (books) => {
    if (!books || !books.length) return stats;

    const currentYear = new Date().getFullYear().toString();
    const currentMonth = new Date().getMonth();
    
    // Group books by year and month
    const readingByYear = {};
    const readingByMonth = {};
    
    books.forEach(book => {
      const year = new Date(book.dateRead).getFullYear().toString();
      const month = new Date(book.dateRead).getMonth();
      
      readingByYear[year] = (readingByYear[year] || 0) + 1;
      
      if (!readingByMonth[year]) readingByMonth[year] = Array(12).fill(0);
      readingByMonth[year][month]++;
    });

    return {
      totalBooks: books.length,
      averageRating: books.reduce((sum, book) => sum + (book.myRating || 0), 0) / books.length,
      readingByYear,
      readingByMonth,
      ratingDistribution: {},
      readingPace: {
        booksPerMonth: books.length / 12,
        booksPerYear: books.length,
        pagesPerDay: books.reduce((sum, book) => sum + (book.pages || 0), 0) / 365
      },
      pageStats: {
        totalPages: books.reduce((sum, book) => sum + (book.pages || 0), 0),
        averageLength: books.reduce((sum, book) => sum + (book.pages || 0), 0) / books.length,
        longestBook: books.reduce((longest, book) => 
          (book.pages > (longest?.pages || 0)) ? book : longest, 
          { title: '', pages: 0 }
        )
      },
      topAuthors: [],
      readingByGenre: {}
    };
  };

  const calculateGoalProgress = (books) => {
    if (!books || !books.length) {
      return {
        yearly: { current: 0, target: 52, percentage: 0 },
        monthly: { current: 0, target: 4, percentage: 0 }
      };
    }

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

  const contextValue = {
    readingData,
    stats,
    loading,
    error,
    goalProgress,
    processReadingData,
    updateGoals,
    clearAllData
  };

  return (
    <ReadingDataContext.Provider 
      value={contextValue}
    >
      {children}
    </ReadingDataContext.Provider>
  );
};