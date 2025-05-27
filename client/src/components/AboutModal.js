import React from 'react';
import './AboutModal.css';

const AboutModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">About TableTamer</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">A browser-based CSV visualization and transformation tool</p>
          
          <div className="mt-4 px-7 py-3 text-left">
            <p className="text-xs text-gray-700 dark:text-gray-300">TableTamer v1.0.0</p>
            <p className="text-xs text-gray-700 dark:text-gray-300">Released: May 2025</p>

            <div className="my-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overview</h3>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                TableTamer is a browser-based CSV visualization and transformation tool that converts raw CSV data into beautiful, interactive tables. The application is fully client-side with no backend requirements.
              </p>
            </div>

            <div className="my-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Key Features</h3>
              <ul className="mt-2 list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                <li>Drag-and-drop CSV file upload</li>
                <li>Interactive table with sorting, filtering, and pagination</li>
                <li>Column visibility management</li>
                <li>Cell editing with text transformations</li>
                <li>Export to CSV and JSON formats</li>
                <li>Light/dark theme support</li>
                <li>Keyboard shortcuts for power users</li>
                <li>Local storage persistence</li>
              </ul>
            </div>

            <div className="my-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Technology</h3>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Built with React, TailwindCSS, PapaParse, and FileSaver.js.
              </p>
            </div>

            <div className="my-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact</h3>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Author: 0xWulf</p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                Email: <a href="mailto:dev@0xwulf.dev" className="text-blue-500 hover:underline">dev@0xwulf.dev</a>
              </p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                GitHub: <a href="https://github.com/hexawulf/reading-habit-tracker" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">reading-habit-tracker</a>
              </p>
            </div>
          </div>
          <div className="items-center px-4 py-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
