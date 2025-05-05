// client/src/pages/RecentBooks.js
import React, { useState } from 'react';
import { useReadingData } from '../context/ReadingDataContext';
import './RecentBooks.css';

const RecentBooks = () => {
  const { readingData, loading, error } = useReadingData();
  const [sortBy, setSortBy] = useState('dateRead');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterRating, setFilterRating] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 10;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading your books...</p>
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
        <p>Please upload your reading data to get started.</p>
      </div>
    );
  }

  // Filter books by rating
  const filteredBooks = filterRating > 0
    ? readingData.filter(book => book.myRating >= filterRating)
    : readingData;

  // Sort books
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === 'dateRead') {
      const dateA = new Date(a.dateRead || '1900-01-01');
      const dateB = new Date(b.dateRead || '1900-01-01');
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortBy === 'title') {
      return sortOrder === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else if (sortBy === 'author') {
      return sortOrder === 'asc'
        ? a.author.localeCompare(b.author)
        : b.author.localeCompare(a.author);
    } else if (sortBy === 'rating') {
      return sortOrder === 'asc'
        ? (a.myRating || 0) - (b.myRating || 0)
        : (b.myRating || 0) - (a.myRating || 0);
    } else if (sortBy === 'pages') {
      return sortOrder === 'asc'
        ? (a.pages || 0) - (b.pages || 0)
        : (b.pages || 0) - (a.pages || 0);
    }
    return 0;
  });

  // Pagination
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = sortedBooks.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(sortedBooks.length / booksPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="recent-books-page">
      <h1>Recently Read Books</h1>
      
      <div className="filters-bar">
        <div className="sort-controls">
          <label htmlFor="sort-by">Sort by:</label>
          <select 
            id="sort-by" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="dateRead">Date Read</option>
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="rating">Rating</option>
            <option value="pages">Pages</option>
          </select>
          
          <button 
            className="sort-order" 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
        
        <div className="rating-filter">
          <label htmlFor="filter-rating">Minimum Rating:</label>
          <select
            id="filter-rating"
            value={filterRating}
            onChange={(e) => setFilterRating(parseInt(e.target.value))}
          >
            <option value="0">All Ratings</option>
            <option value="1">1+ Stars</option>
            <option value="2">2+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="4">4+ Stars</option>
            <option value="5">5 Stars</option>
          </select>
        </div>
      </div>
      
      <div className="books-table-container">
        <table className="books-table">
          <thead>
            <tr>
              <th onClick={() => {setSortBy('title'); setSortOrder(sortBy === 'title' ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc');}}>
                Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => {setSortBy('author'); setSortOrder(sortBy === 'author' ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc');}}>
                Author {sortBy === 'author' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => {setSortBy('rating'); setSortOrder(sortBy === 'rating' ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc');}}>
                Rating {sortBy === 'rating' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => {setSortBy('dateRead'); setSortOrder(sortBy === 'dateRead' ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc');}}>
                Date Read {sortBy === 'dateRead' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => {setSortBy('pages'); setSortOrder(sortBy === 'pages' ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc');}}>
                Pages {sortBy === 'pages' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentBooks.map((book, index) => (
              <tr key={index}>
                <td className="book-title">{book.title}</td>
                <td>{book.author}</td>
                <td className="book-rating">
                  {'★'.repeat(book.myRating || 0)}
                  {'☆'.repeat(5 - (book.myRating || 0))}
                </td>
                <td>{new Date(book.dateRead).toLocaleDateString()}</td>
                <td>{book.pages || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="pagination">
        <button 
          onClick={() => paginate(currentPage - 1)} 
          disabled={currentPage === 1}
          className="page-btn"
        >
          Previous
        </button>
        
        <div className="page-numbers">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button 
                key={pageNum}
                onClick={() => paginate(pageNum)}
                className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        
        <button 
          onClick={() => paginate(currentPage + 1)} 
          disabled={currentPage === totalPages}
          className="page-btn"
        >
          Next
        </button>
      </div>
      
      <div className="results-summary">
        Showing {indexOfFirstBook + 1}-{Math.min(indexOfLastBook, sortedBooks.length)} of {sortedBooks.length} books
      </div>
    </div>
  );
};

export default RecentBooks;