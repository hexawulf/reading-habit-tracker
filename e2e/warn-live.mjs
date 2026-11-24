// Prints an explicit hazard warning before the live Playwright suite runs.
console.warn(
  '\nWARNING: npm run test:e2e:live targets the live site ' +
    'https://mybooks.piapps.dev. This suite is guest-only and must not ' +
    'sign in or write to any user account.\n',
);
