import React, { useState } from 'react';
import './Auth.css';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

// ✅ Firebase config using Vite env vars
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// ✅ Initialize Firebase (only if not already initialized)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const Auth = ({ onClose }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!result?.user?.accessToken) {
        setError('Google login failed - no access token received');
        return;
      }

      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: result.user.accessToken })
      });

      if (response.ok) {
        localStorage.setItem('userPicture', result.user.photoURL);
        localStorage.setItem('userName', result.user.displayName);
        localStorage.setItem('userEmail', result.user.email);
        localStorage.setItem('isAuthenticated', 'true');
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to authenticate with server');
      }
    } catch (error) {
      if (error.code === 'auth/unauthorized-domain') {
        setError('Google login is not set up for this domain yet. Please use username/password login.');
      } else if (['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(error.code)) {
        setError('');
      } else {
        setError('Unable to login with Google. Please try username/password instead.');
      }
    }
  };

  const handleUsernameLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Login failed');
      }
    } catch {
      alert('Login failed. Please try again.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        setError('');
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        if (loginResponse.ok) {
          window.location.reload();
        } else {
          setError('Registration successful but login failed. Please try logging in.');
          setIsRegistering(false);
        }
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Registration failed. Please try again.');
    }
  };

  const handleReplitLogin = () => {
    window.addEventListener("message", (e) => {
      if (e.data === "auth_complete") {
        window.location.reload();
      }
    });
    window.open(`https://replit.com/auth_with_repl_site?domain=${window.location.host}`, "_blank");
  };

  return (
    <div className="auth-container">
      <h2>Reading Habit Tracker</h2>
      {!showOptions ? (
        <div className="auth-buttons">
          <button onClick={() => setShowOptions(true)} className="login-btn">Login</button>
          <button onClick={() => { setShowOptions(true); setIsRegistering(true); }} className="register-btn">Register</button>
        </div>
      ) : (
        <div className="auth-options">
          <button onClick={handleReplitLogin} className="replit-btn">Login with Replit</button>
          <div className="auth-separator"><span>or</span></div>
          <button onClick={handleGoogleLogin} className="google-btn">Sign in with Google</button>
          <div className="auth-separator"><span>or</span></div>
          <form onSubmit={isRegistering ? handleRegister : handleUsernameLogin} className="login-form">
            {error && <div className="error-message">{error}</div>}
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className="username-btn">
              {isRegistering ? 'Register' : 'Sign in with Username'}
            </button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="toggle-auth-btn">
            {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Auth;
