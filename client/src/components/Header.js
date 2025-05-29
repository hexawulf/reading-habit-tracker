import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import Auth from './Auth';
import AboutModal from './AboutModal';
import { FiInfo, FiGithub, FiUser, FiLogOut, FiSettings, FiDatabase, FiSun, FiMoon } from 'react-icons/fi'; // Added icons

const Header = () => { // Removed toggleSidebar prop
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const dropdownRef = useRef(null);

  // Effect to apply theme class to body and save to localStorage
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    // No need to directly manipulate localStorage or body class here, useEffect handles it.
  };

  const toggleAboutModal = () => {
    setShowAboutModal(prev => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPicture');
    setShowUserDropdown(false); // Close dropdown
    window.location.href = '/'; 
  };

  const userName = localStorage.getItem('userName');
  const userPhoto = localStorage.getItem('userPicture');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'; // Ensure boolean comparison

  const handleUserIconClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      setShowUserDropdown(false); // Ensure dropdown is closed
    } else {
      setShowUserDropdown(prev => !prev);
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);


  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="logo">
          <img src="/generated-icon.png" alt="Reading Habit Tracker" className="header-logo" />
          <h1>Reading Tracker</h1> {/* Simplified title */}
        </Link>
        
        <nav className="header-nav-items"> {/* Renamed class for clarity */}
          <span 
            className="nav-link about-icon" 
            onClick={toggleAboutModal} 
            title="About Reading Tracker"
          >
            <FiInfo />
          </span>
          <span 
            className="nav-link theme-toggle-icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{ cursor: 'pointer', marginLeft: '10px' }} 
          >
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </span>
          <a
            href="https://github.com/hexawulf/reading-habit-tracker" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="nav-link"
            title="GitHub Repository"
          >
            <FiGithub /> <span className="nav-link-text">GitHub</span>
          </a>
          
          <div className="user-menu" ref={dropdownRef}>
            <button className="user-avatar-button" onClick={handleUserIconClick} title={isAuthenticated ? userName : "Account"}>
              {isAuthenticated && userPhoto ? (
                <img src={userPhoto} alt={userName || "User"} className="user-avatar-img" />
              ) : (
                <FiUser className="user-avatar-icon" />
              )}
              {isAuthenticated && <span className="user-name-display">{userName}</span>}
            </button>

            {isAuthenticated && showUserDropdown && (
              <div className="dropdown-menu">
                <Link to="/account" className="dropdown-item" onClick={() => setShowUserDropdown(false)}>
                  <FiDatabase /> My Data
                </Link>
                <Link to="/settings" className="dropdown-item" onClick={() => setShowUserDropdown(false)}>
                  <FiSettings /> Settings
                </Link>
                <div className="dropdown-item" onClick={handleLogout} style={{cursor: 'pointer'}}>
                  <FiLogOut /> Logout
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>

      {showAuthModal && !isAuthenticated && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <Auth onClose={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}
      {showAboutModal && (
        <AboutModal onClose={toggleAboutModal} />
      )}
    </header>
  );
};

export default Header;