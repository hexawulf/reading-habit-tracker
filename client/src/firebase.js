// client/src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Log actual env values for debugging (Vite should replace these)
console.log('Attempting to load Firebase config with these values from client/src/firebase.js:');
console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
// Add other VITE_FIREBASE_... vars if needed for direct logging

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized a new app in client/src/firebase.js.');
} else {
  app = getApp(); // Use existing app if already initialized
  console.log('Firebase using existing app in client/src/firebase.js.');
}

const auth = getAuth(app);

// Log to confirm whether the API key was loaded after initialization attempt
console.log("🔥 Firebase App Name (from client/src/firebase.js):", app.name);
console.log("🔥 API Key from firebaseConfig object (in client/src/firebase.js):", firebaseConfig.apiKey);

export { app, auth }; // Export auth and app
