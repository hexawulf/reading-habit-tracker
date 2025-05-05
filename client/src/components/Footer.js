// client/src/components/Footer.js
import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>Reading Habit Tracker &copy; {new Date().getFullYear()}</p>
        <p>
          <a href="https://github.com/hexawulf/reading-habit-tracker" 
             target="_blank" 
             rel="noopener noreferrer">
            GitHub Repository
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;