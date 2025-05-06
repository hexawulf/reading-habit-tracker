
import React, { useState } from 'react';
import './Auth.css';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

let app;
let auth;
let googleProvider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.error('Firebase initialization error:', error);
}

const Auth = () => {
  const [showOptions, setShowOptions] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: result.user.accessToken })
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Google auth error:', error);
    }
  };

  const handleUsernameLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Reading Habit Tracker</h2>
      {!showOptions ? (
        <button onClick={() => setShowOptions(true)} className="login-btn">
          Login
        </button>
      ) : (
        <div className="auth-options">
          <div className="auth-button">
            <script src="https://auth.util.repl.co/script.js" authed="location.reload()"></script>
          </div>
          
          <div className="auth-separator">
            <span>or</span>
          </div>
          
          <button onClick={handleGoogleLogin} className="google-btn">
            Sign in with Google
          </button>

          <div className="auth-separator">
            <span>or</span>
          </div>

          <form onSubmit={handleUsernameLogin} className="login-form">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="username-btn">
              Sign in with Username
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Auth;
