
import React from 'react';
import { useReadingData } from '../context/ReadingDataContext';
import './TopAuthors.css';

const TopAuthors = () => {
  const { stats, loading, error } = useReadingData();
  const topAuthors = stats?.topAuthors || [];

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

  return (
    <div className="top-authors-page">
      <h1>Top Authors</h1>
      
      {topAuthors.length === 0 ? (
        <div className="no-data-message">
          <p>No author data available yet. Upload your reading history to see stats.</p>
        </div>
      ) : (
        <div className="authors-grid">
          {stats?.topAuthors?.map((authorData) => {
            const slug = encodeURIComponent(authorData.author);
            return (
              <Link
                to={`/author/${slug}`}
                key={authorData.author}
                className="author-card"
              >
                <div className="author-name">{authorData.author}</div>
                <span className="author-count">
                  {authorData.count} book{authorData.count !== 1 ? 's' : ''}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TopAuthors;
