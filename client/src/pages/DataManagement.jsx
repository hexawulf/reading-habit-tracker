// client/src/pages/DataManagement.js
import React from 'react';
import DataManagementComponent from '../components/DataManagement';
import './DataManagement.css';

const DataManagementPage = () => {
  return (
    <div className="data-management-page">
      <h1>Data Management</h1>
      
      <DataManagementComponent />
      
      <div className="data-privacy-info">
        <h2>Privacy Information</h2>
        <p>
          The Reading Habit Tracker stores all your data locally on your device. 
          We do not collect, store, or share any of your reading data on our servers.
        </p>
        <p>
          To ensure you don't lose your data, we recommend regularly exporting a backup 
          using the export function above.
        </p>
      </div>
    </div>
  );
};

export default DataManagementPage;