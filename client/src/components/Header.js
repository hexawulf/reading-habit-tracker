
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import Auth from './Auth';

const Header = ({ toggleSidebar }) => {
  const [showOptions, setShowOptions] = useState(false);
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
          <div className="auth-button">
            <button 
              className="login-btn" 
              onClick={() => setShowOptions(true)}
            >
              {localStorage.getItem('userId') || sessionStorage.getItem('userId') ? (
                <>
                  <span className="user-avatar">
                    {localStorage.getItem('userPicture') && 
                      <img src={localStorage.getItem('userPicture')} alt="User" />
                    }
                  </span>
                  <span>My Account</span>
                </>
              ) : 'Login'}
            </button>
          </div>
        </nav>
      </div>
    {showOptions && (
        <div className="auth-modal-overlay" onClick={() => setShowOptions(false)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <Auth onClose={() => setShowOptions(false)} />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
