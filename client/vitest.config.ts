import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// vitest.config imports the function-form Vite config; resolve it as a build
// so the dev-server proxy guard does not run during unit tests.
const resolvedViteConfig =
  typeof viteConfig === 'function'
    ? viteConfig({ command: 'build', mode: 'test' })
    : viteConfig;

// Vitest runs the 4 client component tests (RH-07 / RH-14): jsdom environment,
// Testing Library + @testing-library/jest-dom matchers via the setup file.
export default mergeConfig(
  resolvedViteConfig,
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
