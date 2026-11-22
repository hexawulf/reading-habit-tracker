# Security Policy

## Supported Versions

Security fixes are provided for the following releases of
`reading-habit-tracker` (mybooks):

| Version | Supported          |
| ------- | ------------------ |
| 1.3.x   | :white_check_mark: |
| 1.2.x   | :white_check_mark: |
| < 1.2   | :x:                |

## Reporting a Vulnerability

Please report security issues **privately** — do not open a public issue for an
undisclosed vulnerability.

- Preferred: open a private report through
  [GitHub Security Advisories](https://github.com/hexawulf/reading-habit-tracker/security/advisories/new).
- Alternatively, email **dev@0xwulf.dev**.

Please include a description of the issue, affected version(s), and reproduction
steps. You will receive an acknowledgement, and fixes for confirmed issues are
released under a new patch version with the advisory published once a fix is
available.

## Security Controls

The application applies the following controls:

- **Password storage:** bcrypt hashing (cost factor 10); password hashes are
  never returned in any API response.
- **Session cookies:** `httpOnly`, `sameSite: 'lax'`, and `secure` in
  production; the session is regenerated on every login/registration to prevent
  fixation, and destroyed on logout.
- **Google sign-in:** Firebase Admin verifies the client ID token server-side
  (`getAuth().verifyIdToken(...)`) before a session is issued.
- **CSV upload:** files are parsed in memory only and never written to disk;
  a 5 MB per-file size cap and a per-IP rate limit (10 uploads / 15 minutes)
  apply.
- **Payload validation:** saved reading data is validated as an array of up to
  20,000 book objects with type-checked fields; the JSON body limit is 2 MB.
- **HTTP hardening:** Helmet with a Content Security Policy, `x-powered-by`
  disabled, CORS restricted to the configured client origin with credentials.
- **Network posture:** `trust proxy = 1` (behind nginx) and the server binds to
  loopback only (`127.0.0.1:5003`); TLS is terminated by the reverse proxy.
- **Supply chain:** `npm audit` is kept at zero advisories (production and dev),
  CI pins GitHub Actions by commit SHA, and Dependabot proposes weekly updates.
