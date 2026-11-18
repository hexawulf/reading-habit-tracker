
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ReadingDataProvider } from './context/ReadingDataContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ReadingDataProvider>
      <App />
    </ReadingDataProvider>
  </React.StrictMode>
);
