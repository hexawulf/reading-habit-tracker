// Flat ESLint config for the server (CommonJS) and its Jest tests.
// The client has its own tooling (react-scripts / Vite) and is linted there.
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'client/**',
      'node_modules/**',
      'logs/**',
      'uploads/**',
      'coverage/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
];
