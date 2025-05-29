// client/src/pages/YearlyProgress.js
import React from 'react'; // Removed useState as it's not used directly now
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line, 
  Cell, Legend // Removed PieChart, Pie as they are not used here
} from 'recharts';
import { useReadingData } from '../context/ReadingDataContext';
import './YearlyProgress.css';

// Night Owl theme colors
const NIGHT_OWL_ACCENT_1 = "var(--night-owl-accent1)";
const NIGHT_OWL_ACCENT_2 = "var(--night-owl-accent2)";
const NIGHT_OWL_TEXT = "var(--night-owl-text)";
const NIGHT_OWL_BORDER = "var(--night-owl-border)";
// Palette for Goal Achievement History (example)
const GOAL_ACHIEVEMENT_COLORS = {
  over100: '#82aaff', // Accent 2 (Excellent)
  almost100: '#c3e88d', // Light Green (Great)
  good: '#ffc700',     // Yellow (Good)
  ok: '#ff8c42',       // Orange (Okay)
  poor: '#ff5370'      // Red (Poor)
};


const YearlyProgress = () => {
  const { stats, readingData, loading, error, goalProgress } = useReadingData();
  const currentYear = new Date().getFullYear().toString();
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading yearly progress data...</p>
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
  
  if (!stats || !readingData) {
    return (
      <div className="no-data">
        <h2>No Reading Data Available</h2>
        <p>Please upload your reading data to get started.</p>
      </div>
    );
  }
  
  stats.readingByYear = stats.readingByYear || {};
  
  const yearlyData = Object.entries(stats.readingByYear)
    .map(([year, count]) => ({ year, count: Number(count) })) // Ensure count is a number
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  
  const yearlyGrowth = yearlyData.map((item, index) => {
    if (index === 0) return { ...item, growth: 0 };
    const prevYearCount = yearlyData[index - 1].count;
    const growth = prevYearCount === 0 ? (item.count > 0 ? 100 : 0) : ((item.count - prevYearCount) / prevYearCount) * 100;
    return { ...item, growth };
  });
  
  const yearlyGoalData = [];
  if (goalProgress && goalProgress.yearly && goalProgress.yearly.target > 0) { // Only add if goal exists
    yearlyGoalData.push({
      year: currentYear,
      actual: stats.readingByYear[currentYear] || 0,
      goal: goalProgress.yearly.target
    });
  }
  
  const totalYears = yearlyData.length;
  const totalBooks = yearlyData.reduce((sum, item) => sum + item.count, 0);
  const averageBooksPerYear = totalYears > 0 ? totalBooks / totalYears : 0;
  
  const bestYear = yearlyData.length > 0 
    ? yearlyData.reduce((max, item) => item.count > max.count ? item : max, yearlyData[0])
    : { year: 'N/A', count: 0 };
    
  const worstYear = yearlyData.length > 0 
    ? yearlyData.reduce((min, item) => item.count < min.count ? item : min, yearlyData[0])
    : { year: 'N/A', count: 0 };
  
  const yearlyPagesData = [];
  const booksByYear = {};
  
  readingData.forEach(book => {
    if (book.dateRead) {
      const year = new Date(book.dateRead).getFullYear().toString();
      if (!booksByYear[year]) booksByYear[year] = [];
      booksByYear[year].push(book);
    }
  });
  
  Object.entries(booksByYear).forEach(([year, books]) => {
    const totalPages = books.reduce((sum, book) => sum + (parseInt(book.pages, 10) || 0), 0);
    yearlyPagesData.push({ year, pages: totalPages });
  });
  
  yearlyPagesData.sort((a, b) => parseInt(a.year) - parseInt(b.year));
  
  const currentYearProgress = goalProgress?.yearly || { current: 0, target: 0, percentage: 0 };
  
  // For yearlyCompletionRate, this should ideally come from a history of goals.
  // For this example, we'll just show current year if a goal is set.
  const yearlyCompletionRate = [];
  if (goalProgress && goalProgress.yearly && goalProgress.yearly.target > 0) {
    yearlyCompletionRate.push({
      year: currentYear,
      rate: currentYearProgress.percentage
    });
  }

  const tickFormatter = (value) => typeof value === 'number' && value > 1000 ? `${(value/1000).toFixed(0)}k` : value;
  
  return (
    <div className="yearly-progress-page">
      <h1>Yearly Reading Progress</h1>
      
      <div className="stats-overview"> {/* Uses .stat-card from App.css */}
        <div className="stat-card">
          <h3>Books This Year ({currentYear})</h3>
          <div className="stat-value">{stats.readingByYear[currentYear] || 0}</div>
          {currentYearProgress.target > 0 && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${Math.min(100, currentYearProgress.percentage)}%`, backgroundColor: NIGHT_OWL_ACCENT_1 }}
                ></div>
              </div>
              <div className="progress-text">
                {currentYearProgress.current} of {currentYearProgress.target} ({currentYearProgress.percentage.toFixed(1)}%)
              </div>
            </div>
          )}
        </div>
        <div className="stat-card">
          <h3>Avg Books / Year</h3>
          <div className="stat-value">{averageBooksPerYear.toFixed(1)}</div>
        </div>
        <div className="stat-card">
          <h3>Best Year: {bestYear.year}</h3>
          <div className="stat-value">{bestYear.count} books</div>
        </div>
        <div className="stat-card">
          <h3>Worst Year: {worstYear.year}</h3>
          <div className="stat-value">{worstYear.count} books</div>
        </div>
      </div>
      
      <div className="charts-container">
        <div className="chart-card">
          <h3>Books Read By Year</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearlyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={NIGHT_OWL_BORDER} />
              <XAxis dataKey="year" tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} />
              <YAxis tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} tickFormatter={tickFormatter}/>
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--night-owl-card-background)', border: `1px solid ${NIGHT_OWL_BORDER}`, borderRadius: 'var(--border-radius, 6px)' }}
                itemStyle={{ color: NIGHT_OWL_TEXT }}
                cursor={{ fill: 'rgba(var(--night-owl-accent2-rgb), 0.15)' }}
                formatter={(value) => [`${value} books`, 'Books Read']} 
              />
              <Bar dataKey="count" fill={NIGHT_OWL_ACCENT_1} name="Books Read" isAnimationActive={true} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-card">
          <h3>Pages Read By Year</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearlyPagesData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={NIGHT_OWL_BORDER} />
              <XAxis dataKey="year" tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} />
              <YAxis tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} tickFormatter={tickFormatter} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--night-owl-card-background)', border: `1px solid ${NIGHT_OWL_BORDER}`, borderRadius: 'var(--border-radius, 6px)' }}
                itemStyle={{ color: NIGHT_OWL_TEXT }}
                cursor={{ fill: 'rgba(var(--night-owl-accent2-rgb), 0.15)' }}
                formatter={(value) => [`${value.toLocaleString()} pages`, 'Pages Read']} 
              />
              <Bar dataKey="pages" fill={NIGHT_OWL_ACCENT_2} name="Pages Read" isAnimationActive={true} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="charts-container">
        <div className="chart-card">
          <h3>Year-over-Year Growth (Books)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yearlyGrowth.filter(d => d.year !== yearlyData[0]?.year)} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}> {/* Exclude first year for growth chart */}
              <CartesianGrid strokeDasharray="3 3" stroke={NIGHT_OWL_BORDER} />
              <XAxis dataKey="year" tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} />
              <YAxis yAxisId="left" tickFormatter={(value) => `${value.toFixed(0)}%`} tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={tickFormatter} tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--night-owl-card-background)', border: `1px solid ${NIGHT_OWL_BORDER}`, borderRadius: 'var(--border-radius, 6px)' }}
                itemStyle={{ color: NIGHT_OWL_TEXT }}
                cursor={{ fill: 'rgba(var(--night-owl-accent2-rgb), 0.15)' }}
              />
              <Legend wrapperStyle={{ color: NIGHT_OWL_TEXT, fontSize: '12px' }} />
              <Line yAxisId="left" type="monotone" dataKey="growth" stroke={NIGHT_OWL_ACCENT_1} name="Growth Rate" isAnimationActive={true} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line yAxisId="right" type="monotone" dataKey="count" stroke={NIGHT_OWL_ACCENT_2} name="Books Read" isAnimationActive={true} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {yearlyGoalData.length > 0 && (
          <div className="chart-card">
            <h3>Goal vs. Actual ({currentYear})</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearlyGoalData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={NIGHT_OWL_BORDER} />
                <XAxis type="number" tickFormatter={tickFormatter} tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} />
                <YAxis type="category" dataKey="year" tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} width={60} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--night-owl-card-background)', border: `1px solid ${NIGHT_OWL_BORDER}`, borderRadius: 'var(--border-radius, 6px)' }}
                  itemStyle={{ color: NIGHT_OWL_TEXT }}
                  cursor={{ fill: 'rgba(var(--night-owl-accent2-rgb), 0.15)' }}
                />
                <Legend wrapperStyle={{ color: NIGHT_OWL_TEXT, fontSize: '12px' }} />
                <Bar dataKey="goal" fill={NIGHT_OWL_ACCENT_2} name="Yearly Goal" isAnimationActive={true} background={{ fill: 'var(--night-owl-border)'}} />
                <Bar dataKey="actual" fill={NIGHT_OWL_ACCENT_1} name="Books Read" isAnimationActive={true} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      
      <div className="yearly-breakdown chart-card"> {/* Added chart-card for consistency */}
        <h2>Yearly Reading Breakdown</h2>
        <div className="years-grid">
          {yearlyData.map((yearData, index) => {
            const yearBooks = booksByYear[yearData.year] || [];
            const yearPages = yearBooks.reduce((sum, book) => sum + (parseInt(book.pages, 10) || 0), 0);
            const avgRating = yearBooks.length > 0
              ? yearBooks.reduce((sum, book) => sum + (book.myRating || 0), 0) / yearBooks.filter(b => b.myRating > 0).length
              : 0;
              
            const genreCounts = {};
            yearBooks.forEach(book => {
              (book.genre || 'N/A').split(',').forEach(g => { // Handle multiple genres
                const cleanGenre = g.trim();
                if (cleanGenre) genreCounts[cleanGenre] = (genreCounts[cleanGenre] || 0) + 1;
              });
            });
            const topGenre = Object.entries(genreCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A';
            
            return (
              <div key={index} className="year-card"> {/* This could use .insight-card styling */}
                <div className="year-header">
                  <h3>{yearData.year}</h3>
                  <div className="year-book-count">{yearData.count} books</div>
                </div>
                <div className="year-stats">
                  <p>Pages: <span>{yearPages.toLocaleString()}</span></p>
                  <p>Avg Rating: <span>{avgRating.toFixed(1)} ★</span></p>
                  <p>Top Genre: <span>{topGenre}</span></p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {yearlyCompletionRate.length > 0 && (
        <div className="yearly-goal-history chart-card"> {/* Added chart-card */}
          <h2>Goal Achievement History</h2>
          <div className="goal-history-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyCompletionRate} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={NIGHT_OWL_BORDER} />
                  <XAxis dataKey="year" tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `${value}%`} tick={{ fill: NIGHT_OWL_TEXT, fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--night-owl-card-background)', border: `1px solid ${NIGHT_OWL_BORDER}`, borderRadius: 'var(--border-radius, 6px)' }}
                    itemStyle={{ color: NIGHT_OWL_TEXT }}
                    cursor={{ fill: 'rgba(var(--night-owl-accent2-rgb), 0.15)' }}
                    formatter={(value) => [`${value.toFixed(1)}%`, 'Completion Rate']} 
                  />
                  <Bar dataKey="rate" name="Goal Completion Rate" isAnimationActive={true}>
                    {yearlyCompletionRate.map((entry, i) => {
                      let cellFill = GOAL_ACHIEVEMENT_COLORS.poor;
                      if (entry.rate >= 100) cellFill = GOAL_ACHIEVEMENT_COLORS.over100;
                      else if (entry.rate >= 90) cellFill = GOAL_ACHIEVEMENT_COLORS.almost100;
                      else if (entry.rate >= 70) cellFill = GOAL_ACHIEVEMENT_COLORS.good;
                      else if (entry.rate >= 50) cellFill = GOAL_ACHIEVEMENT_COLORS.ok;
                      return <Cell key={`cell-${i}`} fill={cellFill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default YearlyProgress;