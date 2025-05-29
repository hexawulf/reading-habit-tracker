// client/src/pages/MonthlyProgress.js
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { useReadingData } from '../context/ReadingDataContext';
import './MonthlyProgress.css';

// Night Owl theme colors
const NIGHT_OWL_ACCENT_1 = "var(--night-owl-accent1)";
const NIGHT_OWL_ACCENT_2 = "var(--night-owl-accent2)";
const NIGHT_OWL_TEXT = "var(--night-owl-text)";
const NIGHT_OWL_BORDER = "var(--night-owl-border)";

const MonthlyProgress = () => {
  const { stats, readingData, loading, error, goalProgress } = useReadingData();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading monthly progress data...</p>
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
  
  stats.readingByMonth = stats.readingByMonth || {};
  
  const availableYears = Object.keys(stats.readingByYear || {}).sort((a, b) => parseInt(b) - parseInt(a));
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthlyData = monthNames.map((month, index) => ({
    name: month,
    shortName: monthShortNames[index],
    books: stats.readingByMonth[selectedYear]?.[index] || 0
  }));

  const totalBooksInYear = monthlyData.reduce((sum, month) => sum + month.books, 0);
  const averageBooksPerMonth = totalBooksInYear > 0 ? totalBooksInYear / monthNames.filter((_,i) => stats.readingByMonth[selectedYear]?.[i] !== undefined).length : 0;


  const currentActualMonth = currentDate.getMonth();
  const currentMonthBooks = stats.readingByMonth[currentDate.getFullYear().toString()]?.[currentActualMonth] || 0;

  const monthlyGoalTarget = goalProgress?.monthly?.target || 0;
  
  const booksInSelectedYear = readingData.filter(book => {
    if (!book.dateRead) return false;
    const bookYear = new Date(book.dateRead).getFullYear().toString();
    return bookYear === selectedYear;
  });

  booksInSelectedYear.sort((a, b) => new Date(b.dateRead) - new Date(a.dateRead));

  const monthlyPages = Array(12).fill(0);
  booksInSelectedYear.forEach(book => {
    if (book.dateRead && book.pages) {
      const month = new Date(book.dateRead).getMonth();
      monthlyPages[month] += parseInt(book.pages, 10) || 0;
    }
  });

  const combinedMonthlyData = monthlyData.map((month, index) => ({
    ...month,
    pages: monthlyPages[index]
  }));

  const monthlyTrend = monthlyData.map((month, index) => {
    if (index === 0) return { ...month, trend: 0 };
    const prevMonthBooks = monthlyData[index - 1].books;
    const currentBooks = month.books; // Renamed to avoid conflict
    const trendValue = prevMonthBooks === 0 ? (currentBooks > 0 ? 100 : 0) : ((currentBooks - prevMonthBooks) / prevMonthBooks) * 100;
    return { ...month, trend: trendValue };
  });
  
  const tickFormatter = (value) => typeof value === 'number' && value > 1000 ? `${(value/1000).toFixed(0)}k` : value;

  // Calculate current month's progress for the selected year, if applicable
  let currentMonthGoalProgress = { current: 0, target: monthlyGoalTarget, percentage: 0 };
  if (selectedYear === currentDate.getFullYear().toString()) {
    const booksThisMonthSelectedYear = stats.readingByMonth[selectedYear]?.[currentActualMonth] || 0;
    currentMonthGoalProgress = {
        current: booksThisMonthSelectedYear,
        target: monthlyGoalTarget,
        percentage: monthlyGoalTarget > 0 ? Math.min(100, (booksThisMonthSelectedYear / monthlyGoalTarget) * 100) : 0
    };
  }


return (
  <div className="monthly-progress-page">
    <h1>Monthly Reading Progress - {selectedYear}</h1>
    
    <div className="year-selector">
      <label htmlFor="year-select">Select Year:</label>
      <select 
        id="year-select" 
        value={selectedYear} 
        onChange={(e) => setSelectedYear(e.target.value)}
      >
        {availableYears.length > 0 ? availableYears.map(year => (
          <option key={year} value={year}>{year}</option>
        )) : <option value={selectedYear}>{selectedYear}</option>}
      </select>
    </div>
    
    <div className="stats-overview"> {/* These should use .stat-card from App.css */}
      <div className="stat-card">
        <h3>Total Books ({selectedYear})</h3>
        <div className="stat-value">{totalBooksInYear}</div>
      </div>
      <div className="stat-card">
        <h3>Monthly Avg ({selectedYear})</h3>
        <div className="stat-value">{averageBooksPerMonth.toFixed(1)}</div>
      </div>
      {selectedYear === currentDate.getFullYear().toString() && (
        <div className="stat-card">
          <h3>Books This Month</h3>
          <div className="stat-value">{currentMonthBooks}</div>
        </div>
      )}
      {monthlyGoalTarget > 0 && selectedYear === currentDate.getFullYear().toString() && (
        <div className="stat-card">
          <h3>Current Month Goal</h3>
          <div className="stat-value">{currentMonthGoalProgress.current} / {currentMonthGoalProgress.target}</div>
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${currentMonthGoalProgress.percentage.toFixed(1)}%`, backgroundColor: NIGHT_OWL_ACCENT_1 }}
              ></div>
            </div>
            <div className="progress-text">
               {currentMonthGoalProgress.percentage.toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
    
    <div className="charts-container">
      <div className="chart-card"> {/* Use .chart-card from global styles */}
        <h3>Books Read by Month ({selectedYear})</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={NIGHT_OWL_BORDER} />
            <XAxis dataKey="shortName" tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} />
            <YAxis tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} tickFormatter={tickFormatter} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--night-owl-card-background)', border: `1px solid ${NIGHT_OWL_BORDER}`, borderRadius: 'var(--border-radius, 6px)' }}
              itemStyle={{ color: NIGHT_OWL_TEXT }}
              cursor={{ fill: 'rgba(var(--night-owl-accent2-rgb), 0.15)' }}
              formatter={(value) => [`${value} books`, 'Books Read']} 
            />
            <Bar dataKey="books" fill={NIGHT_OWL_ACCENT_1} name="Books Read" isAnimationActive={true} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="chart-card"> {/* Use .chart-card from global styles */}
        <h3>Pages Read by Month ({selectedYear})</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={combinedMonthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={NIGHT_OWL_BORDER} />
            <XAxis dataKey="shortName" tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} />
            <YAxis tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} tickFormatter={tickFormatter} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--night-owl-card-background)', border: `1px solid ${NIGHT_OWL_BORDER}`, borderRadius: 'var(--border-radius, 6px)' }}
              itemStyle={{ color: NIGHT_OWL_TEXT }}
              cursor={{ fill: 'rgba(var(--night-owl-accent2-rgb), 0.15)' }}
              formatter={(value) => [`${value} pages`, 'Pages Read']} 
            />
            <Bar dataKey="pages" fill={NIGHT_OWL_ACCENT_2} name="Pages Read" isAnimationActive={true} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
    
    <div className="monthly-calendar chart-card"> {/* Added chart-card for consistency */}
      <h2>Monthly Reading Calendar ({selectedYear})</h2>
      <div className="calendar-grid">
        {monthlyData.map((month, index) => (
          <div 
            key={index} 
            className={`calendar-month ${month.books > 0 ? 'has-books' : ''}`}
          >
            <div className="month-name">{month.shortName}</div> {/* Changed to shortName for space */}
            <div className="month-book-count">{month.books}</div>
            <div 
              className="month-intensity" 
              style={{ 
                opacity: Math.min(1, month.books / (Math.max(...monthlyData.map(m => m.books)) || 1)) 
              }}
            ></div>
          </div>
        ))}
      </div>
    </div>
    
    <div className="monthly-trend chart-card"> {/* Added chart-card for consistency */}
      <h2>Monthly Reading Trend ({selectedYear})</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={monthlyTrend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}> {/* Adjusted margin for LineChart */}
          <CartesianGrid strokeDasharray="3 3" stroke={NIGHT_OWL_BORDER}/>
          <XAxis dataKey="shortName" tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} />
          <YAxis yAxisId="left" tickFormatter={(value) => `${value.toFixed(0)}%`} tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={tickFormatter} tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--night-owl-card-background)', border: `1px solid ${NIGHT_OWL_BORDER}`, borderRadius: 'var(--border-radius, 6px)' }}
            itemStyle={{ color: NIGHT_OWL_TEXT }}
            cursor={{ fill: 'rgba(var(--night-owl-accent2-rgb), 0.15)' }}
          />
          <Legend wrapperStyle={{ color: NIGHT_OWL_TEXT, fontSize: '12px' }} />
          <Line yAxisId="left" type="monotone" dataKey="trend" stroke={NIGHT_OWL_ACCENT_1} name="Trend vs Prev. Month" isAnimationActive={true} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line yAxisId="right" type="monotone" dataKey="books" stroke={NIGHT_OWL_ACCENT_2} name="Books Read" isAnimationActive={true} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
    
    <div className="monthly-books chart-card"> {/* Added chart-card for consistency */}
      <h2>Books Read in {selectedYear}</h2>
      <div className="books-list">
        {booksInSelectedYear.map((book, index) => (
          <div key={index} className="monthly-book-item">
            <div className="book-month-tag">
              {monthNames[new Date(book.dateRead).getMonth()]}
            </div>
            <div className="book-details">
              <h3 className="book-title">{book.title}</h3>
              <p className="book-author">by {book.author}</p>
              <div className="book-rating">
                {'★'.repeat(book.myRating || 0)}
                {'☆'.repeat(5 - (book.myRating || 0))}
              </div>
              <p className="book-date">
                Read on: {new Date(book.dateRead).toLocaleDateString()}
              </p>
              <p className="book-pages">{book.pages || 0} pages</p>
            </div>
          </div>
        ))}
        
        {booksInSelectedYear.length === 0 && (
          <p className="no-books-message">No books read in {selectedYear}.</p>
        )}
      </div>
    </div>
  </div>
);
};

export default MonthlyProgress;