import React from 'react';
import { useReadingData } from '../context/ReadingDataContext';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import './ReadingStats.css';

// Night Owl theme colors from Dashboard.js (or a shared constants file)
const NIGHT_OWL_ACCENT_1 = "var(--night-owl-accent1)";
const NIGHT_OWL_ACCENT_2 = "var(--night-owl-accent2)";
const NIGHT_OWL_TEXT = "var(--night-owl-text)";
const NIGHT_OWL_BORDER = "var(--night-owl-border)";
const RATING_COLORS = [ // Night Owl friendly rating colors
  '#ff5370', '#ff8c42', '#ffc700', '#c3e88d', '#89ddff'
];

export default function ReadingStats() {
  const { stats, loading, error } = useReadingData(); // Added loading and error

  if (loading) return <div className="loading"><div className="spinner"></div><p>Loading stats...</p></div>;
  if (error) return <div className="error-container"><h2>Error Loading Stats</h2><p>{error}</p></div>;
  if (!stats) return <div className="no-data"><h2>No Stats Available</h2><p>Please upload data.</p></div>;


  const ratingDistributionData = Object.entries(stats?.ratingDistribution || {})
    .map(([star, count]) => ({
      name: `${star}★`,
      value: count,
      rating: parseInt(star) // for sorting and color indexing
    }))
    .filter(item => item.value > 0 && item.rating > 0)
    .sort((a,b) => a.rating - b.rating);

  // For pages per book, it might be better to show distribution or aggregated data
  // Current `pageData` is just a list of all page counts, which isn't ideal for BarChart directly.
  // Let's assume we want to show books by page count ranges.
  const pageRanges = [
    { name: '0-100', range: [0, 100] },
    { name: '101-200', range: [101, 200] },
    { name: '201-300', range: [201, 300] },
    { name: '301-400', range: [301, 400] },
    { name: '401-500', range: [401, 500] },
    { name: '500+', range: [501, Infinity] },
  ];

  const booksByPageRange = pageRanges.map(rangeInfo => {
    const count = (stats?.readingData || []).filter(book => {
      const pages = book?.pages || 0;
      return pages >= rangeInfo.range[0] && pages <= rangeInfo.range[1];
    }).length;
    return { name: rangeInfo.name, count };
  }).filter(r => r.count > 0);


  const pace = stats?.readingPace || { booksPerYear: 0, booksPerMonth: 0, pagesPerDay: 0 };
  const pageStatsData = stats?.pageStats || { averageLength: 0, longestBook: {}, shortestBook: {} };

  const tickFormatter = (value) => typeof value === 'number' && value > 1000 ? `${(value/1000).toFixed(0)}k` : value;

  return (
    <div className="reading-stats-page">
      <h2>Reading Statistics</h2>

      <div className="stats-overview"> {/* These should use the .stat-card styles from App.css now */}
        <Card title="Avg Books / Year" value={pace.booksPerYear.toFixed(1)} />
        <Card title="Current Year Pace (Books/Month)" value={pace.booksPerMonth.toFixed(1)} />
        <Card title="Recent Pace (Pages/Day)" value={pace.pagesPerDay.toFixed(1)} />
        <Card title="Avg Book Length" value={pageStatsData.averageLength.toFixed(0) + 'p'} />
      </div>

      <div className="charts-grid">
        <div className="chart-container chart-card"> {/* Added chart-card class for consistent styling */}
          <h3>Rating Distribution</h3>
          {ratingDistributionData.length === 0 ? (
            <p className="no-chart-data">No rating data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={ratingDistributionData} 
                  dataKey="value" 
                  nameKey="name" 
                  outerRadius={100} 
                  labelLine={{ stroke: NIGHT_OWL_TEXT }}
                  label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  isAnimationActive={true}
                >
                  {ratingDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RATING_COLORS[(entry.rating - 1) % RATING_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--night-owl-card-background)', border: `1px solid ${NIGHT_OWL_BORDER}`, borderRadius: 'var(--border-radius, 6px)' }}
                  itemStyle={{ color: NIGHT_OWL_TEXT }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-container chart-card"> {/* Added chart-card class */}
          <h3>Books by Page Count</h3>
          {booksByPageRange.length === 0 ? (
            <p className="no-chart-data">No page data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={booksByPageRange} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={NIGHT_OWL_BORDER} />
                <XAxis dataKey="name" tick={{ fill: NIGHT_OWL_TEXT, fontSize: 10 }} />
                <YAxis tick={{ fill: NIGHT_OWL_TEXT, fontSize: 10 }} tickFormatter={tickFormatter} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--night-owl-card-background)', border: `1px solid ${NIGHT_OWL_BORDER}`, borderRadius: 'var(--border-radius, 6px)' }}
                  itemStyle={{ color: NIGHT_OWL_TEXT }}
                  cursor={{ fill: 'rgba(var(--night-owl-accent2-rgb), 0.15)' }}
                />
                <Bar dataKey="count" fill={NIGHT_OWL_ACCENT_1} isAnimationActive={true} name="Books" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="book-highlights"> {/* These should use .insight-card or similar from App.css */}
        <BookHighlight
          title="Longest Book"
          book={pageStatsData.longestBook}
          className="highlight-purple"
        />
        <BookHighlight
          title="Shortest Book"
          book={pageStatsData.shortestBook}
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