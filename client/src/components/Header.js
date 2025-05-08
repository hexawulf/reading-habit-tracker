import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import Auth from './Auth';

const Header = ({ toggleSidebar }) => {
  const [showOptions, setShowOptions] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPicture');
    window.location.href = '/'; // Redirect to home after logout
  };

  const userName = localStorage.getItem('userName');
  const userPhoto = localStorage.getItem('userPicture');
  const isAuthenticated = localStorage.getItem('isAuthenticated');

  const handleAvatarClick = () => {
    // If NOT logged in, just open the Auth modal
    if (!isAuthenticated) {
      setShowOptions(true);
      return;
    }
    // If logged in, toggle the dropdown
    setShowOptions(prev => !prev);
  };

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
          <div className="user-menu" onClick={handleAvatarClick}>
            <div className="user-avatar">
              {userPhoto ? <img src={userPhoto} alt="User" /> : '👤'}
            </div>
            <span className="user-name">{userName || 'My Account'}</span>
          </div>
          {showOptions && localStorage.getItem('isAuthenticated') && (
            <div className="dropdown-menu">
              <a href="/account" className="dropdown-item">
                <span>📊</span> My Data
              </a>
              <a href="/settings" className="dropdown-item">
                <span>⚙️</span> Settings
              </a>
              <div className="dropdown-item" onClick={handleLogout} style={{cursor: 'pointer'}}>
                <span>🚪</span> Logout
              </div>
            </div>
          )}
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