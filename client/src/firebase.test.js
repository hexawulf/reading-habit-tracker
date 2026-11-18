import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Prove the Firebase web config is read from import.meta.env using the
// REACT_APP_ prefix (RH-07 envPrefix wiring). We stub fake env values and mock
// the Firebase SDK so initializeApp receives exactly the config object, then
// assert each field maps to its REACT_APP_FIREBASE_* variable.
const initializeApp = vi.fn(() => ({ name: 'test-app' }));

vi.mock('firebase/app', () => ({
  initializeApp: (config) => initializeApp(config),
  getApps: () => [],
  getApp: () => ({ name: 'test-app' }),
}));

vi.mock('firebase/auth', () => ({
  getAuth: () => ({}),
}));

// Obvious fakes — never real Firebase values.
const FAKE = {
  REACT_APP_FIREBASE_API_KEY: 'AIzaFAKE-apikey',
  REACT_APP_FIREBASE_AUTH_DOMAIN: 'fake.firebaseapp.com',
  REACT_APP_FIREBASE_PROJECT_ID: 'fake-project',
  REACT_APP_FIREBASE_STORAGE_BUCKET: 'fake.appspot.com',
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  REACT_APP_FIREBASE_APP_ID: '1:000000000000:web:fakeappid',
};

describe('firebase.js config', () => {
  beforeEach(() => {
    vi.resetModules();
    initializeApp.mockClear();
    Object.entries(FAKE).forEach(([k, v]) => vi.stubEnv(k, v));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('reads every config field from import.meta.env REACT_APP_FIREBASE_*', async () => {
    await import('./firebase.js');

    expect(initializeApp).toHaveBeenCalledTimes(1);
    const config = initializeApp.mock.calls[0][0];

    expect(config).toEqual({
      apiKey: FAKE.REACT_APP_FIREBASE_API_KEY,
      authDomain: FAKE.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: FAKE.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: FAKE.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: FAKE.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: FAKE.REACT_APP_FIREBASE_APP_ID,
    });
  });
});
