import React from 'react';
import { useReadingData } from '../context/ReadingDataContext';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import './ReadingStats.css';

const COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa'];

export default function ReadingStats() {
  const { stats } = useReadingData();

  const ratingData = Object.entries(stats?.ratingDistribution || {}).map(([star, count]) => ({
    name: `${star}★`,
    value: count
  }));

  const pageData = (stats?.readingData || []).map(b => ({ pages: b?.pages || 0 }));
  const pace = stats?.readingPace || { booksPerYear: 0, booksPerMonth: 0, pagesPerDay: 0 };
  const pageStats = stats?.pageStats || { averageLength: 0, longestBook: {}, shortestBook: {} };

  return (
    <div className="reading-stats-page">
      <h2>Reading Stats</h2>

      <div className="stats-overview">
        <Card title="Books / Year" value={pace.booksPerYear.toFixed(1)} />
        <Card title="Books / Month" value={pace.booksPerMonth.toFixed(1)} />
        <Card title="Pages / Day" value={pace.pagesPerDay.toFixed(1)} />
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Rating Distribution</h3>
          {ratingData.every(d => d.value === 0) ? (
            <p>No rating data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={ratingData} dataKey="value" nameKey="name" outerRadius={100} label>
                  {ratingData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-container">
          <h3>Pages per Book</h3>
          {pageData.length === 0 ? (
            <p>No page data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pageData}>
                <XAxis dataKey="pages" />
                <YAxis />
                <Bar dataKey="pages">
                  {pageData.map((_, i) => (
                    <Cell key={i} fill="#60a5fa" />
                  ))}
                </Bar>
                <Tooltip />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="book-highlights">
        <BookHighlight
          title="Longest Book"
          book={pageStats.longestBook}
          className="highlight-purple"
        />
        <BookHighlight
          title="Shortest Book"
          book={pageStats.shortestBook}
          className="highlight-pink"
        />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="stat-card">
      <span className="card-title">{title}</span>
      <span className="card-value">{value || 0}</span>
    </div>
  );
}

function BookHighlight({ title, book, className }) {
  if (!book || !book.title) return null;
  return (
    <div className={`book-highlight ${className}`}>
      <h4>{title}</h4>
      <p className="book-title">{book.title}</p>
      <p className="book-details">
        {book.pages || '?'} pages {book.author && `· ${book.author}`}
      </p>
    </div>
  );
}