# Changelog

## [Unreleased]

### Changed
- UI recolor to the canonical 0xWulf teal palette shared with PiDeck, PiTasker,
  and CodePatchwork: slate surfaces, teal-700 actions (white text),
  teal-400 links in dark mode, and teal-700 links in light mode.
- Logo and favicons are the rounded teal tile with the MB mark
  (`#14B8A6` → `#0D9488`). `theme-color` is `#0D9488`.

## [1.3.0] - 2026-11-22

Tier-S parity pass: zero `npm audit` advisories, a modular server, supply-chain
hygiene and a Playwright E2E smoke suite. No HTTP route, status code, validation
limit, cookie setting or CSP changed.

### Security
- All production and development `npm audit` advisories cleared at both the root
  and `client/` (0 / 0, `--omit=dev` and full).
- Server: `firebase-admin` `13.10` → `14.5`, moved to the modular SDK
  (`firebase-admin/app`, `firebase-admin/auth`); `express` `4.18` → `4.22`.
- Client: replaced the `firebase` metapackage with modular `@firebase/app` and
  `@firebase/auth`; `react-router-dom` `6.14` → `7.18` (resolves
  `GHSA-337j-9hxr-rhxg`); `vitest` `2.1` → `5.1` (clears `esbuild` /
  `vite-node` / `tinypool` dev advisories). `REACT_APP_FIREBASE_*` env names are
  unchanged.
- Added `SECURITY.md` (supported versions, private disclosure, controls summary).

### Added
- Playwright E2E smoke suite (`npm run test:e2e`, `npm run test:e2e:live`):
  health and fail-closed API checks, guest CSV upload + dashboard + localStorage
  persistence across reload, 8-view sidebar navigation + author drill-down,
  theme toggle, About modal (open, attribution, Escape to close) and a mobile
  no-horizontal-overflow check, asserting zero page errors and zero `>=500`
  responses.
- `.github/dependabot.yml`: weekly grouped minor/patch updates for the server,
  the client and GitHub Actions.
- Fresh README screenshots captured from synthetic demo data only.

### Changed
- `server.js` split from a 662-line monolith into `src/routes/auth.js`,
  `src/routes/data.js` and `src/csv/goodreads.js`; `server.js` is now 220 lines.
  Every `/api/*` path, status code, limit and test export is unchanged.
- CI (`.github/workflows/ci.yml`): GitHub Actions SHA-pinned (checkout v7.0.1,
  setup-node v7.1.0), Node 24, `cancel-in-progress` only for pull requests, and
  a new Playwright E2E job.
- The About modal now closes on `Escape` (accessibility).

## [1.2.1] - 2026-11-22

Code cleanup and dependency reduction release (no behavior changes).

### Changed
- `client/src/lib/stats.js` now re-exports `shared/stats.js` directly instead of
  maintaining a 132-line duplicate copy (RH-09).
- `FileUpload.jsx` uploads Goodreads CSVs via native `fetch` with
  `credentials: 'include'`.
- Updated `README.md` project structure and frontend dependency list.

### Removed
- Removed unused `chart.js` and `react-chartjs-2` client dependencies (charts
  use Recharts) and `axios`.
- Removed duplicate root `public/` icons and `public/README.md` (byte-identical
  to `client/public/`, which Vite serves).

## [1.2.0] - 2026-11-18

Client build-tool release: the React client moves from Create React App
(react-scripts 5, unmaintained) to Vite. React and all client libraries stay on
their current majors (RH-07).

### Changed
- Client built with Vite instead of react-scripts: faster builds, hashed bundles
  under `/assets/`, build output still in `client/build` (RH-07).
- The 23 JSX-containing `client/src` files are now `.jsx`; the Firebase config
  reads `import.meta.env.REACT_APP_FIREBASE_*` via Vite's `envPrefix`, so the
  existing environment variable names keep working (RH-07).
- `server.js` serves and caches Vite's `/assets/` bundles (immutable, 1 year);
  the HTML shell stays `no-cache` and a missing `/assets/*` file returns 404
  (RH-07, RH-11).
- CI `client` job now runs lint and the client tests in addition to the build.
- About modal, README and version bumped to 1.2.0.

### Fixed
- The four client component tests (Header, Sidebar, Dashboard, TopAuthors) run
  again — now on Vitest + jsdom + Testing Library — and pass; they had never run
  under CRA (RH-07, RH-14).
- Google Fonts (Fira Code) load again: the Content-Security-Policy now allows
  `fonts.googleapis.com` (style-src) and `fonts.gstatic.com` (font-src) (RH-07).
- Dashboard no longer crashes on a null `stats` value before its loading/error
  guards (optional chaining) (RH-07).

### Removed
- `react-scripts` and its only consumers: the `eslintConfig` and `browserslist`
  blocks, the unused `web-vitals` dependency, and the `eject` script. Client
  production `npm audit`: 70 → 6 findings (RH-07).

## [1.1.0] - 2026-11-18

Security and quality release from the 2026-11-18 audit (PRs #36 and #37).

### Security
- Removed the anonymous `/api/stats` endpoint that exposed uploaded data (RH-01).
- Uploaded CSVs are parsed in memory and never written to disk (RH-01).
- Removed the Replit header login bypass (RH-03).
- Rate limit on uploads: 10 per 15 minutes per IP (RH-06).
- Session cookies are `secure`, `httpOnly` and `sameSite`, and work behind the proxy; the session is regenerated on login (RH-04).
- Auth request bodies are validated; error details are no longer leaked (RH-08).
- Helmet CSP, `x-powered-by` off, the server binds to 127.0.0.1, and it fails fast without required config (RH-12).
- Logs use user IDs instead of e-mail addresses (RH-13).

### Fixed
- Server-driven sign-in state and a real logout (RH-05).
- One shared stats module; the rating average ignores unrated books; goals are saved (RH-09).
- JSON body limit raised to 2 MB, with validation of the book list (RH-10).
- Correct cache headers for static assets and HTML; missing assets return 404 (RH-11).

### Changed
- Server dependencies pruned; Mongoose 8 and bcrypt 6 (RH-07, server part).
- Removed the "My files" routes and the Account page (RH-15).
- ESLint, a server test suite and GitHub Actions CI added; dead code removed (RH-14).

### Known follow-ups
- Client migration from react-scripts to Vite is deferred (RH-07).

## [1.0.0-secure] - 2025-07-08

Initial tagged release.
