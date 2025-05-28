import React from 'react';
import './AboutModal.css';

const AboutModal = ({ onClose }) => {
  return (
    <div className="about-modal-overlay">
      <div className="about-modal">
        <button
          className="about-modal-close-button"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

        <h2>About Reading Habit Tracker</h2>
        <p>A web application for tracking and visualizing your reading habits using Goodreads export data.</p>

        <p>Version 1.0.0</p>
        <p>Released: May 2025</p>

        <h3>Overview</h3>
        <p>
          Reading Habit Tracker allows you to upload your Goodreads library export CSV and provides insightful visualizations and statistics about your reading history. It's a privacy-friendly, client-focused tool that runs entirely in your browser.
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
          <li><strong>Frontend:</strong> React, React Router, Recharts</li>
          <li><strong>Backend:</strong> Node.js, Express</li>
          <li><strong>Data Processing:</strong> CSV Parser, Day.js</li>
          <li><strong>Styling:</strong> Custom CSS</li>
        </ul>

        <h3>Contact</h3>
        <p>Author: 0xWulf</p>
        <p>
          Email: <a href="mailto:dev@0xwulf.dev">dev@0xwulf.dev</a>
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
