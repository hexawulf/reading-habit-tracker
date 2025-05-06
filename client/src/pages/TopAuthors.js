// client/src/pages/TopAuthors.js
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useReadingData } from '../context/ReadingDataContext';
import './TopAuthors.css';

const TopAuthors = () => {
  const { stats, readingData, loading, error } = useReadingData();
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading author data...</p>
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
  
  if (!stats || !stats.topAuthors || !readingData) {
    return (
      <div className="no-data">
        <h2>No Author Data Available</h2>
        <p>Please upload your reading data to get started.</p>
      </div>
    );
  }
  
  // Make sure stats.topAuthors exists
  const topAuthors = stats.topAuthors || [];
  
  // Filter authors based on search term
  const filteredAuthors = searchTerm 
    ? topAuthors.filter(author => 
        author && author.author && 
        author.author.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : topAuthors;
  
  // Get author-specific book details when an author is selected
  const authorBooks = selectedAuthor 
    ? readingData.filter(book => book.author === selectedAuthor.author)
    : [];
  
  // Prepare rating distribution data for the selected author
  const ratingDistribution = {};
  if (selectedAuthor) {
    authorBooks.forEach(book => {
      const rating = book.myRating || 0;
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    });
  }
  
  const ratingData = Object.entries(ratingDistribution)
    .map(([rating, count]) => ({ rating: parseInt(rating), count }))
    .filter(item => item.count > 0);
  
  const RATING_COLORS = ['#FF5252', '#FF7B25', '#FFC107', '#8BC34A', '#4CAF50'];
  
  // Calculate reading dates for the selected author
  const authorBooksByYear = {};
  if (selectedAuthor) {
    authorBooks.forEach(book => {
      if (book.dateRead) {
        const year = new Date(book.dateRead).getFullYear();
        authorBooksByYear[year] = (authorBooksByYear[year] || 0) + 1;
      }
    });
  }
  
  const yearlyData = Object.entries(authorBooksByYear)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);
  
  return (
    <div className="top-authors-page">
      <h1>Top Authors</h1>
      
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search authors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="authors-container">
        <div className="authors-list-container">
          <h2>Authors by Books Read</h2>
          <div className="authors-list">
            {filteredAuthors.map((author, index) => (
              <div 
                key={index} 
                className={`author-card ${selectedAuthor && selectedAuthor.author === author.author ? 'selected' : ''}`}
                onClick={() => setSelectedAuthor(author)}
              >
                <div className="author-name">{author.author}</div>
                <div className="author-book-count">{author.count} books</div>
                <div className="author-bar">
                  <div 
                    className="author-bar-fill"
                    style={{ 
                      width: `${(author.count / (topAuthors[0]?.count || 1)) * 100}%`,
                      backgroundColor: `hsl(${120 + index * 10}, 70%, 45%)`
                    }}
                  ></div>
                </div>
              </div>
            ))}
            
            {filteredAuthors.length === 0 && (
              <div className="no-results">No authors found matching "{searchTerm}"</div>
            )}
          </div>
        </div>
        
        {selectedAuthor && (
          <div className="author-details">
            <h2>{selectedAuthor.author}</h2>
            <div className="author-stats">
              <div className="stat-item">
                <span className="stat-label">Books Read:</span>
                <span className="stat-value">{selectedAuthor.count}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Average Rating:</span>
                <span className="stat-value">
                  {authorBooks.reduce((sum, book) => sum + (book.myRating || 0), 0) / authorBooks.length || 0}
                  {' '}
                  <span className="rating-stars">
                    {'★'.repeat(Math.round(authorBooks.reduce((sum, book) => sum + (book.myRating || 0), 0) / authorBooks.length || 0))}
                    {'☆'.repeat(5 - Math.round(authorBooks.reduce((sum, book) => sum + (book.myRating || 0), 0) / authorBooks.length || 0))}
                  </span>
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Pages:</span>
                <span className="stat-value">
                  {authorBooks.reduce((sum, book) => sum + (book.pages || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="author-charts">
              <div className="chart-card">
                <h3>Books Read By Year</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4CAF50" name="Books Read" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="chart-card">
                <h3>Rating Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={ratingData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="rating"
                      label={({rating, count}) => `${rating}★: ${count}`}
                    >
                      {ratingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RATING_COLORS[entry.rating - 1] || '#CCCCCC'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} books`, `${name} stars`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="author-books">
              <h3>Books by {selectedAuthor.author}</h3>
              <div className="books-grid">
                {authorBooks.map((book, index) => (
                  <div key={index} className="book-card">
                    <h4 className="book-title">{book.title}</h4>
                    <div className="book-rating">
                      {'★'.repeat(book.myRating || 0)}
                      {'☆'.repeat(5 - (book.myRating || 0))}
                    </div>
                    <p className="book-date">
                      Read on: {book.dateRead ? new Date(book.dateRead).toLocaleDateString() : 'Unknown'}
                    </p>
                    <p className="book-pages">{book.pages || 'Unknown'} pages</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {!selectedAuthor && filteredAuthors.length > 0 && (
          <div className="author-details no-selection">
            <div className="placeholder-message">
              <h3>Select an author to view details</h3>
              <p>Click on an author from the list to see their statistics and books</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopAuthors;