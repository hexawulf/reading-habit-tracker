// src/safety.js
//
// Guards that keep tests and one-off scripts from touching production data
// or signing sessions with a missing secret. The Mongo helper never logs or
// returns the URI (it may contain credentials).
//
// author: 0xWulf
// description: loopback Mongo URI + SESSION_SECRET guards
// date modified: 2026-11-24

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

const ATLAS_WIPE_WARNING =
  'Refusing to connect or wipe: MONGO_URI is not a loopback mongodb:// URI. ' +
  'Production Atlas data would be deleted.';

function hostnameFromHostPort(hostPort) {
  const trimmed = String(hostPort || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('[')) {
    const end = trimmed.indexOf(']');
    return end === -1 ? '' : trimmed.slice(1, end).toLowerCase();
  }
  return trimmed.split(':')[0].toLowerCase();
}

// Extract hostnames from a mongodb:// URI, including replica-set lists.
// Does not work for mongodb+srv:// (those are rejected before this runs).
function hostsFromMongoUri(uri) {
  const match = String(uri).match(/^mongodb:\/\/(?:[^@/?#]*@)?([^/?#]+)/i);
  if (!match) return [];
  return match[1].split(',').map(hostnameFromHostPort).filter(Boolean);
}

function assertSafeTestMongoUri(uri, options = {}) {
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    const message =
      'Refusing to connect or wipe: NODE_ENV is production. ' +
      'Production Atlas data would be deleted.';
    console.error(message);
    throw new Error(message);
  }
  if (!uri || typeof uri !== 'string') {
    const message =
      'Refusing to connect or wipe: MONGO_URI is missing. ' +
      'Production Atlas data would be deleted if a production .env were loaded.';
    console.error(message);
    throw new Error(message);
  }
  if (/^mongodb\+srv:/i.test(uri)) {
    console.error(ATLAS_WIPE_WARNING);
    throw new Error(ATLAS_WIPE_WARNING);
  }
  if (!/^mongodb:\/\//i.test(uri)) {
    console.error(ATLAS_WIPE_WARNING);
    throw new Error(ATLAS_WIPE_WARNING);
  }
  const hosts = hostsFromMongoUri(uri);
  if (hosts.length === 0 || hosts.some((host) => !LOOPBACK_HOSTS.has(host))) {
    console.error(ATLAS_WIPE_WARNING);
    throw new Error(ATLAS_WIPE_WARNING);
  }
}

function assertSessionSecret(secret = process.env.SESSION_SECRET) {
  if (!secret) {
    throw new Error('SESSION_SECRET is not set');
  }
}

module.exports = {
  assertSafeTestMongoUri,
  assertSessionSecret,
  ATLAS_WIPE_WARNING,
};
