import React from 'react';
import './Auth.css';

const Auth = () => {
  return (
    <div className="auth-container">
      <h2>Authentication Required</h2>
      <p>Please login with your Replit account to continue.</p>
      <div className="auth-button">
        <script src="https://auth.util.repl.co/script.js" authed="location.reload()"></script>
      </div>
    </div>
  );
};

export default Auth;