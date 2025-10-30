# StockLabs – README

A modern stock intelligence platform to search, track, and get alerted on equities. StockLabs combines real‑time quotes, watchlists, AI‑summarized news, portfolio analytics, and price alerts delivered via email.

- Built with Next.js App Router
- Data from Finnhub
- AI summaries via Gemini
- Auth via Better Auth
- Background jobs with Inngest
- Alerts delivered using Nodemailer (Gmail SMTP)
- MongoDB Atlas for persistence

---

## Table of Contents

- Overview
- Architecture
- Features
- Tech Stack
- Quick Start
- Development
- Deployment
- API Documentation
- Financial Logic
- Contributing
- License
- Support

---

## 🎯 Overview

StockLabs helps you:

- Find tickers quickly and view essential metrics
- Maintain a watchlist and get tailored market news
- Set price alerts and receive timely email notifications
- Analyze performance and recommendations
- View insider sentiment and market status

It’s multi-tenant by design using Better Auth sessions, with server routes protected by cookie-based authentication.

---

## 🏗 Architecture

- Frontend: Next.js (App Router, React 19, Tailwind)
- Backend: Next.js Route Handlers under `app/api/*`
- Authentication: Better Auth (cookie sessions)
- Database: MongoDB (Mongoose models)
- Background Jobs: Inngest (cron + event-driven)
- Emails: Nodemailer (Gmail)
- Data Providers: Finnhub (quotes, news)
- AI: Google Gemini (news summarization, welcome intros)

Key flows:

- User signs up/signs in via Better Auth
- Watchlist, alerts, and holdings persisted in MongoDB
- Inngest evaluates alerts and sends emails
- AI summarizes per-user news, sent daily by Inngest

---

## ✨ Features

- Watchlist management
- Real-time quotes and streaming hooks
- Price alert creation and throttled delivery
- Portfolio and performance views
- Analyst recommendation trends
- Insider sentiment summary
- Market status (open/closed)
- AI-summarized news emails
- Email templates for welcome, news, and alerts
- Dark mode and responsive UI

---

## 🛠 Tech Stack

- Framework: Next.js 15 (App Router), React 19
- Styling: Tailwind CSS, Radix UI primitives
- State/UX: React hooks, cache, custom hooks for WS/quotes
- DB: MongoDB, Mongoose
- Auth: Better Auth + nextCookies plugin
- Jobs: Inngest
- Email: Nodemailer (Gmail service)
- AI: Gemini
- Data: Finnhub
- Tooling: ESLint, TypeScript

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas or local MongoDB
- Finnhub API Key
- Gemini API Key
- Gmail account + App Password (for Nodemailer)

### Clone & Install

```bash
git clone https://github.com/your-username/StockLabs.git
cd StockLabs
npm install
```

### Environment Variables

Create `.env` (or configure in your hosting platform):

```
# Database
MONGODB_URI="your-mongodb-connection-string"

# Auth
BETTER_AUTH_SECRET="strong-random-secret"
BETTER_AUTH_URL="http://localhost:3000"  # your app URL

# Finnhub (server) and public (client) keys
FINNHUB_API_KEY="..."
NEXT_PUBLIC_FINNHUB_API_KEY="..."        # same or scoped public key

# Inngest
INNGEST_EVENT_KEY="..."

# AI (Gemini)
GEMINI_API_KEY="..."

# Email (Nodemailer - Gmail)
NODEMAILER_EMAIL="your-gmail@gmail.com"
NODEMAILER_PASSWORD="app-password"
```

Notes:

- If Gmail has 2FA, use an App Password.
- For development, ensure `BETTER_AUTH_URL` matches your local URL.

### Run the App

```bash
npm run dev
```

App runs at http://localhost:3000

---

## 🔧 Development

Project layout:

```
app/                      # Next.js app router pages and routes
  api/                    # Server routes (alerts, news, quotes, etc.)
components/               # UI components
database/                 # Mongoose connection and models
hooks/                    # Custom hooks (websockets, quotes stream)
lib/                      # Actions, auth, inngest, nodemailer, utils
  actions/                # Server actions (Finnhub, watchlist, user)
  better-auth/            # Better Auth setup
  inngest/                # Inngest client, functions, prompts
  nodemailer/             # Email transporter and templates
middleware/               # Next middleware if needed
types/                    # Global types
scripts/                  # Utility scripts (db tests)
server.py                 # Optional FastAPI prototype (not required)
```

Useful scripts:

- `npm run dev` – Start Next.js dev server
- `npm run build` – Build
- `npm run start` – Start production
- `npm run test:db` – Connectivity test for Mongo

---

## ☁️ Deployment

Recommended:

- Frontend/Serverless: Vercel (Next.js)
- Database: MongoDB Atlas
- Background Jobs: Inngest Cloud

Steps:

1. Push to GitHub
2. Import repo into Vercel
3. Set environment variables in Vercel
4. Configure Inngest project and set `INNGEST_EVENT_KEY`
5. Set `BETTER_AUTH_URL` to your production domain
6. Ensure Gmail SMTP variables are set (or swap to a dedicated provider like SendGrid)

Cron and events:

- `evaluateAlerts` runs via Inngest on cron “_/5 _ \* \* \*” and on `app/alert.created`
- `sendDailyNewsSummary` runs on cron “0 12 \* \* \*” and via `app/send.daily.news`

---

## 📚 API Documentation

Base: Next.js Route Handlers in `app/api/*`

- Alerts
  - GET `/api/alerts` – List user’s alerts
  - POST `/api/alerts` – Create alert (symbol, name, condition: > < =, target price, frequency)
- Quotes
  - GET `/api/quotes` – Latest prices for watchlist
  - GET `/api/quotes/details` – Price + previous close
- Performance
  - GET `/api/performance` – Periodic performance (7d/1m/3m/ytd)
- News
  - GET `/api/news` – General or watchlist-based news
- Recommendations
  - GET `/api/recommendations` – Analyst trends
- Insider Sentiment
  - GET `/api/insider-sentiment` – Insider MSPR summary
- Market Status
  - GET `/api/market-status` – Exchange open/closed
- Compare
  - POST `/api/compare` – Compare selected symbols
- Commentary
  - GET `/api/commentary` – Market commentary feed
- Holdings
  - GET/POST `/api/holdings` – Portfolio entries
  - PATCH `/api/holdings/:id` – Update holding

Auth:

- Managed server-side via Better Auth (cookie-based). Use `auth.api.*` within server actions and route handlers.

---

## 📈 Financial Logic

- Price Alerts
  - Conditions: `above`, `below`, `equal`
  - Frequency: `once`, `daily`, `realtime`
  - Throttling:
    - `daily` once per day
    - `realtime` no more than once per 15 minutes
    - `once` disables after first trigger
  - Recipient resolution:
    - Lookup `user.email` by `alert.userId`
- Performance
  - Uses Finnhub candles to compute change %
- AI News Summaries
  - Per-user news from watchlist
  - Summarized with Gemini and emailed daily

---

## 🤝 Contributing

- Use feature branches off `dev`
- Write TypeScript with strict types
- Run lint/type-check before commits
- Keep server routes minimal and typed
- Update docs when changing APIs

Conventional commits:

- `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

---

## 📄 License

MIT. See `LICENSE`.

---

## 🆘 Support

- Documentation: This README
- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Email: Maintainers via the repo profile

Common issues:

- Missing `FINNHUB_API_KEY` → empty quotes/news
- Missing `GEMINI_API_KEY` → news summaries disabled
- Nodemailer fails → verify Gmail App Password and `from` alignment
- `MONGODB_URI` not set → DB connection error

---
