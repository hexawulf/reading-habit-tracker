import React, { useEffect } from 'react';
import './AboutModal.css';

const AboutModal = ({ onClose }) => {
  // Close on Escape for keyboard accessibility.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="about-modal-overlay">
      <div className="about-modal" role="dialog" aria-modal="true" aria-label="About Reading Habit Tracker">
        <button
          className="about-modal-close-button"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

        <h2>About Reading Habit Tracker</h2>
        <p>A web application for tracking and visualizing your reading habits using Goodreads export data.</p>

        <p>Version 1.2.0</p>
        <p>Released: November 2026</p>

        <h3>Overview</h3>
        <p>
          Reading Habit Tracker allows you to upload your Goodreads library export CSV and provides insightful visualizations and statistics about your reading history. Your CSV is parsed in memory and never stored on the server. Your data stays in your browser, and if you sign in, it is saved to your own account so you can see it on other devices.
        </p>

        <h3>✨ Features</h3>
        <ul>
          <li>Direct Goodreads CSV Import</li>
          <li>Comprehensive Dashboard for quick overviews</li>
          <li>Yearly and Monthly Reading Goal Tracking</li>
          <li>Interactive Charts & Graphs for in-depth analysis</li>
          <li>Top Author & Genre Statistics</li>
          <li>Reading Pace & Progress Insights</li>
          <li>Fully Responsive Design (Desktop & Mobile)</li>
          <li>Optional sign-in (Google or email) to keep your data in your account</li>
        </ul>

        <h3>📤 How to Get Your Goodreads Data</h3>
        <ol className="list-decimal ml-6">
          <li>Log in to your Goodreads account</li>
          <li>Navigate to <strong>My Books</strong></li>
          <li>Click on <strong>Import and Export</strong> in the bottom left sidebar</li>
          <li>Select <strong>Export Library</strong></li>
          <li>Download the CSV file and upload it to this app</li>
        </ol>

        <h3>🛠️ Tech Stack</h3>
        <ul>
          <li><strong>Frontend:</strong> React, React Router, Recharts, Chart.js, Vite</li>
          <li><strong>Backend:</strong> Node.js, Express, MongoDB (Mongoose)</li>
          <li><strong>Auth:</strong> Firebase (Google sign-in), sessions</li>
          <li><strong>Security:</strong> Helmet (CSP), rate limiting</li>
          <li><strong>Data Processing:</strong> CSV Parser, Day.js</li>
          <li><strong>Styling:</strong> Custom CSS</li>
        </ul>

        <h3>What's new in 1.2.0</h3>
        <ul>
          <li>Faster builds: the app now uses Vite instead of Create React App</li>
          <li>The client component tests run again (and pass) in continuous integration</li>
          <li>Google Fonts load correctly again (the content security policy allows them)</li>
          <li>Security updates across the client dependencies</li>
        </ul>

        <h3>Contact</h3>
        <p>
          <strong>Developer</strong>
          <br />
          Erling Wulf Weinreich (0xWulf) ·{' '}
          <a href="mailto:dev@0xwulf.dev">dev@0xwulf.dev</a>
        </p>
        <p>
          GitHub:{' '}
          <a
            href="https://github.com/hexawulf/reading-habit-tracker"
            target="_blank"
            rel="noopener noreferrer"
          >
            reading-habit-tracker
          </a>
        </p>
      </div>
    </div>
  );
};

export default AboutModal;
