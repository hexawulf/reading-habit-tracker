// client/src/pages/MonthlyProgress.js
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { useReadingData } from '../context/ReadingDataContext';
import './MonthlyProgress.css';

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
  
  // Initialize missing stats properties
  stats.readingByMonth = stats.readingByMonth || {};
  
 // Get all available years from the data
const availableYears = Object.keys(stats.readingByYear || {}).sort((a, b) => parseInt(b) - parseInt(a));
  
// Prepare monthly data for the selected year
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Initialize monthly data with zero values
const monthlyData = monthNames.map((month, index) => {
  return {
    name: month,
    shortName: monthShortNames[index],
    books: stats.readingByMonth[selectedYear]?.[index] || 0
  };
});

// Calculate the total books read in the selected year
const totalBooksInYear = monthlyData.reduce((sum, month) => sum + month.books, 0);

// Calculate average books per month in the selected year
const averageBooksPerMonth = totalBooksInYear / 12;

// Get books read in the current month
const currentMonth = currentDate.getMonth();
const currentMonthBooks = stats.readingByMonth[currentDate.getFullYear().toString()]?.[currentMonth] || 0;

// Get monthly goal data
const monthlyGoalTarget = goalProgress?.monthly?.target || 0;
const monthlyGoalCurrent = goalProgress?.monthly?.current || 0;
const monthlyGoalPercentage = goalProgress?.monthly?.percentage || 0;

// Filter books for the selected year
const booksInSelectedYear = readingData.filter(book => {
  if (!book.dateRead) return false;
  const bookYear = new Date(book.dateRead).getFullYear().toString();
  return bookYear === selectedYear;
});

// Sort books by date read (most recent first)
booksInSelectedYear.sort((a, b) => new Date(b.dateRead) - new Date(a.dateRead));

// Calculate monthly pages
const monthlyPages = Array(12).fill(0);
booksInSelectedYear.forEach(book => {
  if (book.dateRead && book.pages) {
    const month = new Date(book.dateRead).getMonth();
    monthlyPages[month] += book.pages;
  }
});

// Combine books and pages data
const combinedMonthlyData = monthlyData.map((month, index) => ({
  ...month,
  pages: monthlyPages[index]
}));

// Calculate monthly trend (comparison with previous month)
const monthlyTrend = monthlyData.map((month, index) => {
  if (index === 0) return { ...month, trend: 0 };
  const prevMonthBooks = monthlyData[index - 1].books;
  const currentMonthBooks = month.books;
  const trend = prevMonthBooks === 0 ? 0 : ((currentMonthBooks - prevMonthBooks) / prevMonthBooks) * 100;
  return { ...month, trend };
});

return (
  <div className="monthly-progress-page">
    <h1>Monthly Reading Progress</h1>
    
    <div className="year-selector">
      <label htmlFor="year-select">Select Year:</label>
      <select 
        id="year-select" 
        value={selectedYear} 
        onChange={(e) => setSelectedYear(e.target.value)}
      >
        {availableYears.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
    
    <div className="stats-overview">
      <div className="stat-card">
        <h3>Total Books in {selectedYear}</h3>
        <div className="stat-value">{totalBooksInYear}</div>
      </div>
      
      <div className="stat-card">
        <h3>Monthly Average</h3>
        <div className="stat-value">{averageBooksPerMonth.toFixed(1)}</div>
      </div>
      
      <div className="stat-card">
        <h3>Current Month</h3>
        <div className="stat-value">{currentMonthBooks}</div>
      </div>
      
      <div className="stat-card">
        <h3>Monthly Goal</h3>
        <div className="stat-value">{monthlyGoalTarget}</div>
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${Math.min(100, monthlyGoalPercentage)}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {monthlyGoalCurrent} of {monthlyGoalTarget} ({monthlyGoalPercentage}%)
          </div>
        </div>
      </div>
    </div>
    
    <div className="charts-container">
      <div className="chart-card">
        <h3>Books Read by Month in {selectedYear}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="shortName" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} books`, 'Books Read']} />
            <Bar dataKey="books" fill="#4CAF50" name="Books Read" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="chart-card">
        <h3>Pages Read by Month in {selectedYear}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={combinedMonthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="shortName" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} pages`, 'Pages Read']} />
            <Bar dataKey="pages" fill="#3F51B5" name="Pages Read" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
    
    <div className="monthly-calendar">
      <h2>Monthly Reading Calendar ({selectedYear})</h2>
      <div className="calendar-grid">
        {monthlyData.map((month, index) => (
          <div 
            key={index} 
            className={`calendar-month ${month.books > 0 ? 'has-books' : ''}`}
          >
            <div className="month-name">{month.name}</div>
            <div className="month-book-count">{month.books} books</div>
            <div 
              className="month-intensity" 
              style={{ 
                opacity: Math.min(1, month.books / Math.max(...monthlyData.map(m => m.books || 1))) 
              }}
            ></div>
          </div>
        ))}
      </div>
    </div>
    
    <div className="monthly-trend">
      <h2>Monthly Reading Trend</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={monthlyTrend.slice(1)}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="shortName" />
          <YAxis />
          <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Change from previous month']} />
          <Line type="monotone" dataKey="trend" stroke="#9C27B0" name="Monthly Trend" />
          <Line type="monotone" dataKey="books" stroke="#4CAF50" name="Books Read" />
        </LineChart>
      </ResponsiveContainer>
    </div>
    
    <div className="monthly-books">
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