
import React from 'react';
import './Auth.css';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

// Initialize Firebase with environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
};

// Only initialize if we have the required config
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('Firebase configuration is incomplete. Please check environment variables.');
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const Auth = () => {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Send the token to your backend
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

  return (
    <div className="auth-container">
      <h2>Sign In</h2>
      <p>Choose your preferred login method:</p>
      
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
      </div>
    </div>
  );
};

export default Auth;
