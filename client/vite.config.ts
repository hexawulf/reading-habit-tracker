import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Expose the repo-root CommonJS shared/stats.js as ESM for Vite dev, build, and Vitest.
function sharedStatsCjsToEsm() {
  return {
    name: 'shared-stats-cjs-to-esm',
    transform(code: string, id: string) {
      if (!/[\\/]shared[\\/]stats\.js(?:\?.*)?$/.test(id)) return null;
      return code.replace(/module\.exports\s*=\s*\{([^}]+)\};?/, 'export {$1};');
    },
  };
}

// RH-07: the client is built by Vite (was Create React App / react-scripts).
// - Build output stays in client/build because server.js serves client/build.
// - envPrefix exposes both VITE_* and the legacy REACT_APP_* names, so the
//   existing client/.env on piapps (REACT_APP_FIREBASE_*) keeps working.
// - Dev server runs on port 3000 and proxies /api to the Express server.
export default defineConfig({
  plugins: [react(), sharedStatsCjsToEsm()],
  publicDir: 'public',
  envPrefix: ['VITE_', 'REACT_APP_'],
  build: {
    outDir: 'build',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    fs: {
      allow: ['..'],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5003',
        changeOrigin: true,
      },
    },
  },
});
