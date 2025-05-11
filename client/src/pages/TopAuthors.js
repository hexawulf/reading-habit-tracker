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
    <div className="page top-authors">
      <h2 className="text-2xl font-bold mb-4">Top Authors</h2>
      {topAuthors.length === 0 ? (
        <p>No author data available yet. Upload a Goodreads CSV to see stats.</p>
      ) : (
        <ul className="space-y-2">
          {topAuthors.map(({ author, count }) => (
            <li key={author} className="flex justify-between border-b pb-1">
              <span>{author}</span>
              <span>{count} book{count !== 1 && 's'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopAuthors;