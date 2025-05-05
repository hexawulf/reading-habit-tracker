// client/src/pages/YearlyProgress.js
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line, 
  PieChart, Pie, Cell
} from 'recharts';
import { useReadingData } from '../context/ReadingDataContext';
import './YearlyProgress.css';

const YearlyProgress = () => {
  const { stats, readingData, loading, error, goalProgress } = useReadingData();
  const currentYear = new Date().getFullYear().toString();
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading yearly progress data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Data</h2>
        <p>{error}</p>
      </div>
    );
  }
  
  if (!stats || !readingData) {
    return (
      <div className="no-data">
        <h2>No Reading Data Available</h2>
        <p>Please upload your reading data to get started.</p>
      </div>
    );
  }
  
  // Initialize missing stats properties
  stats.readingByYear = stats.readingByYear || {};
  
  // Prepare yearly reading data
  const yearlyData = Object.entries(stats.readingByYear)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  
  // Calculate year-over-year growth
  const yearlyGrowth = yearlyData.map((item, index) => {
    if (index === 0) return { ...item, growth: 0 };
    const prevYearCount = yearlyData[index - 1].count;
    const growth = prevYearCount === 0 ? 0 : ((item.count - prevYearCount) / prevYearCount) * 100;
    return { ...item, growth };
  });
  
  // Create data for yearly goal comparison
  const yearlyGoalData = [];
  const goals = []; // This would be populated from a goals history database
  
  // For now, we'll just use the current year's goal
  if (goalProgress && goalProgress.yearly) {
    yearlyGoalData.push({
      year: currentYear,
      actual: stats.readingByYear[currentYear] || 0,
      goal: goalProgress.yearly.target
    });
  }
  
  // Calculate average books per year
  const totalYears = yearlyData.length;
  const totalBooks = yearlyData.reduce((sum, item) => sum + item.count, 0);
  const averageBooksPerYear = totalYears > 0 ? totalBooks / totalYears : 0;
  
  // Find best and worst reading years
  const bestYear = yearlyData.length > 0 
    ? yearlyData.reduce((max, item) => item.count > max.count ? item : max, yearlyData[0])
    : { year: 'N/A', count: 0 };
    
  const worstYear = yearlyData.length > 0 
    ? yearlyData.reduce((min, item) => item.count < min.count ? item : min, yearlyData[0])
    : { year: 'N/A', count: 0 };
  
  // Calculate yearly pages data
  const yearlyPagesData = [];
  const booksByYear = {};
  
  // Group books by year
  readingData.forEach(book => {
    if (book.dateRead) {
      const year = new Date(book.dateRead).getFullYear().toString();
      if (!booksByYear[year]) booksByYear[year] = [];
      booksByYear[year].push(book);
    }
  });
  
  // Calculate pages per year
  Object.entries(booksByYear).forEach(([year, books]) => {
    const totalPages = books.reduce((sum, book) => sum + (book.pages || 0), 0);
    yearlyPagesData.push({ year, pages: totalPages });
  });
  
  // Sort by year
  yearlyPagesData.sort((a, b) => parseInt(a.year) - parseInt(b.year));
  
  // Calculate current year's progress
  const currentYearProgress = goalProgress?.yearly || { current: 0, target: 0, percentage: 0 };
  
  // Calculate completion rate by year (percentage of yearly goal achieved)
  const yearlyCompletionRate = [];
  
  // This would be populated from a goals history database
  // For now, we'll just use the current year's data
  if (goalProgress && goalProgress.yearly) {
    yearlyCompletionRate.push({
      year: currentYear,
      rate: currentYearProgress.percentage
    });
  }
  
  return (
    <div className="yearly-progress-page">
      <h1>Yearly Reading Progress</h1>
      
      <div className="stats-overview">
        <div className="stat-card">
          <h3>Books This Year</h3>
          <div className="stat-value">{stats.readingByYear[currentYear] || 0}</div>
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${Math.min(100, currentYearProgress.percentage)}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {currentYearProgress.current} of {currentYearProgress.target} ({currentYearProgress.percentage}%)
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Average Per Year</h3>
          <div className="stat-value">{averageBooksPerYear.toFixed(1)}</div>
        </div>
        
        <div className="stat-card">
          <h3>Best Year</h3>
          <div className="stat-value">{bestYear.count}</div>
          <div className="stat-subtitle">{bestYear.year}</div>
        </div>
        
        <div className="stat-card">
          <h3>Worst Year</h3>
          <div className="stat-value">{worstYear.count}</div>
          <div className="stat-subtitle">{worstYear.year}</div>
        </div>
      </div>
      
      <div className="charts-container">
        <div className="chart-card">
          <h3>Books Read By Year</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} books`, 'Books Read']} />
              <Bar dataKey="count" fill="#4CAF50" name="Books Read" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-card">
          <h3>Pages Read By Year</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearlyPagesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toLocaleString()} pages`, 'Pages Read']} />
              <Bar dataKey="pages" fill="#3F51B5" name="Pages Read" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="charts-container">
        <div className="chart-card">
          <h3>Year-over-Year Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yearlyGrowth.slice(1)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Growth Rate']} />
              <Line type="monotone" dataKey="growth" stroke="#9C27B0" name="Growth Rate" />
              <Line type="monotone" dataKey="count" stroke="#4CAF50" name="Books Read" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-card">
          <h3>Goal vs. Actual</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearlyGoalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="goal" fill="#FF9800" name="Yearly Goal" />
              <Bar dataKey="actual" fill="#4CAF50" name="Books Read" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="yearly-breakdown">
        <h2>Yearly Reading Breakdown</h2>
        <div className="years-grid">
          {yearlyData.map((yearData, index) => {
            const yearBooks = booksByYear[yearData.year] || [];
            const yearPages = yearBooks.reduce((sum, book) => sum + (book.pages || 0), 0);
            const averageRating = yearBooks.length > 0
              ? yearBooks.reduce((sum, book) => sum + (book.myRating || 0), 0) / yearBooks.length
              : 0;
              
            // Get top genre for the year
            const genreCounts = {};
            yearBooks.forEach(book => {
              if (book.genre) {
                genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
              }
            });
            
            const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
            
            return (
              <div key={index} className="year-card">
                <div className="year-header">
                  <h3>{yearData.year}</h3>
                  <div className="year-book-count">{yearData.count} books</div>
                </div>
                <div className="year-stats">
                  <div className="year-stat">
                    <span className="stat-label">Pages:</span>
                    <span className="stat-value">{yearPages.toLocaleString()}</span>
                  </div>
                  <div className="year-stat">
                    <span className="stat-label">Avg Rating:</span>
                    <span className="stat-value">
                      {averageRating.toFixed(1)}
                      <span className="rating-stars">
                        {'★'.repeat(Math.round(averageRating))}
                        {'☆'.repeat(5 - Math.round(averageRating))}
                      </span>
                    </span>
                  </div>
                  <div className="year-stat">
                    <span className="stat-label">Top Genre:</span>
                    <span className="stat-value">{topGenre}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="yearly-goal-history">
        <h2>Goal Achievement History</h2>
        <div className="goal-history-container">
          {yearlyCompletionRate.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearlyCompletionRate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Completion Rate']} />
                <Bar dataKey="rate" fill="#FF9800" name="Goal Completion Rate">
                  {yearlyCompletionRate.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.rate >= 100 ? '#4CAF50' : entry.rate >= 75 ? '#8BC34A' : entry.rate >= 50 ? '#FFC107' : entry.rate >= 25 ? '#FF9800' : '#F44336'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-goal-history">
              <p>No yearly goal history available yet.</p>
              <p>Set reading goals to track your progress over time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YearlyProgress;