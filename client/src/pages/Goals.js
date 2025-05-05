// client/src/pages/Goals.js
import React, { useState, useEffect } from 'react';
import { useReadingData } from '../context/ReadingDataContext';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import './Goals.css';

const Goals = () => {
  const { stats, goals, updateGoals, goalProgress, loading, error } = useReadingData();
  
  const [newGoals, setNewGoals] = useState({
    yearlyGoal: 52,
    monthlyGoal: 4,
    pagesGoal: 15000
  });
  
  const [yearlyPrediction, setYearlyPrediction] = useState(0);
  const [suggestedGoals, setSuggestedGoals] = useState({
    easy: 0,
    moderate: 0,
    challenging: 0
  });
  
  useEffect(() => {
    if (goals) {
      setNewGoals({
        yearlyGoal: goals.yearlyGoal,
        monthlyGoal: goals.monthlyGoal,
        pagesGoal: goals.pagesGoal
      });
    }
  }, [goals]);
  
  useEffect(() => {
    if (stats && stats.readingPace) {
      // Calculate yearly prediction based on current pace
      const currentYear = new Date().getFullYear().toString();
      const currentMonth = new Date().getMonth();
      const booksReadThisYear = stats.readingByYear[currentYear] || 0;
      
      // Project for the rest of the year
      const monthsRemaining = 11 - currentMonth;
      const projectedAdditionalBooks = Math.round(stats.readingPace.booksPerMonth * monthsRemaining);
      const yearlyProjection = booksReadThisYear + projectedAdditionalBooks;
      
      setYearlyPrediction(yearlyProjection);
      
      // Calculate suggested goals based on past performance
      const avgBooksPerYear = stats.readingPace.booksPerYear;
      
      setSuggestedGoals({
        easy: Math.round(avgBooksPerYear * 0.8), // 80% of historical average
        moderate: Math.round(avgBooksPerYear), // Historical average
        challenging: Math.round(avgBooksPerYear * 1.2) // 120% of historical average
      });
    }
  }, [stats]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGoals({
      ...newGoals,
      [name]: parseInt(value)
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    updateGoals(newGoals);
  };
  
  const handleSuggestedGoal = (level) => {
    const yearlyGoal = suggestedGoals[level];
    const monthlyGoal = Math.round(yearlyGoal / 12);
    const pagesGoal = yearlyGoal * (stats?.pageStats?.averageLength || 300);
    
    setNewGoals({
      yearlyGoal,
      monthlyGoal,
      pagesGoal
    });
    
    updateGoals({
      yearlyGoal,
      monthlyGoal,
      pagesGoal
    });
  };
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading goals data...</p>
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
  
  if (!stats || !goalProgress) {
    return (
      <div className="no-data">
        <h2>No Reading Data Available</h2>
        <p>Please upload your Goodreads export file to get started.</p>
      </div>
    );
  }
  
  // Current year progress
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = new Date().getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Create data for charts
  const monthlyProgressData = monthNames.map((month, index) => {
    const monthGoal = newGoals.monthlyGoal;
    let actual = 0;
    
    if (stats.readingByMonth && stats.readingByMonth[currentYear]) {
      actual = stats.readingByMonth[currentYear][index] || 0;
    }
    
    return {
      month,
      goal: monthGoal,
      actual: index <= currentMonth ? actual : null // Only show actual for past months
    };
  });
  
  // Data for yearly progress pie chart
  const yearlyProgressData = [
    { name: 'Read', value: goalProgress.yearly.current },
    { name: 'Remaining', value: Math.max(0, goalProgress.yearly.target - goalProgress.yearly.current) }
  ];
  
  const COLORS = ['#4CAF50', '#e0e0e0'];
  
  return (
    <div className="goals-page">
      <h1>Reading Goals</h1>
      
      <div className="goals-overview">
        <div className="goal-card yearly-goal">
          <h2>Yearly Goal</h2>
          <div className="goal-stats">
            <div className="goal-progress-circle">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={yearlyProgressData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {yearlyProgressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} books`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="goal-progress-text">
                <div className="progress-percentage">{goalProgress.yearly.percentage}%</div>
                <div className="progress-fraction">{goalProgress.yearly.current} / {goalProgress.yearly.target}</div>
              </div>
            </div>
            <div className="goal-info">
              <p>
                You've read <strong>{goalProgress.yearly.current} books</strong> so far this year out of your goal of <strong>{goalProgress.yearly.target} books</strong>.
              </p>
              <p>
                At your current pace, you're projected to read <strong>{yearlyPrediction} books</strong> this year.
              </p>
              <p className="goal-status">
                {yearlyPrediction >= goalProgress.yearly.target 
                  ? <span className="on-track">You're on track to meet your goal!</span>
                  : <span className="behind">You're behind your goal by {goalProgress.yearly.target - yearlyPrediction} books.</span>
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="goal-card monthly-goal">
          <h2>Monthly Goal</h2>
          <div className="goal-stats">
            <div className="current-month-progress">
              <h3>{monthNames[currentMonth]} Progress</h3>
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${Math.min(100, goalProgress.monthly.percentage)}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  {goalProgress.monthly.current} of {goalProgress.monthly.target} books
                  ({goalProgress.monthly.percentage}%)
                </div>
              </div>
            </div>
            <div className="monthly-chart">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="goal" fill="#e0e0e0" name="Monthly Goal" />
                  <Bar dataKey="actual" fill="#4CAF50" name="Books Read" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      <div className="set-goals-section">
        <h2>Set Your Reading Goals</h2>
        <div className="goals-container">
          <div className="suggested-goals">
            <h3>Suggested Goals Based on Your History</h3>
            <div className="suggested-goals-cards">
              <div className="suggested-goal-card easy">
                <h4>Easy</h4>
                <div className="suggested-value">{suggestedGoals.easy}</div>
                <p>books per year</p>
                <button 
                  className="use-goal-button"
                  onClick={() => handleSuggestedGoal('easy')}
                >
                  Use This Goal
                </button>
              </div>
              
              <div className="suggested-goal-card moderate">
                <h4>Moderate</h4>
                <div className="suggested-value">{suggestedGoals.moderate}</div>
                <p>books per year</p>
                <button 
                  className="use-goal-button"
                  onClick={() => handleSuggestedGoal('moderate')}
                >
                  Use This Goal
                </button>
              </div>
              
              <div className="suggested-goal-card challenging">
                <h4>Challenging</h4>
                <div className="suggested-value">{suggestedGoals.challenging}</div>
                <p>books per year</p>
                <button 
                  className="use-goal-button"
                  onClick={() => handleSuggestedGoal('challenging')}
                >
                  Use This Goal
                </button>
              </div>
            </div>
          </div>
          
          <div className="custom-goals">
            <h3>Set Custom Goals</h3>
            <form onSubmit={handleSubmit} className="goals-form">
              <div className="form-group">
                <label htmlFor="yearlyGoal">Yearly Goal (books per year)</label>
                <input
                  type="number"
                  id="yearlyGoal"
                  name="yearlyGoal"
                  min="1"
                  value={newGoals.yearlyGoal}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="monthlyGoal">Monthly Goal (books per month)</label>
                <input
                  type="number"
                  id="monthlyGoal"
                  name="monthlyGoal"
                  min="1"
                  value={newGoals.monthlyGoal}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="pagesGoal">Pages Goal (pages per year)</label>
                <input
                  type="number"
                  id="pagesGoal"
                  name="pagesGoal"
                  min="1"
                  value={newGoals.pagesGoal}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <button type="submit" className="save-goals-button">
                Save Goals
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <div className="goals-tips">
        <h2>Reading Goal Tips</h2>
        <div className="tips-cards">
          <div className="tip-card">
            <h3>Set Realistic Goals</h3>
            <p>Look at your reading history to set goals you can actually achieve. Your historical average is {stats.readingPace.booksPerYear.toFixed(1)} books per year.</p>
          </div>
          
          <div className="tip-card">
            <h3>Break It Down</h3>
            <p>A yearly goal of {newGoals.yearlyGoal} books means reading about {(newGoals.yearlyGoal / 52).toFixed(1)} books per week.</p>
          </div>
          
          <div className="tip-card">
            <h3>Track Monthly</h3>
            <p>Aim for {newGoals.monthlyGoal} books each month to stay on track with your yearly goal.</p>
          </div>
          
          <div className="tip-card">
            <h3>Balance Quality & Quantity</h3>
            <p>Remember that the number of books is just one metric. Quality and enjoyment matter too!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Goals;