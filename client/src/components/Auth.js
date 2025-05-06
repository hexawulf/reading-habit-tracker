
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

// Initialize Firebase
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
