import { defineConfig, type UserConfig } from 'vite';
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

const DEFAULT_API_PROXY = 'http://127.0.0.1:5093';
const LIVE_PROD_PORT = '5003';

// Refuse to proxy the Vite dev server at the live piapps port unless the
// operator explicitly opts in. :5003 is the production PM2 process.
export function assertViteProxyTarget(command: string, target: string) {
  if (command !== 'serve') return;
  let port = '';
  try {
    port = new URL(target).port;
    if (!port) {
      port = new URL(target).protocol === 'https:' ? '443' : '80';
    }
  } catch {
    throw new Error(
      `Invalid VITE_API_PROXY target. Use a URL such as ${DEFAULT_API_PROXY}.`,
    );
  }
  if (port === LIVE_PROD_PORT && process.env.ALLOW_PROD_PROXY !== '1') {
    throw new Error(
      'Refusing to start the Vite dev server: the /api proxy target ' +
        `uses port ${LIVE_PROD_PORT}, which is the live production process ` +
        'on piapps. Point VITE_API_PROXY at a non-production port ' +
        `(default ${DEFAULT_API_PROXY}) or set ALLOW_PROD_PROXY=1 only if ` +
        'you are talking to a local API on a laptop, never in the live clone.',
    );
  }
}

// RH-07: the client is built by Vite (was Create React App / react-scripts).
// - Build output stays in client/build because server.js serves client/build.
// - envPrefix exposes both VITE_* and the legacy REACT_APP_* names, so the
//   existing client/.env on piapps (REACT_APP_FIREBASE_*) keeps working.
// - Dev server runs on port 3000 and proxies /api to VITE_API_PROXY
//   (default 127.0.0.1:5093). Port 5003 is refused unless ALLOW_PROD_PROXY=1.
export default defineConfig(({ command }) => {
  const proxyTarget = process.env.VITE_API_PROXY || DEFAULT_API_PROXY;
  assertViteProxyTarget(command, proxyTarget);

  const config: UserConfig = {
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
        // client/src/lib/stats.js re-exports ../../../shared/stats.js
        allow: ['../shared'],
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
  return config;
});
