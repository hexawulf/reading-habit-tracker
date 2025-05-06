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

const Auth = ({ onClose }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

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

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        setIsRegistering(false);
        setError('');
        // Auto-login after registration
        handleUsernameLogin(e);
      } else {
        const data = await response.json();
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
    }
  };

  const handleReplitLogin = () => {
    window.addEventListener("message", (e) => {
      if (e.data === "auth_complete") {
        window.location.reload();
      }
    });
    window.open("https://replit.com/auth_with_repl_site?domain=" + location.host, "_blank");
  };

  return (
    <div className="auth-container">
      <h2>Reading Habit Tracker</h2>
      {!showOptions ? (
        <div className="auth-buttons">
          <button onClick={() => setShowOptions(true)} className="login-btn">
            Login
          </button>
          <button onClick={() => {setShowOptions(true); setIsRegistering(true);}} className="register-btn">
            Register
          </button>
        </div>
      ) : (
        <div className="auth-options">
          <button onClick={handleReplitLogin} className="replit-btn">
            Login with Replit
          </button>

          <div className="auth-separator">
            <span>or</span>
          </div>

          <button onClick={handleGoogleLogin} className="google-btn">
            Sign in with Google
          </button>

          <div className="auth-separator">
            <span>or</span>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleUsernameLogin} className="login-form">
            {error && <div className="error-message">{error}</div>}
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
              {isRegistering ? 'Register' : 'Sign in with Username'}
            </button>
          </form>
          <button 
            onClick={() => setIsRegistering(!isRegistering)} 
            className="toggle-auth-btn"
          >
            {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Auth;