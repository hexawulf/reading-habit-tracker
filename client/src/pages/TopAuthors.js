import React from 'react';
import { Link } from 'react-router-dom';
import { useReadingData } from '../context/ReadingDataContext';
import { FiUser } from 'react-icons/fi'; // Generic user icon
import './TopAuthors.css';

const TopAuthors = () => {
  const { stats, loading, error } = useReadingData();
  
  // Assuming stats.topAuthors is an array of { author: string, count: number, averageRating: number (optional) }
  // If averageRating is not directly in topAuthors, we might need to calculate it or fetch more detailed stats.
  // For now, we'll conditionally display it.
  const topAuthors = stats?.topAuthors || [];

  if (loading) {
    return (
      <div className="loading-container"> {/* Changed class for clarity */}
        <div className="spinner"></div>
        <p>Loading top authors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Author Data</h2>
        <p>{error.message || error}</p>
      </div>
    );
  }

  // Function to get initials for avatar placeholder
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
  };

  return (
    <div className="top-authors-page">
      <h1>Top Authors</h1>
      
      {topAuthors.length === 0 ? (
        <div className="no-data-message"> {/* This class can be styled globally or here */}
          <p>No author data available. Read some books to see your top authors!</p>
          <Link to="/upload" className="btn btn-primary" style={{marginTop: '1rem'}}>Upload Data</Link>
        </div>
      ) : (
        <div className="top-authors-scroller">
          {topAuthors.map((authorData) => {
            const slug = encodeURIComponent(authorData.author);
            const authorName = authorData.author || 'Unknown Author';
            const bookCount = authorData.count || 0;
            // Ensure averageRating is a number and handle missing data
            const averageRating = typeof authorData.averageRating === 'number' ? authorData.averageRating.toFixed(1) : null;

            return (
              <Link
                to={`/author/${slug}`} // Assuming a route like /author/:authorName
                key={authorName + slug} // Ensure unique key
                className="author-card-item" // New class for individual cards
              >
                <div className="author-avatar-placeholder">
                  {/* Add logic for actual avatar if available, otherwise initials or icon */}
                  <span>{getInitials(authorName)}</span>
                  {/* <FiUser /> */}
                </div>
                <h3 className="author-name">{authorName}</h3>
                <p className="author-info">
                  {bookCount} book{bookCount !== 1 ? 's' : ''} read
                </p>
                {averageRating !== null && (
                  <div className="author-rating">
                    Avg Rating: {averageRating} ★
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TopAuthors;
