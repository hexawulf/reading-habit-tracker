
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FileUpload.css';
import { useReadingData } from '../context/ReadingDataContext';

const FileUpload = () => {
  const { processReadingData } = useReadingData();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'text/csv') {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setError('');
      
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.data) {
        processReadingData(response.data.data);
        navigate('/');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.error || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <h1>Upload Your Reading Data</h1>

      <div className="upload-card">
        <h2>Upload Goodreads Export</h2>
        <p>Upload your Goodreads CSV export file to visualize your reading habits.</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="file-input-container">
            <input 
              type="file" 
              id="file" 
              ref={fileInputRef}
              accept=".csv" 
              onChange={handleFileChange}
              className="file-input"
            />
            <button 
              type="button" 
              className="file-button"
              onClick={() => fileInputRef.current.click()}
            >
              Choose CSV File
            </button>
            <span className="file-name">{file ? file.name : 'No file selected'}</span>
          </div>

          <button 
            type="submit" 
            className="upload-button"
            disabled={uploading || !file}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>
      </div>

      <div className="instructions-card">
        <h2>How to Get Your Goodreads Data</h2>
        <ol>
          <li>Log in to your Goodreads account</li>
          <li>Go to "My Books" or visit <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener noreferrer">this page</a></li>
          <li>Click on "Export Library" at the bottom of the page</li>
          <li>Wait for the CSV to be generated and download it</li>
          <li>Upload the downloaded CSV file here</li>
        </ol>
      </div>
    </div>
  );
};

export default FileUpload;
