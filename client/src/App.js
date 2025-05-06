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

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ReadingDataProvider>
        <div className="app">
        {!localStorage.getItem('user') ? (
          <Auth />
        ) : (
          <>
            <Header toggleSidebar={toggleSidebar} />
        <div className="main-content">
          <Sidebar />
          <div className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/yearly-progress" element={<YearlyProgress />} />
              <Route path="/monthly-progress" element={<MonthlyProgress />} />
              <Route path="/reading-stats" element={<ReadingStats />} />
              <Route path="/recent-books" element={<RecentBooks />} />
              <Route path="/top-authors" element={<TopAuthors />} />
              <Route path="/data-management" element={<DataManagement />} />
              <Route path="/upload" element={<FileUpload />} />
            </Routes>
          </div>
        </div>
        <Footer />
          </>
        )}
      </div>
      </ReadingDataProvider>
    </Router>
  );
}

export default App;