// client/src/pages/ReadingStats.js
import React, { useState, useEffect } from 'react';
import { useReadingData } from '../context/ReadingDataContext';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import './ReadingStats.css';

const ReadingStats = () => {
  const { readingData, stats, loading, error } = useReadingData();
  const [publisherStats, setPublisherStats] = useState([]);
  const [bindingStats, setBindingStats] = useState([]);
  const [pageDistribution, setPageDistribution] = useState([]);
  const [yearPublishedStats, setYearPublishedStats] = useState([]);
  const [readingVelocity, setReadingVelocity] = useState([]);
  
  useEffect(() => {
    if (readingData && readingData.length > 0) {
      calculatePublisherStats();
      calculateBindingStats();
      calculatePageDistribution();
      calculateYearPublishedStats();
      calculateReadingVelocity();
    }
  }, [readingData]);
  
  const calculatePublisherStats = () => {
    const publishers = {};
    
    readingData.forEach(book => {
      if (!book.publisher) return;
      
      const publisher = book.publisher.trim();
      if (publisher === '') return;
      
      publishers[publisher] = (publishers[publisher] || 0) + 1;
    });
    
    const publisherArray = Object.entries(publishers)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
    
    setPublisherStats(publisherArray);
  };
  
  const calculateBindingStats = () => {
    const bindings = {};
    
    readingData.forEach(book => {
      if (!book.binding) return;
      
      const binding = book.binding.trim();
      if (binding === '') return;
      
      bindings[binding] = (bindings[binding] || 0) + 1;
    });
    
    const bindingArray = Object.entries(bindings)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    setBindingStats(bindingArray);
  };
  
  const calculatePageDistribution = () => {
    const buckets = {
      'Under 100': 0,
      '100-200': 0,
      '201-300': 0,
      '301-400': 0,
      '401-500': 0,
      '501-750': 0,
      '751-1000': 0,
      'Over 1000': 0
    };
    
    readingData.forEach(book => {
      const pages = book.pages;
      if (!pages) return;
      
      if (pages < 100) buckets['Under 100']++;
      else if (pages <= 200) buckets['100-200']++;
      else if (pages <= 300) buckets['201-300']++;
      else if (pages <= 400) buckets['301-400']++;
      else if (pages <= 500) buckets['401-500']++;
      else if (pages <= 750) buckets['501-750']++;
      else if (pages <= 1000) buckets['751-1000']++;
      else buckets['Over 1000']++;
    });
    
    const distribution = Object.entries(buckets)
      .map(([range, count]) => ({ range, count }));
    
    setPageDistribution(distribution);
  };
  
  const calculateYearPublishedStats = () => {
    const yearBuckets = {};
    
    readingData.forEach(book => {
      const year = book.yearPublished;
      if (!year) return;
      
      // Group years by decade
      const decade = Math.floor(year / 10) * 10;
      const decadeLabel = `${decade}s`;
      
      yearBuckets[decadeLabel] = (yearBuckets[decadeLabel] || 0) + 1;
    });
    
    const yearArray = Object.entries(yearBuckets)
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => {
        // Extract the number from the decade string
        const decadeA = parseInt(a.decade);
        const decadeB = parseInt(b.decade);
        return decadeA - decadeB;
      });
    
    setYearPublishedStats(yearArray);
  };
  
  const calculateReadingVelocity = () => {
    // Books read per day calculation
    if (readingData.length < 2) {
      setReadingVelocity([]);
      return;
    }
    
    // Get books with date read and sort chronologically
    const booksWithDates = readingData
      .filter(book => book.dateRead)
      .sort((a, b) => new Date(a.dateRead) - new Date(b.dateRead));
    
    if (booksWithDates.length < 2) {
      setReadingVelocity([]);
      return;
    }
    
    // Calculate reading velocity over time
    const velocityData = [];
    const windowSize = 10; // Calculate over 10 books
    
    for (let i = windowSize - 1; i < booksWithDates.length; i++) {
      const currentBook = booksWithDates[i];
      const earlierBook = booksWithDates[i - (windowSize - 1)];
      
      const currentDate = new Date(currentBook.dateRead);
      const earlierDate = new Date(earlierBook.dateRead);
      
      // Calculate days between
      const daysDiff = Math.max(1, (currentDate - earlierDate) / (1000 * 60 * 60 * 24));
      
      // Calculate books per day and books per month
      const booksPerDay = (windowSize - 1) / daysDiff;
      const booksPerMonth = booksPerDay * 30;
      
      velocityData.push({
        date: currentBook.dateRead,
        book: currentBook.title,
        booksPerMonth: parseFloat(booksPerMonth.toFixed(2))
      });
    }
    
    setReadingVelocity(velocityData);
  };
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading reading statistics...</p>
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
  
  if (!readingData || readingData.length === 0) {
    return (
      <div className="no-data">
        <h2>No Reading Data Available</h2>
        <p>Please upload your Goodreads export file to get started.</p>
      </div>
    );
  }
  
  // Calculate summary stats
  const totalBooks = readingData.length;
  const totalPages = readingData.reduce((sum, book) => sum + (book.pages || 0), 0);
  const totalRatedBooks = readingData.filter(book => book.myRating > 0).length;
  const averageRating = stats?.averageRating || 0;
  
  // Colors for charts
  const COLORS = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
  
  return (
    <div className="reading-stats-page">
      <h1>Reading Statistics</h1>
      
      <div className="stats-overview">
        <div className="stat-card total-books">
          <h3>Total Books</h3>
          <div className="stat-value">{totalBooks}</div>
        </div>
        
        <div className="stat-card total-pages">
          <h3>Total Pages</h3>
          <div className="stat-value">{totalPages.toLocaleString()}</div>
        </div>
        
        <div className="stat-card avg-pages">
          <h3>Avg. Pages per Book</h3>
          <div className="stat-value">{Math.round(totalPages / totalBooks)}</div>
        </div>
        
        <div className="stat-card avg-rating">
          <h3>Average Rating</h3>
          <div className="stat-value">{averageRating.toFixed(1)}</div>
          <div className="rating-stars">
            {'★'.repeat(Math.round(averageRating))}
            {'☆'.repeat(5 - Math.round(averageRating))}
          </div>
        </div>
      </div>
      
      <div className="stat-sections">
        <div className="stat-section">
          <h2>Publication Years</h2>
          <div className="stat-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearPublishedStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="decade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4CAF50" name="Books" />
              </BarChart>
            </ResponsiveContainer>
            <div className="stat-insight">
              <p>
                Most of your books were published in the 
                {yearPublishedStats.length > 0 ? 
                  ` ${yearPublishedStats.sort((a, b) => b.count - a.count)[0].decade}` : 
                  ' recent decades'}.
                You have books spanning 
                {yearPublishedStats.length > 0 ? 
                  ` ${yearPublishedStats.length} decades` : 
                  ' multiple decades'}.
              </p>
            </div>
          </div>
        </div>
        
        <div className="stat-section">
          <h2>Book Length Distribution</h2>
          <div className="stat-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pageDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3F51B5" name="Books" />
              </BarChart>
            </ResponsiveContainer>
            <div className="stat-insight">
              <p>
                {pageDistribution.length > 0 && 
                  `Most of your books (${pageDistribution.sort((a, b) => b.count - a.count)[0].count}) 
                  are ${pageDistribution.sort((a, b) => b.count - a.count)[0].range} pages long.`}
                You've read {readingData.filter(book => book.pages > 500).length} books over 500 pages.
              </p>
            </div>
          </div>
        </div>
        
        <div className="stat-section">
          <h2>Top Publishers</h2>
          <div className="stat-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={publisherStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip />
                <Bar dataKey="count" fill="#FF9800" name="Books" />
              </BarChart>
            </ResponsiveContainer>
            <div className="stat-insight">
              <p>
                You've read books from {Object.keys(publisherStats).length} different publishers.
                {publisherStats.length > 0 && 
                  ` Your most common publisher is ${publisherStats[0].name} with ${publisherStats[0].count} books.`}
              </p>
            </div>
          </div>
        </div>
        
        <div className="stat-section">
          <h2>Book Format Distribution</h2>
          <div className="stat-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bindingStats}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                  label={({name, count}) => `${name}: ${count}`}
                >
                  {bindingStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} books`, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="stat-insight">
              <p>
                {bindingStats.length > 0 && 
                  `Your most common book format is ${bindingStats[0].name} with ${bindingStats[0].count} books 
                  (${Math.round((bindingStats[0].count / totalBooks) * 100)}% of your collection).`}
              </p>
            </div>
          </div>
        </div>
        
        {readingVelocity.length > 0 && (
          <div className="stat-section">
            <h2>Reading Velocity Over Time</h2>
            <div className="stat-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={readingVelocity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { year: '2-digit', month: 'short' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value) => [`${value} books/month`, 'Reading Pace']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="booksPerMonth" 
                    stroke="#9C27B0" 
                    name="Books per Month"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="stat-insight">
                <p>
                  Your reading pace has 
                  {readingVelocity[readingVelocity.length - 1].booksPerMonth > readingVelocity[0].booksPerMonth ? 
                    ' increased' : ' decreased'} 
                  over time.
                  Your current pace is approximately 
                  {readingVelocity[readingVelocity.length - 1].booksPerMonth.toFixed(1)} books per month.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="interesting-facts">
        <h2>Interesting Facts About Your Reading</h2>
        <div className="facts-grid">
          <div className="fact-card">
            <h3>Longest Book</h3>
            {stats?.pageStats?.longestBook && (
              <>
                <p className="fact-title">{stats.pageStats.longestBook.title}</p>
                <p className="fact-subtitle">by {stats.pageStats.longestBook.author}</p>
                <p className="fact-detail">{stats.pageStats.longestBook.pages.toLocaleString()} pages</p>
              </>
            )}
          </div>
          
          <div className="fact-card">
            <h3>Shortest Book</h3>
            {stats?.pageStats?.shortestBook && (
              <>
                <p className="fact-title">{stats.pageStats.shortestBook.title}</p>
                <p className="fact-subtitle">by {stats.pageStats.shortestBook.author}</p>
                <p className="fact-detail">{stats.pageStats.shortestBook.pages} pages</p>
              </>
            )}
          </div>
          
          <div className="fact-card">
            <h3>First Recorded Book</h3>
            {readingData.length > 0 && (
              (() => {
                const sortedBooks = [...readingData]
                  .filter(book => book.dateRead)
                  .sort((a, b) => new Date(a.dateRead) - new Date(b.dateRead));
                
                if (sortedBooks.length > 0) {
                  const firstBook = sortedBooks[0];
                  return (
                    <>
                      <p className="fact-title">{firstBook.title}</p>
                      <p className="fact-subtitle">by {firstBook.author}</p>
                      <p className="fact-detail">
                        Read on {new Date(firstBook.dateRead).toLocaleDateString()}
                      </p>
                    </>
                  );
                }
                return <p>No date information available</p>;
              })()
            )}
          </div>
          
          <div className="fact-card">
            <h3>Most Recent Book</h3>
            {readingData.length > 0 && (
              (() => {
                const sortedBooks = [...readingData]
                  .filter(book => book.dateRead)
                  .sort((a, b) => new Date(b.dateRead) - new Date(a.dateRead));
                
                if (sortedBooks.length > 0) {
                  const lastBook = sortedBooks[0];
                  return (
                    <>
                      <p className="fact-title">{lastBook.title}</p>
                      <p className="fact-subtitle">by {lastBook.author}</p>
                      <p className="fact-detail">
                        Read on {new Date(lastBook.dateRead).toLocaleDateString()}
                      </p>
                    </>
                  );
                }
                return <p>No date information available</p>;
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingStats;