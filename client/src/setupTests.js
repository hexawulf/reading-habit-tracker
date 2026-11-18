// Vitest setup: register @testing-library/jest-dom matchers (toBeInTheDocument,
// toHaveAttribute, toHaveTextContent, ...) and auto-clean the DOM after each test.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
