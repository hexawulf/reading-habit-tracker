
import React from 'react';
import './Settings.css';

const Settings = () => {
  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <div className="settings-container">
        <div className="settings-card">
          <h2>Coming Soon!</h2>
          <p>User preferences and customization options will be available here shortly.</p>
          <ul className="upcoming-features">
            <li>🌓 Dark Mode</li>
            <li>⚙️ Account Preferences</li>
            <li>📱 Display Options</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
