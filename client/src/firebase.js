// client/src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Use debug level logging to avoid cluttering the console in production
// and prevent accidental exposure of sensitive environment variables.
// eslint-disable-next-line no-console
console.debug("Initializing Firebase with provided environment configuration");

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
  // eslint-disable-next-line no-console
  console.info("✅ Firebase initialized a new app.");
} else {
  app = getApp();
  // eslint-disable-next-line no-console
  console.info("ℹ️ Firebase using existing app.");
}

const auth = getAuth(app);

// Final sanity check
// eslint-disable-next-line no-console
console.info("🔥 Firebase App Name:", app.name);
// eslint-disable-next-line no-console
console.info("🔥 Firebase API Key used:", firebaseConfig.apiKey);

export { app, auth };
