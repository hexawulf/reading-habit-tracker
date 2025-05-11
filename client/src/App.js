import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ReadingDataProvider } from './context/ReadingDataContext';
import './App.css';

// Import components
import Auth from './components/Auth';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import FileUpload from './components/FileUpload'; // Added FileUpload import

// Import pages
import Dashboard from './pages/Dashboard';
import YearlyProgress from './pages/YearlyProgress';
import MonthlyProgress from './pages/MonthlyProgress';
import RecentBooks from './pages/RecentBooks';
import Goals from './pages/Goals';
import TopAuthors from './pages/TopAuthors';
import ReadingStats from './pages/ReadingStats';
import DataManagement from './pages/DataManagement';
import Account from './components/Account';
import Settings from './pages/Settings';
import AuthorBooks from './pages/AuthorBooks';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ReadingDataProvider>
        <div className="app">
          <Header toggleSidebar={toggleSidebar} />
          <div className="main-content">
            <Sidebar />
            <div className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/monthly-progress" element={<MonthlyProgress />} />
              <Route path="/yearly-progress" element={<YearlyProgress />} />
              <Route path="/recent-books" element={<RecentBooks />} />
              <Route path="/top-authors" element={<TopAuthors />} />
              <Route path="/data-management" element={<DataManagement />} />
              <Route path="/upload" element={<FileUpload />} />
              <Route path="/account" element={<Account />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/reading-stats" element={<ReadingStats />} />
              <Route path="/author/:name" element={<AuthorBooks />} />
            </Routes>
          </div>
        </div>
        <Footer />
      </div>
      </ReadingDataProvider>
    </Router>
  );
}

export default App;