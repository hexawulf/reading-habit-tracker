
// client/src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(false)}
      />
      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        <nav className="sidebar-nav">
          <NavLink to="/" className="nav-item" end>
            Dashboard
          </NavLink>
          <NavLink to="/yearly-progress" className="nav-item">
            Yearly Progress
          </NavLink>
          <NavLink to="/monthly-progress" className="nav-item">
            Monthly Progress
          </NavLink>
          <NavLink to="/reading-stats" className="nav-item">
            Reading Stats
          </NavLink>
          <NavLink to="/recent-books" className="nav-item">
            Recent Books
          </NavLink>
          <NavLink to="/top-authors" className="nav-item">
            Top Authors
          </NavLink>
          <NavLink to="/data-management" className="nav-item">
            Data Management
          </NavLink>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
