import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Vitest runs the 4 client component tests (RH-07 / RH-14): jsdom environment,
// Testing Library + @testing-library/jest-dom matchers via the setup file.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
      css: false,
      include: ['src/**/*.test.{js,jsx}'],
    },
  }),
);
