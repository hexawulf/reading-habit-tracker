import React, { createContext, useContext, useState, useEffect } from 'react';
import storageService from '../services/storageService';
import { generateStats as sharedGenerateStats, calculateGoalProgress as sharedGoalProgress } from '../lib/stats';

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

// Pure functions — thin wrappers over the shared stats module (RH-09) so the
// client and server compute the same numbers. Defined at module scope so their
// references are stable for useEffect deps.

function calculateStats(books) {
  if (!books || books.length === 0) {
    return { ...EMPTY_STATS };
  }
  return { ...EMPTY_STATS, ...sharedGenerateStats(books) };
}

function calculateGoalProgress(books, goals) {
  if (!books || !books.length) {
    return {
      yearly: { current: 0, target: (goals && goals.yearly) || 52, percentage: 0 },
      monthly: { current: 0, target: (goals && goals.monthly) || 4, percentage: 0 },
    };
  }
  return sharedGoalProgress(books, goals);
}

export const ReadingDataProvider = ({ children }) => {
  const [readingData, setReadingData] = useState([]);
  const [stats, setStats] = useState({ ...EMPTY_STATS });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [goals, setGoals] = useState({ yearly: 52, monthly: 4 });
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

        const savedGoals = saved?.goals && saved.goals.yearly
          ? { yearly: saved.goals.yearly, monthly: saved.goals.monthly }
          : { yearly: 52, monthly: 4 };
        setGoals(savedGoals);

        if (books.length > 0) {
          const freshStats = calculateStats(books);
          const freshGoalProgress = calculateGoalProgress(books, savedGoals);

          setReadingData(books);
          setStats(freshStats);
          setGoalProgress(freshGoalProgress);
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
      const calculatedGoalProgress = calculateGoalProgress(booksToProcess, goals);

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
    const newGoals = { yearly: yearlyGoal, monthly: monthlyGoal };
    setGoals(newGoals);

    const newGoalProgress = calculateGoalProgress(readingData, newGoals);
    setGoalProgress(newGoalProgress);

    // Persist the goals so they survive a reload (RH-09).
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
      const freshGoalProgress = calculateGoalProgress(readingData, goals);
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
    goals,
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
