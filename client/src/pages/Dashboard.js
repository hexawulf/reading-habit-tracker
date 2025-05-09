// client/src/pages/Dashboard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useReadingData } from '../context/ReadingDataContext';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import './Dashboard.css';

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
      </div>
    );
  }
  
  // Initialize missing objects/properties to prevent errors
  stats.readingPace = stats.readingPace || {};
  stats.readingPace.booksPerMonth = stats.readingPace.booksPerMonth || 0;
  stats.readingPace.booksPerYear = stats.readingPace.booksPerYear || 0;
  stats.readingPace.pagesPerDay = stats.readingPace.pagesPerDay || 0;
  
  stats.pageStats = stats.pageStats || {};
  stats.pageStats.averageLength = stats.pageStats.averageLength || 0;
  stats.pageStats.longestBook = stats.pageStats.longestBook || { title: 'None', pages: 0 };
  
  stats.readingByGenre = stats.readingByGenre || {};
  stats.topAuthors = stats.topAuthors || [];
  
  // Prepare data for charts
  const currentYear = new Date().getFullYear().toString();
  const previousYear = (parseInt(currentYear) - 1).toString();
  
  // Yearly reading data
  const yearlyData = Object.entries(stats.readingByYear || {})
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year));
  
  // Monthly comparison data (current year vs previous year)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyComparisonData = monthNames.map((month, index) => {
    stats.readingByMonth = stats.readingByMonth || {};
    stats.readingByMonth[currentYear] = stats.readingByMonth[currentYear] || [];
    stats.readingByMonth[previousYear] = stats.readingByMonth[previousYear] || [];
    
    return {
      month,
      [currentYear]: stats.readingByMonth[currentYear][index] || 0,
      [previousYear]: stats.readingByMonth[previousYear][index] || 0
    };
  });
  
  // Rating distribution for pie chart
  const ratingData = Object.entries(stats.ratingDistribution || {})
    .map(([rating, count]) => ({ rating: parseInt(rating), count }))
    .filter(item => item.count > 0);
  
  const RATING_COLORS = ['#FF5252', '#FF7B25', '#FFC107', '#8BC34A', '#4CAF50'];
  
  if (!stats || !readingData) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  // Ensure we have arrays and objects
  const safeData = Array.isArray(readingData) ? readingData : [];
  const recentBooks = safeData.slice(0, 5);
  
  // Initialize missing stats objects to prevent errors
  stats.readingPace = stats.readingPace || {};
  stats.pageStats = stats.pageStats || {};
  stats.readingByGenre = stats.readingByGenre || {};
  stats.topAuthors = stats.topAuthors || [];
  
  return (
    <div className="dashboard">
      <h1>Reading Dashboard</h1>
      
      <div className="stats-overview">
        <div className="stat-card books-read">
          <h3>Total Books</h3>
          <div className="stat-value">{stats.totalBooks || 0}</div>
        </div>
        
        <div className="stat-card this-year">
          <h3>Read in {currentYear}</h3>
          <div className="stat-value">{(stats.readingByYear && stats.readingByYear[currentYear]) || 0}</div>
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
          <h3>Books per Month</h3>
          <div className="stat-value">
            {stats.readingPace.booksPerMonth.toFixed(1)}
          </div>
        </div>
      </div>
      
      <div className="goal-progress">
        <h2>Reading Goals Progress</h2>
        <div className="goal-cards">
          <div className="goal-card">
            <h3>Yearly Goal</h3>
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${Math.min(100, (goalProgress?.yearly?.percentage || 0))}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {goalProgress?.yearly?.current || 0} of {goalProgress?.yearly?.target || 0} books
                ({goalProgress?.yearly?.percentage || 0}%)
              </div>
            </div>
          </div>
          
          <div className="goal-card">
            <h3>Monthly Goal</h3>
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${Math.min(100, (goalProgress?.monthly?.percentage || 0))}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {goalProgress?.monthly?.current || 0} of {goalProgress?.monthly?.target || 0} books
                ({goalProgress?.monthly?.percentage || 0}%)
              </div>
            </div>
          </div>
        </div>
        <Link to="/goals" className="set-goals-link">Set Reading Goals</Link>
      </div>
      
      <div className="charts-container">
        <div className="chart-card yearly-chart">
          <h3>Books Read By Year</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4CAF50" name="Books Read" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-card monthly-chart">
          <h3>Monthly Comparison ({currentYear} vs {previousYear})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={previousYear} fill="#FF7B25" name={previousYear} />
              <Bar dataKey={currentYear} fill="#4CAF50" name={currentYear} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="charts-container">
        <div className="chart-card rating-chart">
          <h3>Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ratingData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                nameKey="rating"
                label={({rating, count}) => `${rating}★: ${count}`}
              >
                {ratingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RATING_COLORS[(entry.rating - 1) || 0]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} books`, `${name} stars`]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-card authors-list">
          <h3>Top Authors</h3>
          <ul className="top-authors">
            {stats.topAuthors.slice(0, 5).map((author, index) => (
              <li key={index} className="author-item">
                <span className="author-name">{author.author}</span>
                <span className="author-count">{author.count} books</span>
                <div className="author-bar">
                  <div 
                    className="author-bar-fill"
                    style={{ 
                      width: `${(author.count / (stats.topAuthors[0]?.count || 1)) * 100}%`,
                      backgroundColor: `hsl(${120 + index * 30}, 70%, 45%)`
                    }}
                  ></div>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/top-authors" className="see-more-link">See More Authors</Link>
        </div>
      </div>
      
      <div className="recent-books">
        <h2>Recently Read Books</h2>
        <div className="books-grid">
          {recentBooks.map((book, index) => (
            <div key={index} className="book-card">
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
          ))}
        </div>
        <Link to="/recent-books" className="see-more-link">See All Recent Books</Link>
      </div>
      
      <div className="reading-insights">
        <h2>Reading Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <h3>Pages Read</h3>
            <p>{(stats.totalPages || 0).toLocaleString()} total pages</p>
            <p>{stats.pageStats.averageLength} pages per book on average</p>
          </div>
          
          <div className="insight-card">
            <h3>Reading Pace</h3>
            <p>{stats.readingPace.booksPerYear.toFixed(1)} books per year</p>
            <p>{stats.readingPace.pagesPerDay.toFixed(1)} pages per day</p>
          </div>
          
          <div className="insight-card">
            <h3>Longest Book</h3>
            <p>{stats.pageStats.longestBook.title}</p>
            <p>{stats.pageStats.longestBook.pages.toLocaleString()} pages</p>
          </div>
          
          <div className="insight-card">
            <h3>Most Read Genre</h3>
            <p>{Object.entries(stats.readingByGenre).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;