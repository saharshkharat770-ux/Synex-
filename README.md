# SYNEX — Fast, Secure & Reliable Backend with Integrated Frontend

> **"One Partner. Every Step. Endless Growth."**  
> Complete B2B SME Growth Platform with SQLite Database, JWT Authentication, Automated Growth Scoring, 90-Day Blueprint Engine, Onboarding Tracking, and Monthly Growth Cycle Management.

---

## 🚀 Quick Start

### 1. Installation
The project is completely self-contained. Dependencies are already installed:
```bash
cd d:\Files\Projects\synex
npm start
```
The server will start at: **`http://localhost:3000`**

### 2. Running Automated Tests
To run the automated verification test suite:
```bash
npm test
```

---

## 🔑 Pre-Seeded Accounts (Database with 5+ Clients + 1 Consultant)

The database is pre-seeded with 5 realistic SME businesses based on the **SYNEX Business Model Canvas Analysis Report** and frontend specifications, plus a Consultant account:

| Account Type | Name / Business | Email | Password | Growth Score | Top Priority | Membership |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Consultant (Admin)** | Dr. Aris Thorne | `admin@synex.com` | `admin123` | N/A (Portfolio View) | N/A | Lead Partner |
| **Client 1** | Shree Traders (Retail) | `shree@synex.com` | `password123` | 67 / 100 (Good) | Digital Presence | Professional |
| **Client 2** | Coastal Bites Cafe (F&B) | `coastal@synex.com` | `password123` | 48 / 100 (Needs Improvement) | Marketing | Basic |
| **Client 3** | Patil Fabricators (Manufacturing) | `patil@synex.com` | `password123` | 81 / 100 (Strong) | Technology | Premium |
| **Client 4** | UrbanFit Studio (Fitness / Services) | `urbanfit@synex.com` | `password123` | 59 / 100 (Good) | Customer Growth | Professional |
| **Client 5** | Apex Logistics & Cargo (Logistics) | `apex@synex.com` | `password123` | 74 / 100 (Good) | Strategy | Professional |

> **Tip:** On the web login screen (`/login`), click any of the **1-Click Demo Login** pills to instantly log in as that business or consultant!

---

## 🛠️ Tech Stack & Architecture

- **Runtime:** Node.js (v24.x)
- **Framework:** Express.js 4.x
- **Database:** SQLite via `better-sqlite3` (WAL mode enabled for ultra-fast, concurrent, zero-latency reads/writes, zero-configuration file persistence)
- **Security & Protection:**
  - `bcryptjs` salted password hashing (10 rounds)
  - `jsonwebtoken` (JWT) authentication with 7-day expiration
  - `helmet` HTTP security headers (CSP, XSS, MIME sniffing protection)
  - `express-rate-limit` rate-limiting (brute-force defense on auth and API endpoints)
  - Parameterized SQL queries preventing SQL Injection
  - Role-based authorization (`client` vs `consultant`)

---

## 🗄️ Database Schema (`synex.db`)

1. **`users`**:
   - `id`, `name`, `email` (UNIQUE), `password_hash`, `role` (`client` / `consultant`), `phone`, `created_at`
2. **`businesses`**:
   - `id`, `user_id` (FK), `name`, `owner_name`, `business_type`, `years_operating`, `membership_plan`, `assigned_consultant`, `created_at`
3. **`assessments`**:
   - `id`, `business_id` (FK), `overall_score`, `category_scores` (JSON), `answers` (JSON), `created_at`
4. **`blueprints`**:
   - `id`, `business_id` (FK, UNIQUE), `assessment_id` (FK), `priorities` (JSON), `roadmap_phase` (1, 2, or 3), `notes`, `updated_at`
5. **`onboarding_tasks`**:
   - `id`, `business_id` (FK), `task_key`, `phase_group`, `text`, `is_completed` (0/1), `completed_at`
6. **`growth_cycles`**:
   - `id`, `business_id` (FK, UNIQUE), `cycle_stage` (0-4), `stage_name`, `notes`, `updated_at`

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new SME account & business
- `POST /api/auth/login` — Sign in with email and password (returns JWT & business profile)
- `GET /api/auth/me` — Verify session and return currently logged-in user & business details

### Businesses (`/api/businesses`)
- `GET /api/businesses` — Consultant gets complete client portfolio; Client gets their own business
- `GET /api/businesses/:id` — Get comprehensive business profile (assessment, blueprint, tasks, cycle)
- `POST /api/businesses` — Create or update business discovery info
- `PATCH /api/businesses/:id/plan` — Update membership plan (Basic, Professional, Premium)

### Assessments & Scoring (`/api/assessments`)
- `POST /api/assessments` — Submit health check responses; computes category scores & overall score, generates 90-day blueprint, and persists to database
- `GET /api/assessments/latest/:businessId` — Retrieve latest score & blueprint

### Synchronization (`/api/sync`)
- `PATCH /api/sync/:id/onboarding` — Toggle onboarding task completion (persisted in DB)
- `PATCH /api/sync/:id/cycle` — Advance monthly growth cycle stage (0: Collect -> 1: Analyze -> 2: Report -> 3: Strategy -> 4: Execute)
- `PATCH /api/sync/:id/roadmap-phase` — Update active 90-day roadmap phase (1, 2, or 3)

### System Health (`/api/health`)
- `GET /api/health` — Server uptime, database connection status, and record counts

---

## 🌐 Integrated Frontend Features

- **Live Database Sync:** All onboarding checkboxes, cycle advancement, and assessment submissions update SQLite in real time.
- **Dedicated Login & Registration UI:** Tabbed login for clients & consultants with 1-click demo buttons.
- **Consultant / Portfolio Dashboard:** View all clients in real-time with health status pills and a "View Detail" button to inspect any client's blueprint and progress.
- **Interactive SVG Dial:** Live growth score calculation across 7 core dimensions:
  1. Business Foundation
  2. Marketing
  3. Digital Presence
  4. Technology
  5. Operations
  6. Customer Growth
  7. Business Strategy
