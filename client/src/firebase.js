// client/src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Log actual env values for debugging
console.log("Attempting to load Firebase config from process.env:");
console.log("REACT_APP_FIREBASE_API_KEY:", process.env.REACT_APP_FIREBASE_API_KEY);
console.log("REACT_APP_FIREBASE_AUTH_DOMAIN:", process.env.REACT_APP_FIREBASE_AUTH_DOMAIN);
console.log("REACT_APP_FIREBASE_PROJECT_ID:", process.env.REACT_APP_FIREBASE_PROJECT_ID);

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized a new app.");
} else {
  app = getApp();
  console.log("ℹ️ Firebase using existing app.");
}

const auth = getAuth(app);

// Final sanity check
console.log("🔥 Firebase App Name:", app.name);
console.log("🔥 Firebase API Key used:", firebaseConfig.apiKey);

export { app, auth };
