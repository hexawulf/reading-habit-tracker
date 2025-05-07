
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Account.css';

const Account = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await axios.get('/api/files/list');
      setFiles(response.data.files);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch files');
      setLoading(false);
    }
  };

  const handleDelete = async (filename) => {
    try {
      await axios.delete(`/api/files/delete/${filename}`);
      fetchFiles(); // Refresh the list
    } catch (err) {
      setError('Failed to delete file');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="account-container">
      <h2>My Account</h2>
      <div className="files-section">
        <h3>My Uploaded Files</h3>
        {files.length === 0 ? (
          <p>No files uploaded yet</p>
        ) : (
          <div className="files-list">
            {files.map((file) => (
              <div key={file.name} className="file-item">
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-date">
                    {new Date(file.uploadDate).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(file.name)}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Account;
