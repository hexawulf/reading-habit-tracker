
// client/src/components/Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiTrendingUp,
  FiCalendar,
  FiBarChart2,
  FiBookOpen,
  FiUsers,
  FiSettings,
  FiTarget, // Added for Goals
  FiUploadCloud // Added for Upload
} from 'react-icons/fi';
import './Sidebar.css';

const navItems = [
  { to: "/", title: "Dashboard", icon: <FiGrid />, end: true },
  { to: "/yearly-progress", title: "Yearly Progress", icon: <FiTrendingUp /> },
  { to: "/monthly-progress", title: "Monthly Progress", icon: <FiCalendar /> },
  { to: "/reading-stats", title: "Reading Stats", icon: <FiBarChart2 /> },
  { to: "/recent-books", title: "Recent Books", icon: <FiBookOpen /> },
  { to: "/top-authors", title: "Top Authors", icon: <FiUsers /> },
  { to: "/upload", title: "Upload Data", icon: <FiUploadCloud /> }, // Link to upload page
  { to: "/data-management", title: "Data Management", icon: <FiSettings /> },
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="nav-item"
            title={item.title} // For tooltip
            end={item.end}
          >
            <span className="icon">{item.icon}</span>
            <span className="nav-text">{item.title}</span> 
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
