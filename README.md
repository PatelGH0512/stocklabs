# 🧠 StockLabs — Stock Market App with AI Insights, Alerts & Charts

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)  
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)  
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)  
[![Python](https://img.shields.io/badge/Python-3.9+-yellow?logo=python)](https://www.python.org/)  
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-brightgreen?logo=fastapi)](https://fastapi.tiangolo.com/)  
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://www.mongodb.com/)  
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Modern, full-stack stock market platform for real-time stock exploration, AI-driven insights, and personalized financial alerts.

---

## 🚀 Overview

**StockLabs** is a next-generation **stock market intelligence platform** featuring:

- 🔍 **Real-time stock search** and TradingView-compatible charts
- 💡 **AI-powered summaries** and onboarding emails
- 📰 **Automated daily news digests** (Inngest + Gemini)
- 📈 **Watchlist and alerts** for personalized monitoring
- 🤖 **AI research & comparison reports** via Python FastAPI

Built with **Next.js 15**, **React 19**, **TypeScript**, **Tailwind**, and a **Python AI microservice**, StockLabs seamlessly integrates data, design, and intelligence.

---

## 🧩 Tech Stack

| Layer             | Technologies                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------- |
| **Frontend**      | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn UI (Radix Primitives) |
| **Backend**       | Next.js API Routes, Inngest, Better Auth (MongoDB), Nodemailer                               |
| **Database**      | MongoDB + Mongoose                                                                           |
| **AI / Python**   | FastAPI, agno, Gemini API, yfinance, pandas, numpy                                           |
| **External APIs** | Finnhub (stocks/news), Gemini (AI generation), yfinance (historical data)                    |

---

## ⚙️ Core Features

- **📊 Stock Discovery & Charts**

  - Real-time search and TradingView-ready charts
  - `lib/actions/finnhub.actions.ts` for symbol search and enrichment

- **📋 Watchlist & Alerts**

  - User-specific watchlists and alert foundations
  - `database/models/watchlist.model.ts`, `alert.model.ts`

- **📧 AI Email Experiences**

  - Personalized welcome emails (Gemini + Inngest)
  - Daily AI market summaries via Nodemailer

- **🔒 Authentication**

  - Better Auth with MongoDB adapter
  - Middleware protection for all secure routes

- **🤖 AI Compare Reports**
  - Compare multiple stocks via Python FastAPI
  - Aggregates fundamental, technical, and risk analysis

---

## 🏗️ Architecture Diagram

Next.js App (Frontend + API)
│
├── lib/actions/ (server actions for data/news/auth)
├── app/api/ (compare, inngest, search endpoints)
├── middleware/ (route protection)
│
├── Inngest (Workflows)
│ ├── client.ts → Gemini setup
│ └── functions.ts → welcome/news jobs
│
├── MongoDB + Better Auth
│
└── Python FastAPI Service (server.py)
└── /compare → AI-driven multi-stock analysis

---

## 🔁 Key Flows

<details>
<summary>🔍 Stock Search Flow</summary>

**Input:** User types a symbol →  
**Process:**

- `lib/actions/finnhub.actions.ts` → `searchStocks(query)`
- Enrich with exchange → convert to TradingView symbol  
  **Output:** Rendered stock cards and charts on dashboard

</details>

<details>
<summary>📰 AI Daily News Summary</summary>

**Trigger:** Inngest cron event `app/send.daily.news`  
**Steps:**

1. Fetch recipients and their watchlist
2. Pull relevant news via Finnhub
3. Summarize with Gemini
4. Send with Nodemailer

**Output:** Personalized daily digest email

</details>

<details>
<summary>🤖 Compare Multiple Stocks</summary>

**Input:** `{ symbols: string[] }` via `/api/compare`  
**Flow:**

- Next.js proxy → `PY_SERVICE_URL/compare`
- Python FastAPI generates aggregated report using yfinance + Gemini  
**Output:** JSON `{ report: string }` rendered on Compare page
</details>

---

## 🧾 Project Structure

app/
├─ (auth)/, (root)/, api/
├─ layout.tsx, globals.css
components/
├─ ui/ (shadcn components)
├─ common/ (Header, Footer, TradingViewWidget, etc.)
database/
├─ mongoose.ts
├─ models/
│ ├─ watchlist.model.ts
│ └─ alert.model.ts
lib/
├─ actions/ (finnhub, user, watchlist, etc.)
├─ better-auth/
├─ inngest/ (client.ts, functions.ts, prompts.ts)
├─ nodemailer/ (index.ts, templates.ts)
├─ constants.ts, utils.ts
middleware/
└─ index.ts
scripts/
├─ test-db.mjs
└─ test-db.ts
server.py (FastAPI)
requirements.txt
next.config.ts
tailwind.config.ts
package.json

---

## ⚡ Getting Started

### **1️⃣ Prerequisites**

- Node.js **18+**
- Python **3.9+**
- MongoDB Atlas or Local instance
- API keys for **Finnhub** and **Gemini**

### **2️⃣ Clone & Install**

```bash
git clone https://github.com/your-username/StockLabs.git
cd StockLabs
npm install



### **3️⃣ Run the App**

python3 -m venv venv
source venv/bin/activate   # macOS/Linux
# or venv\Scripts\activate  # Windows
pip install -r requirements.txt

Create .env file in project root:
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
PY_SERVICE_URL=http://localhost:8000

# Finnhub
FINNHUB_API_KEY=your_key

# MongoDB
MONGODB_URI=mongodb+srv://...

# Better Auth
BETTER_AUTH_SECRET=complex_random_string
BETTER_AUTH_URL=http://localhost:3000

# Gemini
GEMINI_API_KEY=your_key

# Nodemailer
NODEMAILER_EMAIL=example@gmail.com
NODEMAILER_PASSWORD=app_password

### **4️⃣ Configure Environment Variables**

# Start Next.js
npm run dev

# Start Inngest (AI Jobs)
npx inngest-cli@latest dev

# Start Python FastAPI
uvicorn server:app --reload --port 8000


```
