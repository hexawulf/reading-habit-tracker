
import React, { useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReadingData } from '../context/ReadingDataContext';

export default function AuthorBooks() {
  const { name } = useParams();
  const { stats, readingData } = useReadingData();
  
  const displayName = decodeURIComponent(name);
  
  const books = readingData
    ?.filter(b => b.author && b.author.toLowerCase() === displayName.toLowerCase())
    .sort((a, b) => (b.dateRead ? new Date(b.dateRead) : 0) - (a.dateRead ? new Date(a.dateRead) : 0));

  return (
    <div className="p-6">
      <Link to="/top-authors" className="text-blue-600 hover:underline">&larr; Back to Top Authors</Link>
      <h2 className="text-3xl font-semibold mb-4 mt-2">{displayName}</h2>

      {!books || books.length === 0 ? (
        <p>No books found for this author.</p>
      ) : (
        <ul className="space-y-3">
          {books.map((b, idx) => (
            <li key={idx} className="border rounded-lg p-4 shadow-sm flex flex-col">
              <span className="font-medium">{b.title}</span>
              <span className="text-sm text-gray-500">
                {b.dateRead ? new Date(b.dateRead).toLocaleDateString() : 'Date unknown'} &middot; {b.pages || '?'} pages
              </span>
              {b.myRating > 0 && (
                <span className="mt-1 inline-block bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">
                  {b.myRating} ★
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
