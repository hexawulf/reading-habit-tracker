// client/src/pages/Dashboard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useReadingData } from '../context/ReadingDataContext';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import './Dashboard.css';

// FIXED: Use actual hex values instead of CSS variables in JavaScript
const NIGHT_OWL_ACCENT_1 = "#7e57c2"; // Purple
const NIGHT_OWL_ACCENT_2 = "#82aaff"; // Blue

// FIXED: Function to get CSS variable values at runtime
const getCSSVariable = (variableName) => {
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
};

const Dashboard = () => {
  const { stats, readingData, loading, error, goalProgress } = useReadingData();
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <Link to="/upload" className="refresh-link">Try Again</Link>
      </div>
    );
  }
  
  if (!stats || !readingData) {
    return (
      <div className="no-data">
        <h2>No Reading Data Available</h2>
        <p>Please upload your Goodreads export file to get started.</p>
        {/* FIXED: Removed inline style */}
        <Link to="/upload" className="btn btn-primary">Upload File</Link>
      </div>
    );
  }
  
  // Initialize missing objects/properties to prevent errors
  stats.readingPace = stats.readingPace || { booksPerMonth: 0, booksPerYear: 0, pagesPerDay: 0 };
  stats.pageStats = stats.pageStats || { averageLength: 0, longestBook: { title: 'N/A', pages: 0 } };
  stats.readingByGenre = stats.readingByGenre || {};
  stats.topAuthors = stats.topAuthors || [];
  stats.readingByYear = stats.readingByYear || {};
  stats.readingByMonth = stats.readingByMonth || {};
  stats.ratingDistribution = stats.ratingDistribution || {};
  
  // Prepare data for charts
  const currentYear = new Date().getFullYear().toString();
  const previousYear = (parseInt(currentYear) - 1).toString();
  
  const yearlyData = Object.entries(stats.readingByYear)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year));
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyComparisonData = monthNames.map((month, index) => ({
    month,
    [currentYear]: stats.readingByMonth[currentYear]?.[index] || 0,
    [previousYear]: stats.readingByMonth[previousYear]?.[index] || 0
  }));
  
  const ratingData = Object.entries(stats.ratingDistribution)
    .map(([rating, count]) => ({ rating: parseInt(rating), count }))
    .filter(item => item.count > 0 && item.rating > 0);
  
  // Updated RATING_COLORS for Night Owl theme
  const RATING_COLORS = [
    '#ff5370', // 1 star (a bit more vibrant red)
    '#ff8c42', // 2 stars (orange)
    '#ffc700', // 3 stars (yellow)
    '#c3e88d', // 4 stars (light green)
    '#89ddff'  // 5 stars (light blue)
  ];

  const safeData = Array.isArray(readingData) ? readingData : [];
  // Display more recent books for a denser layout, e.g., 10
  const recentBooks = safeData.slice(0, 10); 
  
  const tickFormatter = (value) => {
    if (typeof value === 'number' && value > 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value;
  };

  // FIXED: Get current theme colors at runtime
  const currentCardBg = getCSSVariable('--current-card-background') || '#2d3748';
  const currentBorder = getCSSVariable('--current-border') || '#4a5568';
  const currentText = getCSSVariable('--current-text') || '#f7fafc';

  return (
    <div className="dashboard">
      <h1>Reading Dashboard</h1>
      
      {/* Grouping Key Statistics */}
      <div className="stats-group-container">
        <h2>Key Statistics</h2>
        <div className="stats-overview">
          <div className="stat-card books-read">
            <h3>Total Books</h3>
            <div className="stat-value">{stats.totalBooks || 0}</div>
          </div>
          <div className="stat-card this-year">
            <h3>Read in {currentYear}</h3>
            <div className="stat-value">{stats.readingByYear[currentYear] || 0}</div>
          </div>
          <div className="stat-card rating">
            <h3>Average Rating</h3>
            <div className="stat-value">{(stats.averageRating || 0).toFixed(1)}</div>
            <div className="rating-stars">
              {'★'.repeat(Math.round(stats.averageRating || 0))}
              {'☆'.repeat(5 - Math.round(stats.averageRating || 0))}
            </div>
          </div>
          <div className="stat-card reading-pace">
            <h3>Books/Month</h3>
            <div className="stat-value">
              {stats.readingPace.booksPerMonth.toFixed(1)}
            </div>
          </div>
           <div className="stat-card">
            <h3>Pages/Day</h3>
            <div className="stat-value">{stats.readingPace.pagesPerDay.toFixed(1)}</div>
          </div>
          <div className="stat-card">
            <h3>Avg. Length</h3>
            <div className="stat-value">{Math.round(stats.pageStats.averageLength)}</div>
          </div>
        </div>
      </div>
      
      {/* Charts remain in their own top-level sections */}
      <div className="chart-card yearly-chart">
        <h3>Books Read By Year</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={yearlyData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={currentBorder} />
            <XAxis dataKey="year" tick={{ fill: currentText, fontSize: 12 }} />
            <YAxis tick={{ fill: currentText, fontSize: 12 }} tickFormatter={tickFormatter}/>
            <Tooltip 
              contentStyle={{ backgroundColor: currentCardBg, border: `1px solid ${currentBorder}`, color: currentText, borderRadius: '6px' }} 
              itemStyle={{ color: currentText }}
              cursor={{ fill: 'rgba(130, 170, 255, 0.15)' }}/>
            <Bar dataKey="count" fill={NIGHT_OWL_ACCENT_1} name="Books Read" isAnimationActive={true} />
          </BarChart>
        </ResponsiveContainer>
      </div>
        
      <div className="chart-card monthly-chart">
        <h3>Monthly Comparison ({currentYear} vs {previousYear})</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyComparisonData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }} isAnimationActive={true}>
            <CartesianGrid strokeDasharray="3 3" stroke={currentBorder} />
            <XAxis dataKey="month" tick={{ fill: currentText, fontSize: 12 }} />
            <YAxis tick={{ fill: currentText, fontSize: 12 }} tickFormatter={tickFormatter}/>
            <Tooltip 
              contentStyle={{ backgroundColor: currentCardBg, border: `1px solid ${currentBorder}`, color: currentText, borderRadius: '6px' }} 
              itemStyle={{ color: currentText }}
              cursor={{ fill: 'rgba(130, 170, 255, 0.15)' }}/>
            <Legend wrapperStyle={{ color: currentText, fontSize: '12px' }} />
            <Bar dataKey={previousYear} fill={NIGHT_OWL_ACCENT_2} name={previousYear} isAnimationActive={true} />
            <Bar dataKey={currentYear} fill={NIGHT_OWL_ACCENT_1} name={currentYear} isAnimationActive={true} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Grouping Rating Distribution and Top Authors */}
      <div className="charts-container">
        <div className="chart-card rating-chart">
          <h3>Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={ratingData}
                cx="50%"
                cy="50%"
                labelLine={{ stroke: currentText }}
                outerRadius={80}
                dataKey="count"
                nameKey="rating"
                label={({rating, percent, count}) => `${rating}★: ${(percent * 100).toFixed(0)}% (${count})`}
                tick={{ fill: currentText }}
                isAnimationActive={true}
              >
                {ratingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RATING_COLORS[(entry.rating - 1) % RATING_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: currentCardBg, border: `1px solid ${currentBorder}`, color: currentText, borderRadius: '6px' }} 
                itemStyle={{ color: currentText }}
                formatter={(value, name) => [`${value} books`, `${name} stars`]}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-card authors-list-card">
          <h3>Top Authors</h3>
          <ul className="top-authors">
            {(stats.topAuthors || []).slice(0, 5).map((author, index) => (
              <li key={index} className="author-item">
                <span className="author-name">{author.author}</span>
                <span className="author-count">{author.count} books</span>
                <div className="author-bar">
                  <div 
                    className="author-bar-fill"
                    style={{ 
                      width: `${(author.count / (stats.topAuthors[0]?.count || 1)) * 100}%`,
                      backgroundColor: index % 2 === 0 ? NIGHT_OWL_ACCENT_1 : NIGHT_OWL_ACCENT_2
                    }}
                  ></div>
                </div>
              </li>
            ))}
          </ul>
          {stats.topAuthors.length > 5 && 
            <Link to="/top-authors" className="see-more-link">See More Authors</Link>}
        </div>
      </div>
      
      <div className="recent-books">
        <h2>Recently Read Books</h2>
        <div className="books-grid">
          {recentBooks.map((book, index) => (
            <div key={index} className="book-card">
              <h3 className="book-title" title={book.title}>{book.title}</h3>
              <p className="book-author">by {book.author}</p>
              <div className="book-rating">
                {'★'.repeat(book.myRating || 0)}
                {'☆'.repeat(5 - (book.myRating || 0))}
              </div>
              <p className="book-date">
                Read: {book.dateRead ? new Date(book.dateRead).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          ))}
        </div>
        {safeData.length > 10 && 
          <Link to="/recent-books" className="see-more-link">See All Recent Books</Link>}
      </div>
      
      <div className="reading-insights">
        <h2>Reading Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <h3>Total Pages</h3>
            <p>{(stats.totalPages || 0).toLocaleString()}</p>
          </div>
          <div className="insight-card">
            <h3>Avg. Pages/Book</h3>
            <p>{stats.pageStats.averageLength.toFixed(0)}</p>
          </div>
          <div className="insight-card">
            <h3>Books/Year</h3>
            <p>{stats.readingPace.booksPerYear.toFixed(1)}</p>
          </div>
          <div className="insight-card">
            <h3>Longest Book</h3>
            <p title={stats.pageStats.longestBook.title}>
              {stats.pageStats.longestBook.title.length > 25 
                ? stats.pageStats.longestBook.title.substring(0,22) + '...' 
                : stats.pageStats.longestBook.title}
            </p>
            <p>{(stats.pageStats.longestBook.pages || 0).toLocaleString()} pages</p>
          </div>
          <div className="insight-card">
            <h3>Most Read Genre</h3>
            <p>{Object.entries(stats.readingByGenre).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"}</p>
          </div>
           <div className="insight-card">
            <h3>Favorite Author</h3>
            <p>{stats.topAuthors[0]?.author || "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
