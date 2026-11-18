<div align="center">

# 📚 Reading Habit Tracker

**Visualize your reading life — powered by your Goodreads export.**

[![Node.js](https://img.shields.io/badge/Node.js-≥22.0-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[**Live Demo →**](https://mybooks.piapps.dev)

</div>

---

## What it does

Upload the CSV you export from Goodreads and the app turns it into a dashboard:
totals, reading by year and month, your top authors, how your ratings break down,
and your reading pace. You can use it signed out, or sign in with Google to save
your data to your account and see it on another device.

### Privacy

Your uploaded CSV is parsed **in memory** on the server and is **never written to
disk**. If you are signed out, nothing leaves your browser. If you sign in, only
the parsed book list and the computed stats are stored against your user account
in the database — the original file is not kept.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📤 **Goodreads CSV Import** | Upload your library export and visualize it immediately |
| 📊 **Interactive Dashboard** | Bar and pie charts plus key-stat cards |
| 📅 **Yearly & Monthly Progress** | Reading trends and a year-over-year comparison |
| 👤 **Author Statistics** | Your most-read authors, with per-author book lists |
| ⭐ **Rating Distribution** | How your ratings spread across your library |
| 🏃 **Reading Pace** | Books/month and pages/day from real date ranges |
| 🔐 **Optional Google Sign-In** | Firebase Authentication (popup flow); use it signed out too |
| 💾 **Per-user Storage** | Signed-in data saved in MongoDB; guests keep data in the browser |
| 🌗 **Dark / Light Theme** | Night Owl dark theme with a light-mode toggle |
| 📱 **Responsive Design** | Works on desktop and mobile |

---

## 🛠️ Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| **Node.js** | ≥ 22 | Runtime |
| **Express** | 4 | HTTP server & REST API |
| **Mongoose** | 8 | MongoDB ODM |
| **MongoDB Atlas** | — | Cloud database (accounts & reading data) |
| **Firebase Admin SDK** | 13 | Server-side Google ID-token verification |
| **express-session + connect-mongo** | — | Sessions stored in MongoDB |
| **multer** | 1.4 (lts) | CSV upload, in-memory, 5 MB cap, CSV-only |
| **csv-parser** | 3 | Streaming Goodreads CSV parsing |
| **dayjs** | 1 | Flexible date parsing |
| **bcrypt** | 6 | Password hashing for local accounts (cost 10) |
| **helmet** | 8 | Security headers / CSP |
| **express-rate-limit** | 8 | Upload rate limiting (10 / 15 min / IP) |
| **winston** | 3 | Structured JSON logging |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| **React** | 18 | UI framework |
| **Vite** | 6 | Build tool and dev server |
| **React Router** | 6 | Client-side routing / SPA navigation |
| **Recharts** | 2 | Bar and pie charts |
| **Chart.js** (react-chartjs-2) | 4 | Additional charts |
| **Firebase SDK** | 11 | Client-side Google Sign-In (popup) |
| **axios** | 1 | HTTP client |
| **react-icons** | 4 | Icon set |
| **Vitest + Testing Library** | — | Component tests (jsdom) |
| **Custom CSS** | — | Night Owl–inspired theme |

### Infrastructure
| Component | Detail |
|---|---|
| **PM2** | Process manager (app name `mybooks`) |
| **nginx** | Reverse proxy → `http://127.0.0.1:5003`, TLS termination |
| **Host** | `piapps` homelab server |
| **Live URL** | `https://mybooks.piapps.dev` |

---

## 📁 Project Structure

```
reading-habit-tracker/
├── server.js                  # Express server — API routes & static serving
├── ecosystem.config.js        # PM2 deployment config
├── models/
│   └── User.js                # Mongoose schema (auth + readingData)
├── shared/
│   └── stats.js               # Stats algorithm (server side)
├── src/
│   └── logger/index.js        # Winston logger setup
├── tests/                     # Server tests (Jest + supertest)
├── .github/workflows/ci.yml   # CI: server and client jobs
├── client/                    # React SPA (Vite)
│   ├── index.html             # Vite HTML entry
│   ├── vite.config.ts         # Vite config (build.outDir 'build', envPrefix)
│   ├── vitest.config.ts       # Vitest config (jsdom)
│   ├── eslint.config.js       # Client ESLint flat config (React + hooks)
│   ├── public/                # Favicons, logo (served at site root)
│   └── src/
│       ├── index.jsx          # React entry
│       ├── App.jsx            # Router + provider root
│       ├── firebase.js        # Firebase web config (import.meta.env)
│       ├── context/           # ReadingDataContext.jsx (global state + stats)
│       ├── components/        # Header, Sidebar, Footer, Auth, FileUpload…
│       ├── pages/             # Dashboard, YearlyProgress, RecentBooks…
│       ├── services/          # storageService.js (session + API persistence)
│       └── *.test.jsx         # Vitest component tests
├── uploads/                   # Legacy on-disk CSVs (gitignored; not written to)
└── logs/                      # Winston logs (gitignored)
```

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/google` | — | Verify Firebase ID token, create/find user |
| `POST` | `/api/auth/register` | — | Create a local username/password account |
| `POST` | `/api/auth/login` | — | Local login |
| `POST` | `/api/auth/logout` | Session | Destroy the session and clear the cookie |
| `GET` | `/api/auth/status` | — | Current session user (or signed-out) |
| `POST` | `/api/upload` | — | Upload a Goodreads CSV, parse in memory, return stats |
| `GET` | `/api/user/data` | Session | Fetch the signed-in user's saved books + stats |
| `POST` | `/api/user/data` | Session | Save books + stats for the signed-in user |
| `DELETE` | `/api/user/data` | Session | Wipe the signed-in user's reading data |
| `GET` | `/healthz` | — | Health check `{ ok: true }` |

---

## 🚀 Local Development

### Prerequisites

- Node.js ≥ 22
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier works)
- A [Firebase project](https://console.firebase.google.com) with Google Auth enabled

### Setup

```bash
# 1. Clone
git clone https://github.com/hexawulf/reading-habit-tracker.git
cd reading-habit-tracker

# 2. Install server deps (postinstall also installs the client)
npm install

# 3. Configure the server environment
cp .env.example .env
# Edit .env: MONGO_URI, SESSION_SECRET, and the Firebase Admin values

# 4. Configure the client Firebase web config
# Create client/.env with the six REACT_APP_FIREBASE_* values
# (see "Environment Variables" below)
```

### Run (two terminals)

```bash
# Terminal 1 — backend on :5003 (nodemon)
npm run dev

# Terminal 2 — Vite dev server on :3000, proxies /api to :5003
cd client && npm run dev
```

Open **http://localhost:3000**.

### Build for production

```bash
npm run build      # Vite builds client/build/
npm start          # serves the built SPA + API on PORT (default 5003)
```

---

## 🧰 Scripts

### Root (`package.json`)
| Script | Does |
|---|---|
| `npm run dev` | Start the API with nodemon (`NODE_ENV=development`) |
| `npm run build` | Build the client (`cd client && npm run build`) |
| `npm start` | Start the API server (`node server.js`) |
| `npm run lint` | ESLint over the server code |
| `npm test` | Server tests (Jest + supertest) |

### Client (`client/package.json`)
| Script | Does |
|---|---|
| `npm run dev` | Vite dev server on :3000 (proxies `/api` → :5003) |
| `npm run build` | Production build into `client/build` |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint over `client/src` (React + hooks) |
| `npm test` | Component tests (Vitest + jsdom + Testing Library) |

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` for the server. **Never commit `.env` or `client/.env`.**

### Server (`.env`)
| Variable | Description |
|---|---|
| `PORT` | Server port (default `5003`) |
| `HOST` | Bind address (default `127.0.0.1`) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `SESSION_SECRET` | Secret for `express-session` (required) |
| `CLIENT_URL` | Allowed CORS origin (e.g. `http://localhost:3000`) |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin service-account email |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin private key (with `\n` escaping) |
| `FIREBASE_PRIVATE_KEY_ID` | Key ID from the service-account JSON |
| `FIREBASE_CLIENT_ID` | Firebase client ID |
| `FIREBASE_TYPE` | Always `service_account` |
| `FIREBASE_AUTH_URI` | Firebase auth URI |
| `FIREBASE_TOKEN_URI` | Firebase token URI |
| `FIREBASE_AUTH_PROVIDER_X509_CERT_URL` | Firebase cert URL |
| `FIREBASE_CLIENT_X509_CERT_URL` | Firebase client cert URL |

### Client (`client/.env`)
The client build reads these names. Vite's `envPrefix` allows the `REACT_APP_`
prefix, so the names did not change when the client moved to Vite.

| Variable |
|---|
| `REACT_APP_FIREBASE_API_KEY` |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` |
| `REACT_APP_FIREBASE_PROJECT_ID` |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` |
| `REACT_APP_FIREBASE_APP_ID` |

---

## 🧪 Testing

```bash
npm test                 # server: Jest + supertest (API, auth, static, CSP)
cd client && npm test    # client: Vitest + jsdom (Header, Sidebar, Dashboard,
                         #         TopAuthors, firebase config)
```

## 🤖 CI

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`,
on Node 22:

- **server**: `npm ci` → `npm run lint` → `npm test`
- **client**: `npm ci` → `npm run lint` → `npm test` → `npm run build`

---

## 🚢 Deployment

Production runs on `piapps` under PM2 (app `mybooks`) on `127.0.0.1:5003`, with
nginx terminating TLS in front at `https://mybooks.piapps.dev`.

```bash
cd /home/zk/projects/reading-habit-tracker
git pull --ff-only origin main
npm ci            # root + client (postinstall)
npm run build     # Vite build into client/build
pm2 restart mybooks
```

Post-deploy check (run locally on the host):

```bash
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5003/            # 200
curl -sSI http://127.0.0.1:5003/ | grep -i '^cache-control'                  # no-cache
A=$(grep -oE '/assets/[^"]+\.js' client/build/index.html | head -1)
curl -sSI "http://127.0.0.1:5003$A" | grep -i '^cache-control'               # immutable
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5003/assets/nope.js  # 404
```

---

## 🔒 Security Notes

- **Secrets** live in `.env` / `client/.env` (gitignored); never commit them.
- **Uploads** are capped at 5 MB, CSV only, parsed in memory, never stored on disk.
- **Rate limit**: 10 uploads per 15 minutes per IP.
- **Sessions** are stored in MongoDB (14-day TTL); cookies are `httpOnly`,
  `sameSite`, and `secure` in production.
- **Passwords** are hashed with bcrypt (cost 10).
- **Headers**: helmet sets a Content-Security-Policy; `x-powered-by` is off.
- Run `npm audit` regularly.

---

## 🗺️ Roadmap

- [ ] 📖 Open Library API integration for cover art & metadata
- [ ] 📧 Weekly reading-summary emails
- [ ] 🏆 Reading challenges & badges
- [ ] 🔖 Manual book entry (without Goodreads)

---

## 📜 Version History

| Version | Date | Highlights |
|---|---|---|
| **1.2.0** | 2026-11 | Client moved from Create React App to Vite; client tests run on Vitest; Google Fonts allowed by the CSP; client security updates |
| **1.1.0** | 2026-11 | Security & quality release: in-memory uploads, real logout, hardened sessions and headers, accurate stats, CI |
| **1.0.0-secure** | 2025-07 | Initial tagged release |

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📜 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

Made with ☕ and 📚 by [0xWulf](https://github.com/hexawulf)

</div>
