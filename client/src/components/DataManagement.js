// client/src/components/DataManagement.js
import React, { useState } from 'react';
import { useReadingData } from '../context/ReadingDataContext';
import './DataManagement.css';

const DataManagement = () => {
  const { readingData, stats, goalProgress, processReadingData, clearAllData } = useReadingData();
  const [importError, setImportError] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  
  // Handle export functionality
  const handleExport = () => {
    try {
      // Create export data object
      const exportData = {
        readingData,
        stats,
        goalProgress,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
      
      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Create a Blob
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Setup and trigger download
      link.href = url;
      link.download = `reading-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success message
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setImportError('Failed to export data.');
      setTimeout(() => setImportError(null), 3000);
    }
  };
  
  // Handle import functionality
  const handleImport = (event) => {
    setImportError(null);
    setImportSuccess(false);
    
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setImportError('File is too large. Maximum size is 10MB.');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validate data structure
        if (!importedData.readingData || !Array.isArray(importedData.readingData)) {
          setImportError('Invalid data format. Missing reading data.');
          return;
        }
        
        // Process the imported data
        processReadingData(importedData.readingData);
        
        // Show success message
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
        
        // Reset the file input
        event.target.value = null;
      } catch (error) {
        console.error('Import error:', error);
        setImportError('Failed to import data. The file may be corrupted or in an invalid format.');
      }
    };
    
    reader.onerror = () => {
      setImportError('Error reading file.');
    };
    
    reader.readAsText(file);
  };
  
  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all your reading data? This action cannot be undone.')) {
      clearAllData();
    }
  };
  
  return (
    <div className="data-management">
      <h2>Data Management</h2>
      
      <div className="data-actions">
        <div className="action-card">
          <h3>Export Your Data</h3>
          <p>Download your reading data as a JSON file for backup or transfer.</p>
          <button 
            className="action-button export-button"
            onClick={handleExport}
            disabled={!readingData || readingData.length === 0}
          >
            Export Data
          </button>
          {exportSuccess && <div className="success-message">Data exported successfully!</div>}
        </div>
        
        <div className="action-card">
          <h3>Import Data</h3>
          <p>Import reading data from a previously exported JSON file.</p>
          <label className="file-input-label">
            Choose File
            <input 
              type="file" 
              accept=".json"
              onChange={handleImport}
              className="file-input"
            />
          </label>
          {importError && <div className="error-message">{importError}</div>}
          {importSuccess && <div className="success-message">Data imported successfully!</div>}
        </div>
        
        <div className="action-card danger-zone">
          <h3>Clear All Data</h3>
          <p>Remove all your reading data from this device. This cannot be undone.</p>
          <button 
            className="action-button clear-button"
            onClick={handleClearData}
          >
            Clear Data
          </button>
        </div>
      </div>
      
      <div className="data-info">
        <h3>About Your Data</h3>
        <p>
          Your reading data is stored locally on your device using browser storage. 
          It is not sent to any server or shared with anyone else.
        </p>
        <div className="data-stats">
          <div>Books tracked: <strong>{readingData?.length || 0}</strong></div>
          <div>Storage used: <strong>{calculateStorageSize()} KB</strong></div>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate approximate storage size
const calculateStorageSize = () => {
  try {
    const storageEstimate = JSON.stringify(localStorage).length / 1024;
    return storageEstimate.toFixed(2);
  } catch (error) {
    return '0.00';
  }
};

export default DataManagement;