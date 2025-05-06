
import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <button 
          className="menu-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <Link to="/" className="logo">
          <img src="/generated-icon.png" alt="Reading Habit Tracker" className="header-logo" />
          <h1>Reading Habit Tracker</h1>
        </Link>
        <nav className="nav-links">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/upload" className="nav-link">Upload Data</Link>
          <a 
            href="https://github.com/hexawulf/reading-habit-tracker" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="nav-link"
          >
            GitHub
          </a>
          <div className="auth-container">
            <script src="https://auth.util.repl.co/script.js" authed="location.reload()"></script>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
