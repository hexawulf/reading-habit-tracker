// client/src/pages/Dashboard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useReadingData } from '../context/ReadingDataContext';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import './Dashboard.css';

// Night Owl theme colors for charts (examples)
const NIGHT_OWL_ACCENT_1 = "var(--night-owl-accent1)"; // #7e57c2
const NIGHT_OWL_ACCENT_2 = "var(--night-owl-accent2)"; // #82aaff
const NIGHT_OWL_TEXT = "var(--night-owl-text)";       // #d6deeb
const NIGHT_OWL_BORDER = "var(--night-owl-border)";   // #011220

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
        <Link to="/upload" className="btn btn-primary" style={{marginTop: '1rem'}}>Upload File</Link>
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

  // Tooltip and Legend text color will be handled by CSS (.recharts-text, etc.)
  // For CartesianGrid, stroke is set via CSS.

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
      
      <div className="goal-progress"> {/* This is already a card-like container */}
        <h2>Reading Goals Progress</h2>
        <div className="goal-cards">
          <div className="goal-card">
            <h3>Yearly Goal</h3>
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${Math.min(100, (goalProgress?.yearly?.percentage || 0))}%`, backgroundColor: NIGHT_OWL_ACCENT_1 }}
                ></div>
              </div>
              <div className="progress-text">
                {goalProgress?.yearly?.current || 0} of {goalProgress?.yearly?.target || 'N/A'} books
                ({(goalProgress?.yearly?.percentage || 0).toFixed(1)}%)
              </div>
            </div>
          </div>
          
          <div className="goal-card">
            <h3>Monthly Goal</h3>
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${Math.min(100, (goalProgress?.monthly?.percentage || 0))}%`, backgroundColor: NIGHT_OWL_ACCENT_1 }}
                ></div>
              </div>
              <div className="progress-text">
                {goalProgress?.monthly?.current || 0} of {goalProgress?.monthly?.target || 'N/A'} books
                ({(goalProgress?.monthly?.percentage || 0).toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>
        <Link to="/goals" className="set-goals-link">Manage Goals</Link>
      </div>
      
      {/* Charts remain in their own top-level sections */}
      <div className="chart-card yearly-chart"> {/* chart-card provides the background and padding */}
        <h3>Books Read By Year</h3>
        <ResponsiveContainer width="100%" height={250}> {/* Reduced height for compactness */}
          <BarChart data={yearlyData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={NIGHT_OWL_BORDER} />
            <XAxis dataKey="year" tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} />
            <YAxis tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} tickFormatter={tickFormatter}/>
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--night-owl-card-background)', border: `1px solid ${NIGHT_OWL_BORDER}`, color: NIGHT_OWL_TEXT, borderRadius: 'var(--border-radius, 6px)' }} 
              itemStyle={{ color: NIGHT_OWL_TEXT }}
              cursor={{ fill: 'rgba(var(--night-owl-accent2-rgb, 130, 170, 255), 0.15)' }}/> {/* Using RGB for opacity */}
            <Bar dataKey="count" fill={NIGHT_OWL_ACCENT_1} name="Books Read" isAnimationActive={true} />
          </BarChart>
        </ResponsiveContainer>
      </div>
        
      <div className="chart-card monthly-chart">
        <h3>Monthly Comparison ({currentYear} vs {previousYear})</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyComparisonData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }} isAnimationActive={true}>
            <CartesianGrid strokeDasharray="3 3" stroke={NIGHT_OWL_BORDER} />
            <XAxis dataKey="month" tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} />
            <YAxis tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} tickFormatter={tickFormatter}/>
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--night-owl-card-background)', border: `1px solid ${NIGHT_OWL_BORDER}`, borderRadius: 'var(--border-radius, 6px)' }} 
              itemStyle={{ color: NIGHT_OWL_TEXT }}
              cursor={{ fill: 'rgba(var(--night-owl-accent2-rgb, 130, 170, 255), 0.15)' }}/>
            <Legend wrapperStyle={{ color: NIGHT_OWL_TEXT, fontSize: '12px' }} />
            <Bar dataKey={previousYear} fill={NIGHT_OWL_ACCENT_2} name={previousYear} isAnimationActive={true} />
            <Bar dataKey={currentYear} fill={NIGHT_OWL_ACCENT_1} name={currentYear} isAnimationActive={true} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Grouping Rating Distribution and Top Authors */}
      <div className="charts-container"> {/* This div can act as a row for these two charts */}
        <div className="chart-card rating-chart">
          <h3>Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={ratingData}
                cx="50%"
                cy="50%"
                labelLine={{ stroke: NIGHT_OWL_TEXT }}
                outerRadius={80} /* Adjusted for compactness */
                dataKey="count"
                nameKey="rating"
                label={({rating, percent, count}) => `${rating}★: ${(percent * 100).toFixed(0)}% (${count})`}
                tick={{ fill: NIGHT_OWL_TEXT }}
                isAnimationActive={true} // Enable animation for Pie chart
              >
                {ratingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RATING_COLORS[(entry.rating - 1) % RATING_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--night-owl-card-background)', border: `1px solid ${NIGHT_OWL_BORDER}`, borderRadius: 'var(--border-radius, 6px)' }} 
                itemStyle={{ color: NIGHT_OWL_TEXT }}
                formatter={(value, name) => [`${value} books`, `${name} stars`]}/>
              {/* <Legend wrapperStyle={{ color: NIGHT_OWL_TEXT, fontSize: '12px', bottom: '-10px' }} /> */}
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-card authors-list-card"> {/* Changed class to authors-list-card to use generic card styles */}
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
                      // Cycle through accent colors or use a Night Owl friendly palette
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
      
      <div className="recent-books"> {/* This is already a card-like container */}
        <h2>Recently Read Books</h2>
        <div className="books-grid">
          {recentBooks.map((book, index) => (
            <div key={index} className="book-card"> {/* book-card provides styling */}
              <h3 className="book-title" title={book.title}>{book.title}</h3>
              <p className="book-author">by {book.author}</p>
              <div className="book-rating">
                {'★'.repeat(book.myRating || 0)}
                {'☆'.repeat(5 - (book.myRating || 0))}
              </div>
              <p className="book-date">
                Read: {book.dateRead ? new Date(book.dateRead).toLocaleDateString() : 'N/A'}
              </p>
              {/* <p className="book-pages">{book.pages || 0} pages</p> */}
            </div>
          ))}
        </div>
        {safeData.length > 10 && 
          <Link to="/recent-books" className="see-more-link">See All Recent Books</Link>}
      </div>
      
      <div className="reading-insights"> {/* This is already a card-like container */}
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