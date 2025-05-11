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
    <div className="p-6">
      <h2 className="text-3xl font-semibold mb-6">Top Authors</h2>

      {topAuthors.length === 0 ? (
        <p>No author data yet. Upload a Goodreads CSV to see stats.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topAuthors.map(({ author, count }) => (
            <div
              key={author}
              className="flex items-center justify-between bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-4"
            >
              <span className="font-medium truncate">{author}</span>
              <span className="ml-4 inline-block bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                {count}&nbsp;book{count !== 1 && 's'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopAuthors;