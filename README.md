<div align="center">

# 📚 Reading Habit Tracker

**Visualize your reading life — powered by your Goodreads export.**

[![Node.js](https://img.shields.io/badge/Node.js-≥22.0-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://mongodb.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[**Live Demo →**](https://mybooks.piapps.dev)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📤 **Goodreads CSV Import** | Upload your library export and instantly visualize your data |
| 📊 **Interactive Dashboard** | Bar charts, pie charts, and stats cards at a glance |
| 📅 **Yearly & Monthly Progress** | Track reading trends and compare year-over-year |
| 👤 **Author Statistics** | Discover your most-read authors with drill-down by title |
| ⭐ **Rating Distribution** | See how your ratings break down across your library |
| 🏃 **Reading Pace** | Books/month and pages/day calculated from real date ranges |
| 🔐 **Google Sign-In** | Firebase Authentication — sign in with your Google account |
| 💾 **Persistent Storage** | Reading data saved per-user in MongoDB Atlas |
| 🌗 **Dark / Light Theme** | Night Owl dark theme with a light mode toggle |
| 📱 **Responsive Design** | Works on desktop and mobile |

---

## 🛠️ Tech Stack

### Backend
| Package | Purpose |
|---|---|
| **Node.js ≥ 22** | Runtime |
| **Express 4** | HTTP server & REST API |
| **Mongoose 6** | MongoDB ODM |
| **MongoDB Atlas** | Cloud database (user accounts & reading data) |
| **Firebase Admin SDK 13** | Server-side Google token verification |
| **express-session + connect-mongo** | Session management with MongoDB store |
| **multer** | CSV file upload handling (5 MB limit, CSV-only filter) |
| **csv-parser** | Streaming Goodreads CSV parsing |
| **dayjs** | Flexible date parsing (multiple formats) |
| **bcrypt** | Password hashing for local accounts |
| **winston** | Structured JSON logging with log rotation via PM2 |

### Frontend
| Package | Purpose |
|---|---|
| **React 18** | UI framework |
| **React Router 6** | Client-side routing / SPA navigation |
| **Recharts** | Bar, Line, and Pie charts |
| **Firebase SDK 11** | Client-side Google Sign-In (popup flow) |
| **axios** | HTTP client for API calls |
| **react-icons** | Icon set |
| **Custom CSS** | Night Owl–inspired dark theme |

### Infrastructure
| Component | Detail |
|---|---|
| **PM2** | Process manager (`mybooks` cluster, auto-restart, 500 MB cap) |
| **nginx** | Reverse proxy → `http://127.0.0.1:5003`, TLS termination |
| **piapps.dev** | Homelab server (Raspberry Pi) |
| **Live URL** | `https://mybooks.piapps.dev` |

---

## 📁 Project Structure

```
reading-habit-tracker/
├── server.js                  # Express server — API routes & static serving
├── ecosystem.config.js        # PM2 deployment config
├── models/
│   └── User.js                # Mongoose schema (auth + readingData)
├── src/
│   └── logger/index.js        # Winston logger setup
├── utils/
│   └── goodreadsParser.js     # CSV parsing & stats generation helpers
├── .env.example               # Required environment variables (template)
├── client/                    # React SPA
│   ├── src/
│   │   ├── App.js             # Router + provider root
│   │   ├── context/
│   │   │   └── ReadingDataContext.js  # Global state & stats calculation
│   │   ├── components/        # Header, Sidebar, Footer, Auth, FileUpload…
│   │   ├── pages/             # Dashboard, YearlyProgress, RecentBooks…
│   │   └── services/
│   │       └── storageService.js      # localStorage + API persistence layer
│   └── build/                 # Production build (gitignored)
├── uploads/                   # User CSV files, per-email subdir (gitignored)
├── user_data/                 # Legacy JSON store (gitignored)
└── logs/                      # Winston logs, rotated by PM2 (gitignored)
```

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/google` | — | Verify Firebase ID token, create/find user |
| `POST` | `/api/auth/register` | — | Create local username/password account |
| `POST` | `/api/auth/login` | — | Local login |
| `GET` | `/api/auth/status` | Session | Current session user |
| `POST` | `/api/upload` | — | Upload Goodreads CSV, parse & return stats |
| `GET` | `/api/user/data` | Session | Fetch saved books + stats from DB |
| `POST` | `/api/user/data` | Session | Save books + stats to DB |
| `DELETE` | `/api/user/data` | Session | Wipe user reading data |
| `GET` | `/api/files/list` | Session | List user's uploaded CSV files |
| `DELETE` | `/api/files/delete/:filename` | Session | Delete a specific CSV file |
| `GET` | `/api/stats` | — | Stats from most recent upload (guest fallback) |
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

# 2. Install server deps
npm install

# 3. Install client deps
npm run install-client

# 4. Configure environment
cp .env.example .env
# Edit .env and fill in your MongoDB URI, Firebase credentials, and session secret

# 5. Configure client Firebase
cp client/.env.example client/.env   # if provided, otherwise create manually
# Add REACT_APP_FIREBASE_* keys from your Firebase project settings
```

### Run

```bash
# Terminal 1 — backend (with nodemon)
npm run dev

# Terminal 2 — frontend dev server
npm run client
```

Open **http://localhost:3000** — the frontend proxies API requests to the backend.

### Build for production

```bash
npm run build      # builds client/build/
npm start          # serves built SPA + API on PORT (default 5003)
```

---

## 📤 How to Export Your Goodreads Data

1. Log in to [Goodreads](https://www.goodreads.com)
2. Go to **My Books**
3. Click **Import and Export** in the left sidebar
4. Click **Export Library**
5. Wait for the email / page refresh, then download the CSV
6. Upload it on the **Upload** page of the app

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and fill in all values. **Never commit `.env`.**

| Variable | Description |
|---|---|
| `PORT` | Server port (default `5003`) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `SESSION_SECRET` | Random secret for `express-session` |
| `CLIENT_URL` | Frontend origin for CORS (e.g. `http://localhost:3000`) |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK private key (with `\n` escaping) |
| `FIREBASE_PRIVATE_KEY_ID` | Key ID from Firebase service account JSON |
| `FIREBASE_CLIENT_ID` | Firebase client ID |
| `FIREBASE_TYPE` | Always `service_account` |
| `FIREBASE_AUTH_URI` | Firebase auth URI |
| `FIREBASE_TOKEN_URI` | Firebase token URI |
| `FIREBASE_AUTH_PROVIDER_X509_CERT_URL` | Firebase cert URL |
| `FIREBASE_CLIENT_X509_CERT_URL` | Firebase client cert URL |
| `LOG_DIR` | Directory for Winston logs (default `./logs`) |

---

## 🔒 Security Notes

- **Credentials**: All secrets live in `.env` (gitignored). Rotate any credentials that were previously exposed in version control.
- **File uploads**: Limited to 5 MB, CSV files only. Uploaded to per-user subdirectories. Path traversal is prevented via `path.resolve` boundary checks.
- **Sessions**: Stored in MongoDB with a 14-day TTL. Cookies are `secure: true` in production.
- **Passwords**: Hashed with bcrypt (cost factor 10).
- **Dependencies**: Run `npm audit` regularly to catch vulnerable packages.

---

## 🗺️ Roadmap

- [ ] 📖 Open Library API integration for cover art & metadata
- [ ] 🎯 Custom reading goal targets (currently fixed at 52/year, 4/month)
- [ ] 📧 Weekly reading summary emails
- [ ] 🏆 Reading challenges & badges
- [ ] 👥 Friend stats comparison
- [ ] 🔖 Manual book entry (without Goodreads)

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📜 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

Made with ☕ and 📚 by [0xWulf](https://github.com/hexawulf)

</div>
