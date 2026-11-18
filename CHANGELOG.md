# Changelog

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
