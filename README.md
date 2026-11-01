<div align="center">
  <img src="client/public/logo.png" alt="DevPrep Logo" width="100" height="91" />
  <h1>DevPrep</h1>
  <p><strong>Full-Stack Developer Preparation & Placement Platform</strong></p>
</div>

> **A self-developed full-stack web application designed for computer science students to practice Data Structures & Algorithms, execute client-side JavaScript tests in an isolated Web Worker sandbox, take timed technical mock assessments with server-side evaluation, track internship and job applications, and monitor preparation analytics.**

Developed as a college project for **B.Tech Computer Science and Engineering (CSE)**. Built with modern React and Express, adhering strictly to a custom **"Warm Paper and Ink"** design system with full offline JSON file persistence, atomic write-queue serialization, zero-flash theming, and comprehensive keyboard accessibility.

---

## Table of Contents
1. [Key Features](#key-features)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Directory Structure](#project-directory-structure)
5. [Prerequisites & Setup](#prerequisites--setup)
6. [Seeding & Demo Accounts](#seeding--demo-accounts)
7. [Running the Application](#running-the-application)
8. [Deploying on Vercel](#deploying-on-vercel)
9. [Automated Verification Test Suites](#automated-verification-test-suites)
10. [REST API Specification](#rest-api-specification)
11. [Design System & Accessibility](#design-system--accessibility)
12. [Security & Sandbox Architecture](#security--sandbox-architecture)
13. [Academic Integrity & Project Scope](#academic-integrity--project-scope)

---

## Key Features

### 1. DSA Problem Library & Topic Mastery
- **36 Curated Problems:** Spanning 9 fundamental technical interview topics: *Arrays, Strings, Linked Lists, Stack, Queue, Trees, Graphs, Dynamic Programming, and Binary Search*.
- **Multi-Parameter Filtering:** Real-time search by title, topic selection dropdown, and difficulty filtering (`Easy`, `Medium`, `Hard`) communicating via REST query parameters (`/api/questions?topic=...&difficulty=...&search=...`).
- **Interactive Progress Tracking:** Problem completion toggle ("Mark as Solved" / "Solved") that dynamically recalculates user topic proficiency and day streak in `progress.json`.
- **Dynamic Empty States:** Friendly zero-result views with a one-click action to clear filters.

### 2. "My Solution" Personal Code Notepad
- **Multi-Language Draft Retention:** Write and retain personal algorithmic notes across **JavaScript**, **Python**, **Java**, and **C++** with zero loss of uncommitted edits when toggling language tabs.
- **Smart Code Editor Controls:** Custom keydown interceptor in plain JavaScript:
  - **Indentation:** Tab key inserts 4 spaces; Shift+Tab unindents multi-line blocks.
  - **Contextual Enter:** Retains current indentation and automatically expands `{|}`, `[|]`, or `(|)` into a 3-line indented block with the cursor positioned inside.
  - **Auto-Closing & Wrapping:** Automatically pairs brackets `()`, `[]`, `{}` and quotes `""`, `''`, ```` with auto-overtyping and selection-wrapping support.
  - **Undo Preservation:** Preserves the browser's native Undo/Redo history stack (`Ctrl+Z` / `Ctrl+Y`) via `document.execCommand`.
  - **Ligature Safety:** Enforces `font-variant-ligatures: none !important;` so characters like `!==`, `===`, and `=>` render as literal code without confusing glyph substitutions.
- **Line Number Gutter & Coordinates:** Synchronized scrolling line numbers with active line highlighting and live `Ln X, Col Y` cursor position metrics.

### 3. Client-Side Test Runner (Isolated Web Worker Sandbox)
- **100% In-Browser Execution:** Student JavaScript code executes exclusively inside a dedicated background browser Web Worker thread (`client/src/utils/testWorker.js`). **Zero evaluation (`eval`, `new Function`, `vm`, or `child_process`) takes place on the Node/Express backend.**
- **Network API Lockdown:** Before untrusted student code executes, the worker disables and freezes `fetch`, `XMLHttpRequest`, `WebSocket`, `importScripts`, and `indexedDB`, preventing unauthorized outbound network calls or storage tampering.
- **2.0-Second Hard Timeout Cap:** The main thread monitors execution and forcibly terminates the Web Worker if an infinite loop or heavy recursion exceeds 2.0 seconds, returning *"Time limit exceeded (2.0s cap)"* without freezing the UI.
- **Comprehensive Results & Privacy:** Displays pass/fail status, runtime in milliseconds, inputs, expected values, received values, and captured console output (up to 50 lines). **Hidden test cases** verify algorithmic edge cases while concealing inputs and expected answers.

### 4. Timed Mock Assessments & Historical Scorecards
- **Campus Test Simulation:** Timed multiple-choice assessments (5, 10, 15, or 20 questions) customizable by DSA topic or across all topics mixed.
- **Live Countdown Timer:** 90-second-per-question countdown with visual pulse alerts under 60 seconds and automatic submission upon expiration.
- **Anti-Cheat Information Hiding:** The student delivery endpoint (`GET /api/mock-test`) strips `correctIndex` and `explanation` from payloads. Answers are evaluated exclusively on the server at submit time (`POST /api/mock-test/submit`).
- **Defensive Historical Snapshots:** When an attempt is submitted, a complete question snapshot is sealed into the attempt record so subsequent administrator edits or deletions never invalidate past student scorecards.

### 5. Job & Internship Application Tracker
- **Recruitment Pipeline Management:** Organize company applications across five stages: *All, Applied, Interview, Selected, and Rejected*.
- **Dynamic Status Chips:** Top-level status filters with live counts aggregated directly from the student's active applications.
- **User-Scoped Privacy:** Each student's applications are strictly partitioned by authenticated JWT user ID (`req.user.id`). Other users can never view, update, or delete records belonging to another student.
- **Accessible Modals:** Full create and edit dialogs rendered into `document.body` via React Portals with background body scroll locking, Escape-key dismissal, and focus trapping.

### 6. Preparation Analytics & Activity Dashboard
- **Live Server Aggregation:** Live metrics calculated on-the-fly across `questions.json`, `mcqBank.json`, `mockAttempts.json`, `applications.json`, and `progress.json` without stale denormalized counters.
- **Theme-Aware Flat Recharts:** 7-day rolling solve activity bar chart utilizing flat CSS variables (`var(--accent)`) without prohibited gradients, neon glows, or visual bloat.
- **Activity Stream:** Chronological feed linking DSA problem solves and mock test attempts with relative timestamps (*"2h ago"*, *"Yesterday"*).
- **Day Streak Counter:** Stored consecutive day practice streak tracking student consistency.

### 7. Student Profile & Settings
- **View vs. Edit Modes:** Read-only presentation by default displaying college, branch, graduation year, target role, weekly goal, technical skills tags, and career milestones.
- **Interactive Tag Editors:** Dynamic skill chips with keyboard addition (Enter or comma), duplicate prevention, and suggested technical skills.
- **Zero-Flash Theme Sync:** Bidirectional theme switching synchronizing with client `localStorage` and persisted to the student profile in `progress.json`.

### 8. Administrator Management Portal
- **Protected RBAC Endpoints:** Coding question CRUD (`/api/questions`) and MCQ bank management (`/api/admin/mcq`) protected on the server using `requireAuth` and `requireAdmin` middleware.
- **Topic Inventory Capacity Warnings:** Calculates active questions per topic and warns administrators when a topic has fewer than 5 questions.
- **Persistent Tab Navigation:** Zero-shift admin layout with persistent segmented sub-tabs ("Coding Questions" | "MCQ Bank") and in-memory session caching.

---

## System Architecture

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │                     BROWSER CLIENT                     │
                                    │               (React 18 + Vite, Port 5173)             │
                                    └───────────────────────────┬────────────────────────────┘
                                                                │
                                         Vite Dev Proxy: /api/* │ HTTP JSON + JWT Bearer
                                                                ▼
                                    ┌────────────────────────────────────────────────────────┐
                                    │                   EXPRESS API BACKEND                  │
                                    │                  (Node.js, Port 5000)                  │
                                    └─────┬─────────────────────┬──────────────────────┬─────┘
                                          │                     │                      │
                             Routes & Auth Middleware     Controllers Layer      Input Validators
                             (requireAuth, requireAdmin)  (Business Logic)       (Regex & Enums)
                                          │                     │                      │
                                          └─────────────────────┼──────────────────────┘
                                                                │
                                                    fileDb Engine (Promise Queue)
                                                    • Atomic Temp Write -> Rename
                                                    • Concurrency Serialization
                                                    • Corrupted JSON Recovery
                                                                │
                                                                ▼
                                    ┌────────────────────────────────────────────────────────┐
                                    │                   JSON STORAGE LAYER                   │
                                    │                     (server/data/)                     │
                                    │  • users.json         • questions.json                 │
                                    │  • progress.json      • mockAttempts.json              │
                                    │  • questions.json     • mcqBank.json                   │
                                    │  • applications.json  • solutions.json                 │
                                    └────────────────────────────────────────────────────────┘

                             ┌──────────────────────────────────────────────────────────────┐
                             │               CLIENT-SIDE TEST RUNNER SANDBOX                │
                             │               (Dedicated Browser Web Worker)                 │
                             │  • Isolated worker thread (testWorker.js)                    │
                             │  • Network APIs revoked (fetch, XHR, WebSocket, IndexedDB)   │
                             │  • Hard 2.0s main-thread execution timeout cap               │
                             │  • Captured console log output (max 50 lines)                │
                             └──────────────────────────────────────────────────────────────┘
```

### Request & Storage Lifecycle
1. **Frontend Request:** The client makes requests exclusively through [`client/src/services/api.js`](client/src/services/api.js) with automatic `Authorization: Bearer <token>` injection.
2. **Reverse Proxy:** Vite's local dev server proxies all `/api/*` traffic to `http://localhost:5000`, eliminating CORS conflicts without hardcoding server URLs in client code.
3. **Middleware Pipeline:** Express parses JSON bodies, checks routes, authenticates JWT signatures via [`server/middleware/auth.js`](server/middleware/auth.js), and verifies administrator privileges where required.
4. **Validation:** Controllers pass payloads through [`server/utils/validators.js`](server/utils/validators.js). Invalid types, lengths, or unsupported enums return clean `400 Bad Request` messages.
5. **Atomic File Persistence:** Data is written via [`server/utils/fileDb.js`](server/utils/fileDb.js). Disk writes are queued serially per file and written to a `.tmp` file before an atomic rename (`fs.rename`), preventing partial-write file corruption during sudden restarts.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18 (Vite) | Single-page UI with declarative component architecture |
| **Routing** | React Router v6 | Client-side routing, route guards (`ProtectedRoute`, `AdminRoute`) |
| **Icons** | Lucide React | Minimalist line icons (18px, 1.75 stroke) |
| **Data Visualization** | Recharts | Responsive flat SVG bar charting without external UI dependencies |
| **HTTP Client** | Native `fetch` | Native Fetch API wrapped in `services/api.js` (no Axios) |
| **Backend Runtime** | Node.js (CommonJS) | Server runtime supporting `async/await` and `fs/promises` |
| **Web Server** | Express.js | REST routing, middleware orchestration, and error handling |
| **Security & Hashing**| `bcryptjs` (10 rounds) | Cryptographic password hashing protecting student accounts |
| **Session Tokens** | `jsonwebtoken` (JWT) | Stateless 7-day authentication tokens |
| **Persistence Engine**| Plain JSON (`fileDb.js`) / Neon PostgreSQL (`@neondatabase/serverless`) | Dual storage drivers behind a unified interface (`server/storage/`) |
| **Browser Sandbox** | HTML5 Web Workers | Isolated client-side JavaScript execution environment |

---

## Project Directory Structure

```
DevPrep/
├── client/                              # Frontend React Application
│   ├── public/                          # Static browser assets
│   ├── src/
│   │   ├── components/                  # Reusable UI Components
│   │   │   ├── ActivityFeed.jsx         # Recent chronological practice timeline
│   │   │   ├── AdminLayout.jsx          # Admin parent layout with persistent sub-tabs
│   │   │   ├── ApplicationModal.jsx     # Add/Edit application modal dialog
│   │   │   ├── DifficultyBadge.jsx      # Easy (moss), Medium (ochre), Hard (brick) badges
│   │   │   ├── EmptyState.jsx           # Standardized empty state card with primary action
│   │   │   ├── ErrorMessage.jsx         # Error banner with retry trigger
│   │   │   ├── GoalsListEditor.jsx      # Milestone placement goals manager
│   │   │   ├── Layout.jsx               # Application shell (sidebar, topbar, mobile drawer)
│   │   │   ├── Loader.jsx               # CSS spinner and loading state indicator
│   │   │   ├── McqModal.jsx             # Admin MCQ creation/editing modal
│   │   │   ├── Modal.jsx                # Shared React Portal modal dialog
│   │   │   ├── ProgressBar.jsx          # Flat progress track with percentage label
│   │   │   ├── ProtectedRoute.jsx       # Authenticated route guard redirecting to /login
│   │   │   ├── AdminRoute.jsx           # Administrator privilege route guard
│   │   │   ├── QuestionTable.jsx        # Responsive DSA question library table
│   │   │   ├── Sidebar.jsx              # 232px navigation drawer with mobile lock
│   │   │   ├── SkillTagsInput.jsx       # Dynamic skill chips input
│   │   │   ├── StatCard.jsx             # Clean typography metric card
│   │   │   ├── ThemeToggle.jsx          # Accessible light/dark theme switch
│   │   │   └── WeeklyChart.jsx          # Flat SVG 7-day solve activity chart
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # Global student authentication state
│   │   │   └── ThemeContext.jsx         # Zero-flash light/dark theme synchronizer
│   │   ├── pages/                       # Application Views
│   │   │   ├── AdminMcq.jsx             # Admin MCQ bank manager and capacity view
│   │   │   ├── AdminQuestions.jsx       # Admin DSA question repository manager
│   │   │   ├── Applications.jsx         # Internship and job application pipeline
│   │   │   ├── Dashboard.jsx            # Student analytics overview & stats
│   │   │   ├── Login.jsx                # Two-column authentication view
│   │   │   ├── MockTest.jsx             # Timed technical test runner
│   │   │   ├── ProblemDetails.jsx       # Problem details, code editor & test runner
│   │   │   ├── Problems.jsx             # DSA problem library with live filters
│   │   │   ├── Profile.jsx              # Profile details in view and edit modes
│   │   │   ├── QuestionForm.jsx         # Admin question create/edit form
│   │   │   ├── Signup.jsx               # Student registration with validation rules
│   │   │   └── TestResult.jsx           # Assessment scorecard and answer review
│   │   ├── services/
│   │   │   ├── adminCache.js            # Zero-shift in-memory admin cache
│   │   │   └── api.js                   # Centralized HTTP request wrapper
│   │   ├── utils/
│   │   │   ├── codeEditorUtils.js       # Plain JS keyboard and indentation handler
│   │   │   ├── testRunner.js            # Worker lifecycle manager & 2.0s timeout
│   │   │   └── testWorker.js            # Isolated Web Worker sandbox execution
│   │   ├── App.jsx                      # Route hierarchy configuration
│   │   ├── index.css                    # "Warm Paper and Ink" CSS custom properties
│   │   └── main.jsx                     # Application bootstrap
│   ├── index.html                       # HTML head with anti-flash theme script
│   ├── package.json
│   └── vite.config.js                   # Vite reverse proxy configuration
│
├── server/                              # Backend Express Application
│   ├── controllers/                     # Route Controllers
│   │   ├── adminMcqController.js        # Admin MCQ CRUD and duplicate validation
│   │   ├── applicationController.js     # User-scoped internship tracking CRUD
│   │   ├── authController.js            # Signup, login, and profile lookup
│   │   ├── mockTestController.js        # Shuffling, grading, and anti-cheat
│   │   ├── progressController.js        # Dynamic aggregations and streak tracking
│   │   ├── questionController.js        # DSA problem repository management
│   │   └── solutionController.js        # Multi-language solution note persistence
│   ├── data/                            # File-Based Database (JSON)
│   │   ├── questions.json               # 36 DSA coding questions & test cases (tracked)
│   │   ├── mcqBank.json                 # 45 curated MCQs across 9 topics (tracked)
│   │   ├── applications.json            # Student recruitment records (ignored)
│   │   ├── mockAttempts.json            # Student test attempts & snapshots (ignored)
│   │   ├── progress.json                # User solve records, streak & profiles (ignored)
│   │   ├── solutions.json               # Personal solution notes (ignored)
│   │   ├── users.json                   # User accounts & bcrypt password hashes (ignored)
│   │   └── avatars.json                 # User profile photos (base64 WebP, ignored)
│   ├── middleware/                      # Express Middleware Pipeline
│   │   ├── auth.js                      # requireAuth and requireAdmin guards
│   │   ├── errorHandler.js              # Centralized JSON error formatting
│   │   └── notFound.js                  # 404 Route Not Found handler
│   ├── routes/                          # Express REST Route Handlers
│   │   ├── adminMcqRoutes.js            # /api/admin/mcq endpoints
│   │   ├── applicationRoutes.js         # /api/applications endpoints
│   │   ├── authRoutes.js                # /api/auth endpoints
│   │   ├── healthRoutes.js              # /api/health endpoint
│   │   ├── mockTestRoutes.js            # /api/mock-test endpoints
│   │   ├── progressRoutes.js            # /api/progress endpoints
│   │   ├── questionRoutes.js            # /api/questions endpoints
│   │   └── solutionRoutes.js            # /api/solutions endpoints
│   ├── scripts/                         # Test Suites & Data Seeder
│   │   ├── seed.js                      # Incremental database seeder
│   │   ├── test-auth.js                 # Authentication lifecycle test
│   │   ├── test-editor-features.js      # Monospace editor & keyboard test
│   │   ├── test-fileDb.js               # Concurrency & file corruption test
│   │   ├── test-percentage.js           # Math rounding and divide-by-zero test
│   │   ├── test-phase5.js               # Questions & progress API test
│   │   ├── test-phase5b.js              # "My Solution" code privacy test
│   │   ├── test-phase6.js               # Admin question CRUD & RBAC test
│   │   ├── test-phase7.js               # Application tracker CRUD test
│   │   ├── test-phase8.js               # Timed mock tests & anti-cheat test
│   │   ├── test-phase8b.js              # Admin MCQ bank management test
│   │   ├── test-phase9.js               # Dashboard metrics aggregation test
│   │   ├── test-phase10.js              # Student profile & settings test
│   │   └── test-phase10b.js             # Client test runner & server safety test
│   ├── utils/
│   │   ├── fileDb.js                    # Atomic temp-write and queue engine
│   │   └── validators.js                # Input schema and field validators
│   ├── .env.example                     # Environment template
│   ├── package.json
│   └── server.js                        # Express server entry point
│
├── Architecture.md                      # Detailed technical architecture design
├── Design.md                            # Visual design system specifications
├── Memory.md                            # Complete engineering context memory
├── Phases.md                            # 12-phase incremental roadmap
├── PRD.md                               # Product Requirements Document
├── Rules.md                             # Engineering safety & scope constraints
└── README.md                            # Comprehensive project documentation
```

---

## Prerequisites & Setup

### Requirements
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Operating System:** Windows, macOS, or Linux

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/DevPrep.git
   cd DevPrep
   ```

2. **Configure Backend Environment:**
   ```bash
   cd server
   cp .env.example .env
   ```
   *Configure your `server/.env` file:*
   ```env
   PORT=5000
   JWT_SECRET=CHANGE_ME_TO_A_LONG_RANDOM_STRING
   ADMIN_EMAIL=admin@devprep.com
   ADMIN_PASSWORD=Admin@1234
   ```
   > [!IMPORTANT]
   > **Security Note:** Always replace `CHANGE_ME_TO_A_LONG_RANDOM_STRING` with a strong, random key (e.g. generated via `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`), and change the default admin (`Admin@1234`) and demo student (`Demo@1234`) passwords before deploying to any public or production environment.

3. **Install Dependencies:**
   ```bash
   # Install server packages
   cd server
   npm install

   # Install client packages
   cd ../client
   npm install
   ```

---

## Seeding & Demo Accounts

DevPrep ships with an automated incremental seeder that provisions default administrator and student demo accounts with complete data (solved problems, activity history, test attempts, tracked applications, and saved solutions).

From the `server/` directory, run:
```bash
npm run seed
```

### Pre-Configured Test Accounts

| Account Role | Email Address | Password | Permissions & Pre-Seeded Context |
|---|---|---|---|
| **Administrator** | `admin@devprep.com` | `Admin@1234` | Full access to DSA Question CRUD and MCQ Bank Management (`/admin/*`). |
| **Demo Student** | `demo@devprep.com` | `Demo@1234` | Standard user role; pre-populated with **8 solved problems**, a **3-day streak**, **5 tracked job applications**, **1 saved code solution**, and **2 mock test attempts**. |

*Note: New accounts created via the **Signup** page start with completely private, empty progress.*

---

## Running the Application

DevPrep requires running both the backend API server and the frontend Vite development server. Open two separate terminal windows:

### Terminal 1: Start Express Backend
```bash
cd server
npm run dev
```
*The Express server will start on `http://localhost:5000`.*

### Terminal 2: Start Vite Frontend Client
```bash
cd client
npm run dev
```
*The Vite development server will start on `http://localhost:5173`.*

Open your web browser and navigate to **`http://localhost:5173`**.

---

## Deploying on Vercel

DevPrep is configured for production deployment on **Vercel** with persistent data backed by **Neon PostgreSQL** (provisioned via Vercel Marketplace).

### Dual Driver Persistence Model
- **Local Development:** When no `DATABASE_URL` is set, DevPrep defaults to the `file` driver (`server/data/*.json`). Zero configuration or database setup is required to run locally.
- **Production on Vercel:** In production with `DATABASE_URL` configured, DevPrep automatically switches to the `postgres` driver (`@neondatabase/serverless`).

### Step 1: Deploy Backend (Express API on Vercel)
1. In the Vercel Dashboard, create a new project and set the **Root Directory** to `server`.
2. Attach a Neon Postgres database via **Vercel Marketplace (Integrations > Neon)**. This automatically provisions the database and sets `DATABASE_URL`.
3. Configure the following environment variables in your Vercel Project Settings:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: A secure random string of at least 32 characters (the server startup checks refuse weak or placeholder secrets).
   - `ADMIN_EMAIL`: Your production administrator email (e.g., `admin@yourdomain.com`).
   - `ADMIN_PASSWORD`: A secure production password (must be at least 8 characters; "Admin@1234" is rejected in production).
   - `CLIENT_URL`: The URL of your deployed frontend (e.g., `https://devprep.vercel.app`).
   - `ALLOW_DEMO_USER`: `false` (set to `true` only if you want the demo student account seeded in production).
4. Click **Deploy**. Note the assigned deployment URL (e.g., `https://devprep-api.vercel.app`).

### Step 2: One-Time Database Seeding
Initialize the production database with 36 curated DSA problems, 45 MCQ questions, and the administrator account:
```bash
cd server
DATABASE_URL="your-neon-connection-string" NODE_ENV=production ADMIN_PASSWORD="your-strong-password" npm run seed
```
*The seed script is fully idempotent: if records already exist, it skips them without overwriting.*

### Step 3: (Optional) Import Existing Local Data
To migrate existing local mock attempts, applications, solutions, and avatars from `server/data/*.json` into PostgreSQL:
```bash
cd server
DATABASE_URL="your-neon-connection-string" npm run import-local -- --confirm
```
*The importer requires `--confirm`, preserves password hashes intact, and outputs only clean count summaries.*

### Step 4: Deploy Frontend (React + Vite Client on Vercel)
1. Open [`client/vercel.json`](client/vercel.json) and replace `REPLACE_WITH_API_DOMAIN` with your backend domain:
   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://devprep-api.vercel.app/api/:path*" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
2. In the Vercel Dashboard, create a new project and set the **Root Directory** to `client`.
3. Framework Preset: **Vite**. Build Command: `npm run build`. Output Directory: `dist`.
4. Click **Deploy**. All `/api/*` traffic is seamlessly proxied to the serverless backend.

---

## Automated Verification Test Suites

DevPrep features 12 standalone automated verification test suites written in plain Node.js (requiring zero external testing frameworks) that rigorously test all backend operations, concurrency locks, data privacy, and editor behaviors.

From the `server/` directory, run any test suite:

```bash
# 1. Test JSON File Storage Engine (Concurrency, Queues & Recovery)
npm run test:db

# 2. Test Storage Interface Contract & Concurrency (File & Postgres Drivers)
npm run test:contract

# 3. Test User Authentication, Password Hashing & RBAC
npm run test:auth

# 3. Test Question Repository, Dynamic Filters & Solve Status
npm run test:phase5

# 4. Test "My Solution" Multi-Language Notepad & User Privacy
npm run test:phase5b

# 5. Test Admin Question CRUD Operations & Schema Validation
npm run test:phase6

# 6. Test Internship & Job Application Pipeline CRUD
npm run test:phase7

# 7. Test Timed Mock Assessments, Randomization & Anti-Cheat
npm run test:phase8

# 8. Test Admin MCQ Bank CRUD, Limits & Snapshot Immutability
npm run test:phase8b

# 9. Test Student Dashboard Live Metric Aggregations
npm run test:phase9

# 10. Test Percentage Math, Rounding Rules & Zero-Division Safety
npm run test:percentage

# 11. Test Student Profile Settings, Skills Tags & Goals
npm run test:phase10

# 12. Test Client Test Runner, Server Safety & Validator Schemas
npm run test:phase10b

# 13. Test Code Editor Behaviors (Indent, Undo, Symbols, Ligatures)
npm run test:editor

# 14. Test WCAG AA Contrast Ratios Across All 4 Skin & Theme Combinations
npm run test:contrast

# 15. Test Profile Photo Upload, WebP/JPEG Canvas Re-encoding & Validation
npm run test:avatar

# 16. Comprehensive Final QA Verification Suites (Auth, Concurrency, Fresh Setup)
npm run test:qa:auth     # 25-check Auth & Security suite
npm run test:qa:data     # 17-check Concurrency & Storage engine suite
npm run test:qa:browser  # 101-check Responsive (360/768/1280/1920) & A11y suite
npm run test:qa:fresh    # Fresh installation simulation from clean git archive
npm run test:qa:all      # Run complete automated verification pass

> *For the complete quality assurance matrix, see [QA_REPORT.md](QA_REPORT.md).*
```

---

## REST API Specification

All backend endpoints are mounted under the `/api` namespace. Protected endpoints require a valid JSON Web Token supplied in the HTTP Authorization header: `Authorization: Bearer <token>`.

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register a new student account (hashes password with bcrypt) |
| `POST` | `/api/auth/login` | Public | Authenticate credentials and receive a 7-day JWT token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve the authenticated user's profile and role |

### Question Repository Endpoints (`/api/questions`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/questions` | Public | List questions with optional `?topic=&difficulty=&search=` filters |
| `GET` | `/api/questions/:id` | Public | Retrieve detailed question description, examples, and constraints |
| `POST` | `/api/questions` | Admin Only | Create a new coding question with examples and optional test cases |
| `PUT` | `/api/questions/:id` | Admin Only | Update an existing question |
| `DELETE` | `/api/questions/:id` | Admin Only | Delete question (cascading cleanup of associated solution notes) |

### Progress & Dashboard Endpoints (`/api/progress`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/progress` | Authenticated | Live aggregated summary (stats, topic proficiency, weekly activity) |
| `POST` | `/api/progress` | Authenticated | Action endpoint: `markSolved`, `unmarkSolved`, or `updateProfile` |

### "My Solution" Notes Endpoints (`/api/solutions`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/solutions` | Authenticated | Retrieve all saved solution notes for the authenticated user |
| `GET` | `/api/solutions/:questionId` | Authenticated | Retrieve user solutions for a specific question across languages |
| `PUT` | `/api/solutions/:questionId` | Authenticated | Save or update code note for a language (capped at 20,000 chars) |
| `DELETE` | `/api/solutions/:questionId`| Authenticated | Delete saved code note for a specific language |

### Mock Assessment Endpoints (`/api/mock-test`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/mock-test` | Authenticated | Sanitized question pool (answers & explanations stripped) |
| `GET` | `/api/mock-test/counts` | Authenticated | Active question capacity breakdown across DSA topics |
| `GET` | `/api/mock-test/attempts`| Authenticated | Historical assessment attempts and scorecards for the user |
| `POST` | `/api/mock-test/submit` | Authenticated | Submit answers for server grading and attempt record persistence |

### Job Application Endpoints (`/api/applications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/applications` | Authenticated | Retrieve authenticated user's job applications |
| `POST` | `/api/applications` | Authenticated | Create a new application entry |
| `PUT` | `/api/applications/:id` | Authenticated | Update an existing application |
| `DELETE` | `/api/applications/:id` | Authenticated | Delete an application |

### Admin MCQ Bank Endpoints (`/api/admin/mcq`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/mcq` | Admin Only | List all MCQs with `correctIndex` and `explanation` |
| `GET` | `/api/admin/mcq/:id` | Admin Only | Retrieve a single MCQ record |
| `POST` | `/api/admin/mcq` | Admin Only | Create a new multiple-choice question |
| `PUT` | `/api/admin/mcq/:id` | Admin Only | Update an existing MCQ record |
| `DELETE` | `/api/admin/mcq/:id` | Admin Only | Delete an MCQ record |

---

## Design System & Multi-Skin Architecture

DevPrep strictly avoids generic, AI-generated design trends (such as purple/indigo gradients, heavy drop shadows, glowing neon borders, and emoji icons). It features a modular multi-skin architecture with two distinct visual identities:

### 1. "Paper" Skin (Editorial Notebook)
- **Concept:** Inspired by physical engineering notebooks and warm paper surfaces with rich ink contrast.
- **Palette:** Warm off-white (`#F4EFE6`), card surface (`#FBF8F2`), ink text (`#26211B`), terracotta accent (`#B5472B`). Dark mode uses warm charcoal (`#151310`) and luminous terracotta (`#E07A55`).
- **Typography:** Young Serif (Headings, 400), Hanken Grotesk (Body & UI), IBM Plex Mono (Code & Timer).

### 2. "Studio" Skin (Modern Precision)
- **Concept:** Modern precision engineering workbench with clean cool surfaces, cobalt blue accent, and sharp typography.
- **Palette:** Neutral workbench (`#F8F7F4`), card surface (`#FDFDFB`), deep zinc text (`#18181B`), cobalt blue accent (`#2B44B8`). Dark mode uses deep slate (`#121316`) and electric periwinkle (`#8FA6FF`). Never uses pure `#000` or `#FFF`.
- **Typography:** Bricolage Grotesque (Headings, 600 with optical sizing), Plus Jakarta Sans (Body & UI), JetBrains Mono (Code & Timer).

### Accessibility Highlights (WCAG AA)
- **Zero-Flash Theme & Skin Loading (FOIT):** An inline script inside `index.html` inspects `localStorage` for `devprep-skin` and `devprep-theme` (along with OS `prefers-color-scheme`) before React mounts, completely eliminating blinding theme flashes.
- **Verified Contrast:** All text, muted text, buttons, and status pills achieve $\ge 4.5:1$ contrast across all 4 theme combinations (verified by `npm run test:contrast`).
- **Universal Keyboard Focus:** Every interactive control uses `--focus-ring` (`box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent)`).
- **Accessible Off-Canvas Drawer:** The mobile sidebar drawer traps focus, locks background body scrolling, dismisses on `Escape`, and restores focus to the triggering hamburger button.
- **Motion Safety:** Comprehensive `@media (prefers-reduced-motion: reduce)` rules disable all transitions and animations.

### How to Revert the Theme
If you ever want to revert from the Studio skin back to the original Paper skin, you can do so in three simple ways:

1. **Via UI (Instant, No Reload):**
   Open **Profile & Settings > Appearance & Theme** and click the **"Paper"** skin card. The entire app switches back immediately.
2. **Via Config File (Developer Revert):**
   In `client/src/config/theme.js`, ensure `export const DEFAULT_SKIN = 'paper';` and remove the `devprep-skin` key in your browser (`localStorage.removeItem('devprep-skin')`).
3. **Via Git Tag / Branch (Codebase Baseline):**
   Switch directly to the tagged baseline commit:
   ```bash
   git checkout theme-paper-v1
   ```
   Or switch back to the master branch:
   ```bash
   git checkout master
   ```

---

## Security & Sandbox Architecture

1. **Password Protection:** User passwords are encrypted using `bcryptjs` with 10 salt rounds. Passwords are never stored in plain text, logged to standard output, or returned in any API response.
2. **Stateless Session Management:** JWT tokens are signed using a secure secret key (`JWT_SECRET`) and expire after 7 days.
3. **Defense in Depth (RBAC):** While administrator navigation links are conditionally rendered in the UI, all write operations on `/api/questions` and `/api/admin/mcq` enforce `requireAuth` and `requireAdmin` checks on the server, returning `403 Forbidden` for standard student accounts.
4. **Data Isolation:** All student notes, progress, mock test attempts, and internship applications are partitioned strictly by `req.user.id`. The backend rejects attempts to manipulate or query data belonging to other accounts.
5. **Client-Side Worker Sandbox Safety:**
   - User-written JavaScript runs **strictly in the browser** inside an isolated HTML5 Web Worker.
   - The Express backend contains **zero instances** of `eval`, `new Function`, `vm`, or `child_process`.
   - The Web Worker revokes browser network APIs (`fetch`, `XMLHttpRequest`, `WebSocket`, `importScripts`, `indexedDB`) prior to script evaluation.
   - A hard 2.0-second timer terminates rogue loops before they can affect client responsiveness.

---

## Academic Integrity & Project Scope

This project was conceived, designed, and implemented as an **academic full-stack engineering project for B.Tech Computer Science & Engineering**.

- **No Fictitious Claims:** DevPrep does not claim integrations with external commercial platforms, fake corporate sponsorships, or unverified certificates.
- **Honest Data Architecture:** The application does not use external database management systems (MongoDB, PostgreSQL, Firebase); all persistence is transparently managed via the file-based atomic JSON write-queue engine (`server/utils/fileDb.js`).
- **Verifiable Codebase:** Every feature detailed in this specification is fully functional and accompanied by automated regression test suites that can be verified locally.

---

*DevPrep — Built for B.Tech CSE Placement & Interview Preparation.*
