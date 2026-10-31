# DevPrep: Context Memory

## Project Summary
DevPrep is a full-stack developer preparation platform built for a college project (B.Tech CSE). It features a DSA problem library with topic-wise tracking, a personal multi-language "My Solution" code notepad, timed multiple-choice mock tests with server-side grading, an internship/job application tracker, a profile with skills and goals, an admin question management system, and a dashboard with Recharts visualizations. Built with React (Vite) on the frontend and Node.js (Express) on the backend using JSON file storage (`server/data/`) with atomic writes and write-queue concurrency management. Design strictly follows a warm "Paper and Ink" aesthetic with a zero-flash light/dark theme system and flat UI colors (no glow, no gradients).

---

## Current Phase
**Repository Cleanup, Data Split Architecture & Git History Sanitization** (Completed — Tracked MCQ bank split from ignored attempts, all live user data git-ignored, self-contained idempotent seed script, complete reflog and history purge verified, fresh-clone validated)

---

## Completed Phases

### Phase 1: Project Setup, Environments & Git Baseline
- **What was built:**
  - Initialized Git repository with comprehensive `.gitignore` ensuring `node_modules` and `server/.env` are strictly excluded from version control.
  - Built Express backend scaffolding in `server/` with `cors`, `dotenv`, JSON body parsing, and a test `/api/health` endpoint.
  - Created `server/.env.example` and local `server/.env` template.
  - Built Vite React frontend in `client/` configured with a dev proxy mapping `/api` to `http://localhost:5000`.
  - Added Google Fonts (Fraunces, DM Sans, JetBrains Mono), Design.md CSS variables, and an inline anti-flash (FOIT) theme script to `client/index.html` and `client/src/index.css`.
  - Built `client/src/App.jsx` baseline component demonstrating end-to-end communication with the backend through the Vite proxy.
  - Committed baseline to Git: `e45e443`.
- **Files created/changed:** `.gitignore`, `server/package.json`, `server/.env.example`, `server/.env`, `server/server.js`, `client/package.json`, `client/vite.config.js`, `client/index.html`, `client/src/main.jsx`, `client/src/App.jsx`, `client/src/index.css`.

### Phase 2: Backend Foundation, File DB Engine & Health Route
- **What was built:**
  - Built `server/utils/fileDb.js` providing `readJson` (with fallback and corrupted file safety) and `writeJson` (atomic write-to-temp-then-rename with per-file Promise queue). Added transient Windows file-lock retry and fallback (`copyFile` + `unlink`) to prevent EPERM collisions on Windows/OneDrive.
  - Built `server/utils/validators.js` with enums for topics, difficulties, application statuses, and progress actions, plus validation helpers for email, password rules (8+ chars, letter, number), and required fields.
  - Built `server/middleware/errorHandler.js` central error handler enforcing consistent `{ "error": "message" }` responses with proper status codes.
  - Built `server/middleware/notFound.js` returning 404 with `{ "error": "Cannot [METHOD] [PATH] - Endpoint Not Found" }`.
  - Modularized `server/routes/healthRoutes.js` and mounted all middleware in `server/server.js`.
  - Created standalone test script `server/scripts/test-fileDb.js` covering basic read/write, missing-file fallback creation, 15 concurrent writes, and corrupted JSON recovery.
- **Files created/changed:** `server/utils/fileDb.js`, `server/utils/validators.js`, `server/middleware/errorHandler.js`, `server/middleware/notFound.js`, `server/routes/healthRoutes.js`, `server/server.js`, `server/data/.gitkeep`, `server/scripts/test-fileDb.js`, `server/package.json`.

### Phase 3: Authentication & Authorization Backend
- **What was built:**
  - Built `server/middleware/auth.js` providing `requireAuth` (verifies `Bearer <token>` against `JWT_SECRET` and attaches `req.user = { id, role }`) and `requireAdmin` (validates `req.user.role === 'admin'`).
  - Built `server/controllers/authController.js` implementing `signup` (with input checks, lowercase email, 409 conflict detection, bcrypt 10 salt rounds, and auto-provisioned user progress in `progress.json`), `login` (constant-time comparison and unified 401 error message), and `getMe` (safe profile lookup).
  - Built `server/routes/authRoutes.js` exposing `POST /signup`, `POST /login`, and `GET /me`. Mounted under `/api/auth` in `server/server.js`.
  - Created initial incremental database seeder `server/scripts/seed.js` hashing passwords and provisioning default admin (`admin@devprep.com` / `Admin@1234`) and demo student (`demo@devprep.com` / `Demo@1234`) in `users.json` and `progress.json`.
  - Created plain Node integration test script `server/scripts/test-auth.js` (`npm run test:auth`) verifying the complete auth lifecycle.
- **Files created/changed:** `server/middleware/auth.js`, `server/controllers/authController.js`, `server/routes/authRoutes.js`, `server/server.js`, `server/scripts/seed.js`, `server/scripts/test-auth.js`, `server/data/users.json`, `server/data/progress.json`, `server/package.json`.

### Phase 4: Frontend Shell, Theming & Auth Flow
- **What was built:**
  - Built `client/src/services/api.js` central API client managing JWT Bearer injection and 401 unauthorized session cleanup.
  - Built `client/src/context/ThemeContext.jsx` with light/dark state, localStorage persistence, and html `data-theme` synchronization without layout flash.
  - Built `client/src/context/AuthContext.jsx` managing user session, login, signup, logout, and automatic session restoration via `GET /api/auth/me`.
  - Built shared UI components conforming to Design.md: `ThemeToggle.jsx` (accessible Sun/Moon), `Sidebar.jsx` (232px fixed sidebar with active state and conditional Admin link), `Layout.jsx` (app shell with mobile drawer and top bar), `ProtectedRoute.jsx`, `AdminRoute.jsx`, `Loader.jsx`, and `ErrorMessage.jsx`.
  - Built complete `Login.jsx` and `Signup.jsx` pages with two-column desktop layouts, real-time password requirement checklists, and demo credentials filler.
  - Implemented complete `client/src/index.css` design system with warm paper palette, button states, form styles, and responsive drawer adaptations.
  - Tested production bundle with `npx vite build` (1517 modules transformed, built with 0 errors).
- **Files created/changed:** `client/src/services/api.js`, `client/src/context/ThemeContext.jsx`, `client/src/context/AuthContext.jsx`, `client/src/components/ThemeToggle.jsx`, `client/src/components/Sidebar.jsx`, `client/src/components/Layout.jsx`, `client/src/components/ProtectedRoute.jsx`, `client/src/components/AdminRoute.jsx`, `client/src/components/Loader.jsx`, `client/src/components/ErrorMessage.jsx`, `client/src/pages/Login.jsx`, `client/src/pages/Signup.jsx`, `client/src/pages/Dashboard.jsx`, `client/src/pages/Problems.jsx`, `client/src/pages/MockTest.jsx`, `client/src/pages/Applications.jsx`, `client/src/pages/Profile.jsx`, `client/src/pages/AdminQuestions.jsx`, `client/src/App.jsx`, `client/src/index.css`.

### Phase 5: Questions API, Problem Library & Problem Details
- **What was built:**
  - Extended `server/scripts/seed.js` with 36 curated DSA questions (4 per topic across all 9 required topics) into `questions.json`.
  - Seeded demo student progress with 8 solved questions, streak of 3 days, and activity feed in `progress.json`.
  - Built `server/controllers/questionController.js` and `server/routes/questionRoutes.js` supporting multi-parameter filtering (`topic`, `difficulty`, `search`) and ID lookups.
  - Built `server/controllers/progressController.js` and `server/routes/progressRoutes.js` supporting `GET /api/progress` and `POST /api/progress` with actions `markSolved` and `unmarkSolved`, managing stored streak.
  - Built UI components: `DifficultyBadge.jsx`, `ProgressBar.jsx`, `QuestionTable.jsx`.
  - Built full `Problems.jsx` page and `ProblemDetails.jsx` page.
- **Files created/changed:** `server/data/questions.json`, `server/scripts/seed.js`, `server/controllers/questionController.js`, `server/routes/questionRoutes.js`, `server/controllers/progressController.js`, `server/routes/progressRoutes.js`, `server/server.js`, `server/scripts/test-phase5.js`, `server/package.json`, `client/src/services/api.js`, `client/src/components/DifficultyBadge.jsx`, `client/src/components/ProgressBar.jsx`, `client/src/components/QuestionTable.jsx`, `client/src/pages/Problems.jsx`, `client/src/pages/ProblemDetails.jsx`, `client/src/App.jsx`, `client/src/index.css`.

### Phase 5B: "My Solution" Code Notepad & Solutions API
- **What was built:**
  - Updated specification docs (`PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`) documenting the "My Solution" safe code notepad feature.
  - Created `server/data/solutions.json` schema: `{ id, userId, questionId, language, code, updatedAt }`.
  - Added `SOLUTIONS` constant to `fileDb.js` and `ALLOWED_LANGUAGES = ['JavaScript', 'Python', 'Java', 'C++']`, `MAX_CODE_LENGTH = 20000` to `validators.js`.
  - Built `server/controllers/solutionController.js` and `server/routes/solutionRoutes.js` (`GET /api/solutions`, `GET /api/solutions/:questionId`, `PUT /api/solutions/:questionId`, `DELETE /api/solutions/:questionId?language=...`), all strictly scoped to `req.user.id`.
  - Mounted `/api/solutions` in `server/server.js`.
  - Extended `seed.js` to seed a sample solution for demo user on Two Sum.
  - Extended `client/src/services/api.js` with solutions API methods.
  - Built "My Solution" section in `client/src/pages/ProblemDetails.jsx` with monospace textarea, Tab key indentation, multi-language draft retention, unsaved changes indicator, "Saved at <time>" timestamp, character count, and Clear confirmation.
  - Updated `client/src/components/QuestionTable.jsx` and `client/src/pages/Problems.jsx` to render a "Solution" pill for questions with saved code.
  - Created standalone automated test suite `server/scripts/test-phase5b.js` (`npm run test:phase5b`) verifying CRUD, question 404, invalid language 400, max length 400, and multi-tenant data privacy.
- **Files created/changed:** `PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `server/data/solutions.json`, `server/utils/fileDb.js`, `server/utils/validators.js`, `server/controllers/solutionController.js`, `server/routes/solutionRoutes.js`, `server/server.js`, `server/scripts/seed.js`, `server/scripts/test-phase5b.js`, `server/package.json`, `client/src/services/api.js`, `client/src/pages/ProblemDetails.jsx`, `client/src/components/QuestionTable.jsx`, `client/src/pages/Problems.jsx`, `client/src/index.css`.

### Phase 6: Admin Question Management (CRUD)
- **What was built:**
  - Built `createQuestion`, `updateQuestion`, and `deleteQuestion` in `server/controllers/questionController.js` with validation for `title`, `topic` enum, `difficulty` enum, `description`, dynamic example arrays, constraints, and ID generation (`q-${slug}-${timestamp}`).
  - Protected `POST /api/questions`, `PUT /api/questions/:id`, and `DELETE /api/questions/:id` in `server/routes/questionRoutes.js` using `requireAuth` and `requireAdmin` middleware.
  - Added cascading cleanup: deleting a question automatically purges associated user solutions in `solutions.json`.
  - Extended `client/src/services/api.js` with `createQuestion`, `updateQuestion`, and `deleteQuestion`.
  - Built accessible `Modal.jsx` confirmation dialog supporting Escape-key dismissal, backdrop close, focus management, and danger styling.
  - Built dual-mode `client/src/pages/QuestionForm.jsx` supporting both creation (`/admin/questions/new`) and editing (`/admin/questions/:id/edit`) with dynamic test-case example rows (+ Add / Remove) and constraint rows (+ Add / Remove).
  - Built full `client/src/pages/AdminQuestions.jsx` table with real-time text search, topic & difficulty dropdown filters, loading/error/empty states, delete confirmation modal, and success notifications.
  - Registered `/admin/questions/new` and `/admin/questions/:id/edit` inside `<AdminRoute>` in `client/src/App.jsx`.
  - Added complete responsive styling for modals, dynamic form cards, and admin table action buttons in `client/src/index.css`.
  - Created standalone verification test script `server/scripts/test-phase6.js` (`npm run test:phase6`) verifying 401 unauthenticated, 403 student forbidden, 400 validation, 201 creation, 200 update, 200 deletion, and 404 lookup.
  - **Shared Form Controls & Filter Toolbar Polish (Bugfix):**
    - Configured `color-scheme: light` on `:root` and `color-scheme: dark` on `[data-theme="dark"]` for native dropdown popup theming.
    - Added universal form control styles for all `input`, `select`, and `textarea` elements: `--surface-2` background, 1px `--border`, 6px radius, 40px height, `--text` color, muted placeholder, and 2px `--accent` focus ring.
    - Implemented custom SVG chevron icon for selects with `appearance: none`.
    - Implemented `.search-input-wrapper` with icon inside on left (`padding-left: 40px`) and full-width flexible sizing.
    - Implemented unified `.filters-toolbar` / `.admin-filter-bar` layout: flexible search on left, two selects on right with 12px gap, collapsing to stacked full-width layout under 700px.
    - Audited all pages (`Login`, `Signup`, `Problems`, `ProblemDetails`, `AdminQuestions`, `QuestionForm`, `Modal`) for input/button consistency and removed all hardcoded hex colors (`#FFFFFF`, `#356b42`), using strictly CSS variables.
- **Files created/changed:**
  - `server/controllers/questionController.js`
  - `server/routes/questionRoutes.js`
  - `server/package.json`
  - `server/scripts/test-phase6.js`
  - `client/src/services/api.js`
  - `client/src/components/Modal.jsx`
  - `client/src/pages/QuestionForm.jsx`
  - `client/src/pages/AdminQuestions.jsx`
  - `client/src/pages/Problems.jsx`
  - `client/src/App.jsx`
  - `client/src/index.css`
  - `Memory.md`

### Phase 7: Job & Internship Application Tracker
- **What was built:**
  - Created `server/data/applications.json` initialized with `[]`.
  - Extended `server/scripts/seed.js` with 5 sample applications for demo student (`user-demo-default`) across Google, Microsoft, Amazon, Uber, and Razorpay with varying statuses.
  - Built `server/controllers/applicationController.js` and `server/routes/applicationRoutes.js` implementing user-scoped CRUD (`GET /api/applications`, `POST /api/applications`, `PUT /api/applications/:id`, `DELETE /api/applications/:id`) with sorting, multi-param search, and enum validation.
  - Mounted `/api/applications` in `server/server.js`.
  - Extended `client/src/services/api.js` with `getApplications`, `createApplication`, `updateApplication`, and `deleteApplication`.
  - Built `client/src/components/ApplicationModal.jsx` supporting both create and edit modes, company input autofocus, inline validation on required fields, Esc key listener, and click-outside dismissal.
  - Built complete `client/src/pages/Applications.jsx` page featuring:
    - 5 dynamic status count chips (`All`, `Applied`, `Interview`, `Selected`, `Rejected`) that filter the table when clicked.
    - Responsive search input with inside left icon and clear `×` button.
    - Status select dropdown and Reset filters button.
    - Data table displaying Company with notes preview, Role, Location with pin icon, Applied Date formatted, Status badges, and Edit/Delete action buttons.
    - Full loading, error, and empty states.
    - Delete confirmation modal using `Modal.jsx`.
    - Toast feedback notifications for creation, update, and deletion.
  - Added comprehensive responsive styling in `client/src/index.css` for status count chips, status badges, application table cells, and form modals.
  - Created standalone automated test suite `server/scripts/test-phase7.js` (`npm run test:phase7`) verifying 401 unauthenticated, 5 seeded applications, status filtering, search querying, 400 validation, 201 creation, 200 update, strict user data isolation, and 200 deletion.
- **Files created/changed:**
  - `server/data/applications.json`
  - `server/scripts/seed.js`
  - `server/controllers/applicationController.js`
  - `server/routes/applicationRoutes.js`
  - `server/server.js`
  - `server/package.json`
  - `server/scripts/test-phase7.js`
  - `client/src/services/api.js`
  - `client/src/components/ApplicationModal.jsx`
  - `client/src/pages/Applications.jsx`
  - `client/src/index.css`
  - `Memory.md`

### Phase 8: Timed Mock Tests Engine & Scorecards
- **What was built:**
  - Extended `server/scripts/seed.js` with 45 curated multiple-choice DSA questions across 9 required topics (5 per topic) with options, `correctIndex`, and educational explanations in `server/data/mockTests.json`. Seeded 2 past attempts for demo student.
  - Built `server/controllers/mockTestController.js`:
    - `getMockTest`: Anti-cheat sanitized endpoint (`correctIndex` and `explanation` stripped from response so answers cannot be inspected in DevTools/network tab). Implements Fisher-Yates shuffle and question count limiting (5, 10, 15, 20).
    - `submitMockTest`: Server-side evaluation comparing student selections against source of truth. Computes score, accuracy percentage, time taken, and topic-wise breakdown (`{ topic: { total, correct } }`). Persists attempt to `mockTests.json` write queue. Returns attempt summary with detailed review list.
    - `getUserAttempts`: Returns authenticated user's attempt history sorted by date descending.
  - Built `server/routes/mockTestRoutes.js` mounted at `/api/mock-test` in `server/server.js` with `requireAuth`.
  - Added automated test suite `server/scripts/test-phase8.js` (`npm run test:phase8`) testing 401 unauthenticated, anti-cheat sanitization, topic filtering, server-side grading, attempt persistence, and user history.
  - Extended `client/src/services/api.js` with `getMockTest`, `submitMockTest`, and `getMockTestAttempts`.
  - Built `client/src/pages/MockTest.jsx`:
    - Assessment setup card with topic selector (All Topics or individual topic) and question count pills (5, 10, 15, 20).
    - Test rules banner detailing anti-cheat and 90s-per-question countdown.
    - User past attempts table with date, topic, score fraction, accuracy pill (moss/ochre/brick), and time taken.
    - Timed test runner with Fraunces question display, countdown timer badge with urgent pulse when under 60 seconds, horizontal question navigation strip with answered/unanswered/current status pills, 4 option cards with accent radio markers and selected styling, and previous/next/submit controls.
    - Auto-submission with modal overlay on timer expiration.
  - Built `client/src/pages/TestResult.jsx`:
    - Large score fraction (`8/10`) and accuracy percentage in Fraunces serif font.
    - Topic-wise breakdown bars showing accuracy progress per topic.
    - Comprehensive review cards: Moss-tinted for correct answers, Brick-tinted for incorrect answers, and Neutral for unanswered questions. Each card displays the question, student selected option, correct option badge, and educational explanation block.
    - Quick actions to retake assessment or return to dashboard.
  - Registered `/mock-tests/result` inside `<ProtectedRoute>` in `client/src/App.jsx`.
  - Added Phase 8 styling in `client/src/index.css` following Design.md "Warm Paper and Ink" palette.
- **Files created/changed:**
  - `server/data/mockTests.json`
  - `server/scripts/seed.js`
  - `server/controllers/mockTestController.js`
  - `server/routes/mockTestRoutes.js`
  - `server/server.js`
  - `server/package.json`
  - `server/scripts/test-phase8.js`
  - `client/src/services/api.js`
  - `client/src/pages/MockTest.jsx`
  - `client/src/pages/TestResult.jsx`
  - `client/src/App.jsx`
  - `client/src/index.css`
  - `Memory.md`

### Phase 8B: Admin MCQ Bank Management
- **What was built:**
  - Built `server/controllers/adminMcqController.js` and `server/routes/adminMcqRoutes.js` providing admin-only MCQ management (`GET /api/admin/mcq`, `GET /api/admin/mcq/:id`, `POST /api/admin/mcq`, `PUT /api/admin/mcq/:id`, `DELETE /api/admin/mcq/:id`) guarded by `requireAuth` + `requireAdmin`.
  - Implemented strict server-side validation: valid topic enum, question (1..500 chars), options (2..6 unique, non-empty, max 200 chars each), correctIndex (valid integer index), explanation (max 500 chars), and 409 Conflict rejection for duplicate questions in the same topic.
  - Preserved anti-cheat: `GET /api/mock-test` continues to strictly strip `correctIndex` and `explanation`.
  - Added `getTopicCounts` (`GET /api/mock-test/counts`) to `mockTestController.js` exposing active question counts per topic for inventory capacity checking.
  - Guaranteed immutable past attempts: `submitMockTest` saves a full review snapshot in `attempt.reviews` at submission time; `TestResult.jsx` defensively handles deleted questions with graceful notices (`"This question was removed from the active question bank"`).
  - Extended `client/src/services/api.js` with admin MCQ CRUD and topic inventory endpoints.
  - Built `client/src/components/McqModal.jsx` supporting 2..6 dynamic options with "+ Add" and "Remove" controls, radio button selector for `correctIndex`, character counters, and inline validation.
  - Built `client/src/pages/AdminMcq.jsx` featuring:
    - Admin header sub-tabs navigating between "DSA Questions" and "MCQ Bank".
    - Topic question inventory breakdown summary with warning badges for topics with fewer than 5 questions.
    - Clickable topic pills to instantaneously filter questions.
    - Responsive search input and topic filter dropdown styled with universal form controls.
    - MCQ data table with question preview, topic badge, options count, and correct answer indicator.
    - Delete confirmation dialog via `Modal.jsx` and feedback toasts on save and delete.
  - Updated `client/src/pages/MockTest.jsx` to dynamically cap question count to available topic inventory, display `"Only N questions available for this topic"`, and disable start if inventory is 0.
  - Added "MCQ Bank" sub-link in `Sidebar.jsx` and registered `/admin/mcq` inside `<AdminRoute>` in `client/src/App.jsx`.
  - Added Phase 8B CSS rules in `client/src/index.css`.
  - Built standalone automated test suite `server/scripts/test-phase8b.js` (`npm run test:phase8b`).
- **Files created/changed:**
  - `PRD.md`
  - `Architecture.md`
  - `Phases.md`
  - `server/controllers/adminMcqController.js`
  - `server/routes/adminMcqRoutes.js`
  - `server/controllers/mockTestController.js`
  - `server/routes/mockTestRoutes.js`
  - `server/server.js`
  - `server/package.json`
  - `server/scripts/test-phase8b.js`
  - `client/src/services/api.js`
  - `client/src/components/McqModal.jsx`
  - `client/src/pages/AdminMcq.jsx`
  - `client/src/components/Sidebar.jsx`
  - `client/src/pages/MockTest.jsx`
  - `client/src/pages/TestResult.jsx`
  - `client/src/App.jsx`
  - `client/src/index.css`
  - `Memory.md`

### Phase 8B Polish & UI Pass: Admin Layout, Portal Modals & Universal Table System
- **What was built:**
  - **Shared React Portal Modal (`Modal.jsx`):** Refactored to render directly into `document.body` via `ReactDOM.createPortal`. Features fixed viewport overlay with high z-index (1000), 10px radius, `--surface` background, fixed header and footer with scrollable body (24px padding), background body scroll lock (`document.body.style.overflow = 'hidden'`), focus trap, focus restoration on close, Escape key and backdrop dismissal with unsaved changes confirmation dialog (`hasUnsavedChanges`), and 150ms animation respecting `prefers-reduced-motion`. Refactored `McqModal.jsx` and `ApplicationModal.jsx` to wrap `Modal.jsx`.
  - **Persistent Admin Navigation (`AdminLayout.jsx`):** Created shared admin layout hosting a persistent segmented tab bar ("Coding Questions" | "MCQ Bank") styled with `--accent-soft` background and `--accent` text for the active tab. Eliminates component unmounting between admin subpages. Auto-scrolls to top and applies 150ms content fade-in on route transitions.
  - **Single Sidebar Item:** Replaced separate sidebar sub-links with a single unified "Admin" link in `Sidebar.jsx`, styled consistently with standard navigation items.
  - **Zero-Shift In-Memory Session Cache (`adminCache.js`):** Caches questions and MCQ records in memory during the active browser session, refreshing in the background to completely eliminate blank page flashes on tab switches. Replaced loading spinners on list pages with table skeleton rows that exactly match real row heights.
  - **Universal Table & Ghost Button System:**
    - Standardized tables across `AdminQuestions.jsx`, `AdminMcq.jsx`, `QuestionTable.jsx` (Problems), and `Applications.jsx` with consistent header styles, 14px 16px row padding, 1px dividers, and `--surface-2` hover states.
    - Clamped question and problem titles to 2 lines.
    - Implemented ghost-style 32px action buttons (`.btn-icon-ghost` and `.btn-icon-ghost-danger` with brick hover) replacing filled gray buttons.
    - Transformed tables into responsive stacked cards with `data-label` headers under 700px.
- **Files created/changed:**
  - `client/src/components/Modal.jsx`
  - `client/src/components/McqModal.jsx`
  - `client/src/components/ApplicationModal.jsx`
  - `client/src/components/AdminLayout.jsx`
  - `client/src/services/adminCache.js`
  - `client/src/pages/AdminQuestions.jsx`
  - `client/src/pages/AdminMcq.jsx`
  - `client/src/components/Sidebar.jsx`
  - `client/src/App.jsx`
  - `client/src/components/QuestionTable.jsx`
  - `client/src/pages/Applications.jsx`
  - `client/src/index.css`
  - `Memory.md`

### Phase 9: Student Analytics & Activity Dashboard (Recharts)
- **What was built:**
  - **Live Aggregation Backend (`server/controllers/progressController.js`):**
    - Enhanced `getProgress` to compute dynamic on-the-fly aggregations across authoritative data stores (`questions.json`, `mockTests.json`, `applications.json`, `progress.json`).
    - Computed and returned live `stats`: total solved questions count, total library questions count, current streak, longest streak, mock tests completed, and applications tracked.
    - Computed live `topicProgress` across all 9 canonical DSA topics (`Arrays`, `Strings`, `Linked Lists`, `Trees`, `Dynamic Programming`, `Graphs`, `Stacks & Queues`, `Recursion`, `Bit Manipulation`) with solved count, topic total, and integer percentage.
    - Computed 7-day rolling `weeklyActivity` series with day abbreviations (`Mon`, `Tue`, etc.), ISO date stamps, and solved count tallies.
    - Maintained recent chronological `recentActivity` event stream with timestamps and action tags.
  - **Dashboard Components (`client/src/components/` & `client/src/pages/`):**
    - `StatCard.jsx`: Built conforming to Design.md Section 6 with uppercase muted 11px label, 34px Fraunces serif metric number, context subnote, unboxed category icon, and subtle border hover.
    - `WeeklyChart.jsx`: Clean Recharts implementation using `ResponsiveContainer`, `BarChart`, `XAxis`, `YAxis`, and `Bar` styled with flat `var(--accent)` fill (strictly no gradients or glow per Design.md). Custom HTML tooltip (`CustomChartTooltip`) styled with `--surface` and 1px `--border`.
    - `ActivityFeed.jsx`: Interactive timeline feed with status indicators (`marker-icon-solved`), relative timestamp formatting (`formatTimeAgo`), and empty state.
    - `Dashboard.jsx`: Hero welcome header with student greeting, 4 stat cards grid (Problems Solved, Day Streak, Mock Tests Taken, Applications Active), middle two-column grid (Topic Proficiency progress bars + 7-Day Solve Activity chart), and bottom two-column grid (Recent Practice Activity feed + Quick Action navigation cards).
  - **Styling (`client/src/index.css`):**
    - Appended complete Phase 9 CSS styling for `.dashboard-page`, `.dashboard-stats-grid`, `.stat-card`, `.dashboard-middle-grid`, `.topic-bars-list`, `.weekly-chart-card`, `.dashboard-bottom-grid`, `.activity-timeline`, and `.quick-actions-list`.
    - Responsive grid breakpoints at 1024px (stacked charts) and 600px (single column stat cards and timeline items).
  - **Automated Test Suite (`server/scripts/test-phase9.js`):**
    - Registered `"test:phase9": "node scripts/test-phase9.js"` in `server/package.json`.
    - Verifies 401 unauthenticated requests, demo user metrics (8 solved, streak 3, 2 tests, 5 applications), topic breakdown (Arrays: 2/4 = 50%), 7-day weekly activity series, and live dynamic increments/decrements on problem solve toggles.
  - **Production Build:**
    - Verified clean build via `vite build` with 0 errors (2331 modules transformed).
  - **Phase 9 Polish & Bugfix (Dashboard Topic Proficiency & Percentage Sync):**
    - **Root Cause Identified:** `ProgressBar.jsx` declared props `{ current = 0, total = 0, label }` and recomputed `Math.round((current / total) * 100)`. `Dashboard.jsx` passed `percentage={t.percentage}` instead of `current` and `total`, causing `total` to default to 0 and yielding `0%` and empty width.
    - **Single Shared Field Contract:** Unified both backend and frontend on `percent` (whole number 0 to 100), with `percentage` maintained as an alias.
    - **Dynamic Totals & Deleted Question Protection:** Updated `progressController.js` to cross-reference `userProgress.solvedQuestionIds` against current active `questions.json` records so deleted questions are completely ignored in both `totalSolved` and topic metrics. Topic totals dynamically reflect any questions added or deleted by the admin.
    - **Activity Feed & Unmark Synchronization:** Combined problem solves and mock test attempts into a unified chronological feed. Unmarking a problem cleans up its activity log entry.
    - **Real-Time Cross-Page Sync:** Added `devprep-progress-updated` custom event and `focus` listener so solving/unsolving problems immediately refreshes the Dashboard without a manual page reload.
    - **Automated Check:** Created `server/scripts/test-percentage.js` (`npm run test:percentage`) testing 0/4, 1/4, 2/4, 4/4, 0/0, 1/3, 2/3, and 3/4.
- **Files created/changed:**
  - `server/controllers/progressController.js`
  - `server/package.json`
  - `server/scripts/test-phase9.js`
  - `server/scripts/test-percentage.js`
  - `client/src/components/ProgressBar.jsx`
  - `client/src/components/StatCard.jsx`
  - `client/src/components/WeeklyChart.jsx`
  - `client/src/components/ActivityFeed.jsx`
  - `client/src/pages/Dashboard.jsx`
  - `client/src/services/api.js`
  - `client/src/index.css`
  - `Memory.md`

### Phase 10: Profile & Settings
- **What was built:**
  - **Backend Profile Validation & Persistence (`server/controllers/progressController.js`):**
    - Enhanced `POST /api/progress` when `action === "updateProfile"` to validate and persist `skills`, `goals`, `theme`, and academic profile fields (`college`, `branch`, `graduationYear`, `targetRole`, `weeklyGoal`).
    - Input sanitation: non-empty trimmed strings, max 30 skills (max 30 chars each), max 15 goals (max 100 chars each), theme enum (`'light'` | `'dark'`), graduation year 2020–2035, and weekly goal integer 1–50.
    - Added safe profile defaults in `createDefaultProgress()` and `getProgress()` fallback injection.
  - **Reusable Tag and Goal Components (`client/src/components/`):**
    - `SkillTagsInput.jsx`: Dynamic skill chips with keyboard addition (Enter key), remove buttons, duplicate prevention, character caps, and quick-add popular technical skill pills (`+ React`, `+ Node.js`, `+ Python`, etc.).
    - `GoalsListEditor.jsx`: Milestone goal editor with numbering, target icons, delete action, input validation, and suggested placement goals (`+ Crack SDE Internship 2026`, etc.).
  - **Full Profile Page (`client/src/pages/Profile.jsx`):**
    - Plain circular initials avatar (e.g. `DS` for Demo Student, serif Fraunces font, no photo per Design.md).
    - User metadata header (name, email, role badge: Student / Administrator, graduation class).
    - Compact 4-stat overview strip (Problems Solved, Active Streak, Mock Tests, Applications).
    - Academic details card (College, Branch, Graduation Year selector).
    - Career targets card (Target Role, Weekly Problem Goal).
    - Placement milestones card using `GoalsListEditor`.
    - Technical skills card using `SkillTagsInput`.
    - Appearance settings card with interactive Light / Dark theme radio cards.
    - Account security card displaying verified email, role, and masked password info.
    - Sticky Save Changes button with unsaved changes detection (`● Unsaved changes`) and auto-dismissing success banner.
  - **Profile View / Edit Mode Refactoring (Phase 10 UX Polish):**
    - **View Mode by Default:** On initial load and after successful save, all profile fields (College, Branch, Graduation Year, Target Role, Weekly Goal, Skills, Goals) render as plain text, read-only tags, and static lists with empty-state indicators (e.g. "Not specified", "No skills added yet", "No placement goals set yet"). A single secondary "Edit Profile" button is displayed in the top bar.
    - **Edit Mode:** Replaces view text with form controls, displays primary "Save changes" and secondary "Cancel" buttons, and hides the "Edit Profile" button.
    - **Skills Tag Input:** Supports Enter or comma (`,`) delimiter, trims whitespace, prevents case-insensitive duplicates, and enforces maximum 15 tags of 30 characters each.
    - **Goals Editor:** Dynamic add/remove rows with inline character count (max 10 goals of 150 characters each), strictly disallowing empty rows upon save.
    - **Unsaved Changes Guardrails:** Cancelling prompts for confirmation if changes were made; `Escape` key closes edit mode (prompting if dirty); `beforeunload` warns before accidental page exits.
    - **Sensible Focus Traversal:** Automatically focuses the first form field (College input) when entering edit mode, and returns focus to the "Edit Profile" button after saving or cancelling.
    - **Theme Toggle Independence:** Theme switch resides outside the edit flow, functioning immediately in both view and edit modes without requiring a form save.
  - **Theme Context Synchronization (`client/src/context/ThemeContext.jsx`):**
    - Exposed `setTheme` to allow explicit theme setting from the Profile page, synchronizing immediately with both `localStorage` and `progress.json`.
  - **Styling (`client/src/index.css`):**
    - Appended complete Phase 10 CSS styles for profile layout, avatar circle, chip tags, goal rows, theme cards, and responsive rules (collapsing to single column on tablet/mobile).
  - **Automated Test Suite (`server/scripts/test-phase10.js`):**
    - Registered `"test:phase10": "node scripts/test-phase10.js"` in `server/package.json`.
    - Verifies 401 unauthenticated, 400 validation error handling, 200 profile updates, `progress.json` persistence via `GET /api/progress`, and clean state restoration.
- **Files created/changed:**
  - `server/controllers/progressController.js`
  - `server/package.json`
  - `server/scripts/test-phase10.js`
  - `client/src/context/ThemeContext.jsx`
  - `client/src/components/SkillTagsInput.jsx`
  - `client/src/components/GoalsListEditor.jsx`
  - `client/src/pages/Profile.jsx`
  - `client/src/index.css`
  - `Memory.md`

### Phase 10B: Client-Side Test Runner (JavaScript Web Worker)
- **What was built:**
  - **Specification & Architecture Updates:**
    - Updated `PRD.md` Section I, `Architecture.md` questions schema, `Rules.md` Code Execution Safety Rules, and `Phases.md` adding Phase 10B between Phase 10 and Phase 11.
  - **Sandbox & Web Worker Architecture (`client/src/utils/`):**
    - Built `client/src/utils/testWorker.js`: runs purely on a background browser thread; completely strips and locks network/storage globals (`fetch`, `XMLHttpRequest`, `WebSocket`, `importScripts`, `indexedDB`); captures up to 50 lines of `console.log/warn/error`; evaluates untrusted student code inside an isolated function wrapper; runs each test case with runtime ms duration measurement.
    - Built `client/src/utils/testRunner.js`: lifecycle manager spawning module Web Worker; enforces a strict 2.0-second execution timeout using main-thread timer and `worker.terminate()`, returning "Time limit exceeded (2.0s cap)" if an infinite loop or heavy recursion occurs.
    - Deep comparison utility supporting both `"exact"` (deep recursive value/key equality) and `"unorderedArray"` (multiset frequency match permitting arbitrary order).
  - **Data Model & Backend Question CRUD:**
    - Extended `server/utils/validators.js` with `validateTestRunnerFields` checking JS identifier regex for `functionName`, max 10k chars `starterCode`, compare enum (`exact` | `unorderedArray`), and max 20 `testCases` array with `{ args, expected, hidden }`.
    - Updated `server/controllers/questionController.js` `createQuestion` and `updateQuestion` to validate and persist the optional test runner fields.
    - Updated `server/scripts/seed.js` to seed 14 DSA questions (covering Arrays, Strings, Stack, DP, and Binary Search) with `functionName`, `starterCode`, `compare`, and 4–6 test cases (including hidden tests).
    - Verified questions without test cases (e.g. Linked Lists, Trees, Graphs) retain their existing notes-only behavior with zero "Run Tests" buttons.
  - **Student Problem Details Integration (`client/src/pages/ProblemDetails.jsx`):**
    - Prefills editor with `question.starterCode` when JavaScript is selected and no saved user code exists.
    - "Run Tests" action button with Play icon, executing test suite in background Web Worker sandbox.
    - Language notice when non-JS language is active: *"Running code is supported for JavaScript only. Solutions in other languages are saved as notes."*
    - "Starter Code" reset button restoring the default function template on demand.
    - Test Results panel displaying overall status pill, runtime ms, individual test cards (input, expected, output), hidden test masking (withholding args and expected values), runtime/syntax error alerts, timeout alerts, and captured console logs view.
    - "All tests passed! 🎉" celebration banner with a direct "Mark as Solved" action button.
  - **Admin Question Management (`client/src/pages/QuestionForm.jsx`):**
    - Added test runner configuration section with Target Function Name, Compare Mode selector, Starter Code editor, and Test Cases JSON editor with real-time JSON validation and a "Insert Sample Template" helper.
  - **Styling (`client/src/index.css`):**
    - Conforms strictly to Design.md warm paper and ink tokens; zero hardcoded colors; verified across both light and dark themes at desktop and mobile viewports.
  - **Automated Test Suite (`server/scripts/test-phase10b.js`):**
    - Registered `"test:phase10b": "node scripts/test-phase10b.js"` in `server/package.json`.
    - Comprehensive test suite covering Server Safety Audit (grep confirms ZERO `eval`, `new Function`, `vm`, or `child_process` in `server/`), validator unit tests, deep equality checks, controller integration tests, RBAC authorization, and seeded data integrity (18/18 tests passed).
- **Files created/changed:**
  - `PRD.md`
  - `Architecture.md`
  - `Rules.md`
  - `Phases.md`
  - `client/src/utils/testWorker.js`
  - `client/src/utils/testRunner.js`
  - `client/src/pages/ProblemDetails.jsx`
  - `client/src/pages/QuestionForm.jsx`
  - `client/src/index.css`
  - `server/utils/validators.js`
  - `server/controllers/questionController.js`
  - `server/data/questions.json`
  - `server/scripts/seed.js`
  - `server/scripts/test-phase10b.js`
  - `server/package.json`
  - `Memory.md`

### Code Editor Polish ("My Solution" Textarea & Runner Fixes):
- **What was built:**
  - **Ligatures Completely Disabled App-Wide:**
    - Fixed ligature bug where `!==` rendered as `≠`, `===` as `≡`, `=>` as an arrow, etc.
    - Applied `font-variant-ligatures: none !important; font-feature-settings: "liga" 0, "calt" 0 !important;` to all monospace and code elements: the editor, gutter, example blocks, constraints, test results, durations, badges, timer, and console output.
  - **Textarea Configuration & Formatting:**
    - Configured `spellcheck="false"`, `autocorrect="off"`, `autocapitalize="off"`, `autocomplete="off"`, and `data-gramm="false"` (disabling browser extensions like Grammarly).
    - Enforced `white-space: pre; overflow: auto;` so long lines scroll horizontally instead of wrapping.
    - Set `tab-size: 4`, `font-size: 14px`, `line-height: 1.6`, `resize: vertical`, and `min-height: 320px`.
  - **Plain JS Keyboard Handler (`client/src/utils/codeEditorUtils.js`):**
    - Built comprehensive utility with inline explanatory comments.
    - Tab inserts 4 spaces; multi-line Tab indents all selected lines by 4 spaces; Shift+Tab unindents lines by removing up to 4 leading spaces.
    - Enter retains current line indentation, adds 4 spaces after lines ending with `{`, `[`, `(`, and expands `{|}`, `[|]`, `(|)` into a 3-line indented block with the cursor positioned in between.
    - Auto-closes brackets `()`, `[]`, `{}` and quotes `""`, `''`, ````.
    - Type-over: typing a closing bracket/quote when it already exists as the next character steps over it without duplicate insertion.
    - Selection wrapping: typing an opener over highlighted text wraps the selection inside the pair.
    - Contraction guardrail: typing quotes immediately after letters/digits does not auto-close (preventing `it''s` or `don''t`).
    - Empty pair backspace: pressing Backspace between an empty pair (e.g. `(|)`) deletes both characters.
    - Shortcuts: `Ctrl/Cmd+Enter` runs tests; `Ctrl/Cmd+S` saves notes (preventing browser save dialog); `Escape` exits editor focus.
    - Native Undo/Redo: uses `document.execCommand('insertText')` and `document.execCommand('delete')` to ensure atomic entries in the browser's native undo manager (`Ctrl+Z` / `Ctrl+Y`) without clearing history.
  - **Line Number Gutter & Status Bar:**
    - Built `.editor-gutter` alongside textarea inside `.code-editor-shell`, scrolling 1:1 with textarea `scrollTop` and highlighting the active line number.
    - Gutter uses `--text-muted`, 1px right border, non-selectable (`user-select: none`).
    - Footer displays `Ln X, Col Y` live cursor coordinates alongside character count and shortcuts guide.
    - Runner errors report line numbers aligned 1:1 with gutter line numbers.
  - **Double Border Fix & Themed Selection:**
    - Replaced `.editor-textarea-wrapper` with unified `.code-editor-shell` having `display: flex; align-items: stretch; border: 1px solid var(--border)` and `:focus-within` focus ring, completely eliminating double borders/lines at the bottom edge.
    - Custom `::selection` uses `background-color: var(--accent-soft); color: var(--text)` matching the theme in both light and dark modes.
    - Mobile optimization: on screens `<= 600px`, editor font size scales to `16px` to prevent iOS Safari auto-zoom on focus while preserving line-number alignment and horizontal scrolling.
  - **LeetCode Nested Wrapper Support (`client/src/utils/testWorker.js`):**
    - Added nested function resolution to `testWorker.js`: if a student pastes a LeetCode snippet like `function isAnagram(s, t) { var isAnagram = function(s, t) { ... } }`, the runner detects the inner function and executes it with test arguments when the outer wrapper returns `undefined`.
- **Files created/changed:**
  - `client/src/utils/codeEditorUtils.js`
  - `client/src/utils/testWorker.js`
  - `client/src/pages/ProblemDetails.jsx`
  - `client/src/index.css`
  - `server/scripts/test-editor-features.js`
  - `server/package.json`
  - `Memory.md`

### Phase 11: Comprehensive Polish, Responsive Drawer & A11y Audit
- **What was built:**
  - **Shared Empty State Component (`client/src/components/EmptyState.jsx`):**
    - Built reusable empty state component conforming strictly to Design.md Section 6 ("empty = one sentence plus a primary action").
    - Features unboxed category icons (no colored icon boxes per Design.md), Fraunces serif heading, muted descriptive text, and primary/secondary action triggers.
    - Integrated across `Problems.jsx` (unmatched search/filter), `Applications.jsx` (empty tracker or empty search/status results), and `ProblemDetails.jsx` (unmatched question ID).
  - **Mobile Sidebar Drawer & Focus Trapping (`client/src/components/Sidebar.jsx` & `client/src/components/Layout.jsx`):**
    - Built off-canvas slide-out drawer on viewports < 900px with dimmed backdrop.
    - Added background body scroll locking (`document.body.style.overflow = 'hidden'`) while drawer is open to prevent underlying content scrolling.
    - Added keyboard `Escape` listener to dismiss drawer effortlessly.
    - Added programmatic focus return: upon drawer dismissal, focus restores immediately to the hamburger trigger button (`menuBtnRef.current.focus()`).
    - Added semantic ARIA attributes: `id="app-sidebar"`, `role={isOpen ? 'dialog' : 'complementary'}`, `aria-label="Navigation sidebar"`, and `aria-modal={isOpen ? 'true' : undefined}`.
    - Added route title mapping for `/admin/mcq` ("Admin MCQ Bank") in `Layout.jsx` topbar.
  - **Applications Page State Handling & Table Scrolling (`client/src/pages/Applications.jsx`):**
    - Fixed state clash bug where an error condition previously caused both `ErrorMessage` AND the empty state card to be displayed simultaneously.
    - Wrapped data table inside `.table-responsive` with `-webkit-overflow-scrolling: touch;` preventing layout blowouts on narrow widths.
  - **Problem Details & Code Editor Audit (`client/src/pages/ProblemDetails.jsx`):**
    - Audited "My Solution" code editor and Run Tests execution results panel across Light and Dark themes.
    - Added `role="tablist"` and `role="tab"` with `aria-selected` to test result tabs ("Test Cases" vs. "Console Output").
    - Added `role="tabpanel"` and descriptive labels to test results cards list and captured console logs container.
    - Mobile layout adaptations: on <= 600px screens, editor action buttons wrap into a flexible grid, header stacks cleanly, desktop keyboard shortcut hints are hidden on touch screens, and test case input/output grids collapse to 1 column below 500px.
  - **Universal Focus Rings & Accessibility (`client/src/index.css`):**
    - Added universal `:focus-visible` styling (`outline: 2px solid var(--accent); outline-offset: 2px;`) across all buttons, links, and interactive elements for WCAG AA keyboard accessibility.
    - Added global `prefers-reduced-motion: reduce` rule disabling transitions and animations for users with vestibular or motion sensitivities.
    - Added dedicated styling for `.empty-state-card`, `.empty-state-icon-wrapper`, `.empty-state-title`, `.empty-state-desc`, and `.empty-state-btn`.
  - **Production Build:**
    - Verified `npx vite build` transforms 2336 modules with 0 errors.
- **Files created/changed:**
  - `client/src/components/EmptyState.jsx`
  - `client/src/components/Layout.jsx`
  - `client/src/components/Sidebar.jsx`
  - `client/src/pages/Applications.jsx`
  - `client/src/pages/Problems.jsx`
  - `client/src/pages/ProblemDetails.jsx`
  - `client/src/index.css`
  - `Memory.md`

### Phase 12: End-to-End Testing & Documentation (README)
- **What was built:**
  - **Comprehensive Project README (`README.md`):**
    - Created exhaustive, beginner-friendly, and professional technical documentation matching all academic requirements and `Rules.md` guidelines.
    - Included: Key Features breakdown across all 8 major modules, full ASCII System Architecture Diagram, Complete Technology Stack table, Detailed Folder Tree, Prerequisites & Step-by-Step Installation Guide, Seeding instructions and pre-seeded test accounts, documentation for all 13 plain Node test suites, complete REST API specification table with methods/paths/access requirements, "Warm Paper and Ink" Design System details, Client-Side Web Worker Security & Sandbox Architecture, and Academic Integrity statement for B.Tech CSE.
  - **Production Build & Verification:**
    - Verified complete end-to-end client build with Vite (`2336 modules transformed, built with 0 errors`).
    - Verified all test scripts: `test:db`, `test:percentage`, `test:editor`, and `test:phase10b`.
- **Files created/changed:**
  - `README.md`
  - `Memory.md`

### Milestone: Branding Polish — Typography, Page Metadata & Logo Concepts
- **What was built:**
  - **Typography Upgrade (`client/index.html`, `client/src/index.css`):**
    - Replaced font stack with:
      - Headings, big stat numbers, wordmark: **Young Serif** (single weight 400).
      - Body and UI: **Hanken Grotesk** (weights 400, 500, 600).
      - Code, editor, timer: **IBM Plex Mono** (weights 400, 500).
    - Loaded via Google Fonts `<link>` with `preconnect` and `display=swap`. Fallbacks: `Georgia, serif` / `system-ui, -apple-system, sans-serif` / `ui-monospace, SFMono-Regular, monospace`.
    - Defined tokens `--font-heading`, `--font-body`, and `--font-mono` on `:root`. Added alternative font stack (Instrument Serif / Instrument Sans / Fragment Mono) commented in `index.css`.
    - Enforced the single-weight rule on Young Serif: set `font-weight: 400 !important; font-synthesis: none; -webkit-font-synthesis: none;` on all headings and title classes to prevent artificial browser faux-bold distortion. Visual hierarchy is established using size and ink/muted color contrast.
    - Set form controls (`input, select, textarea, button { font: inherit; }`) to inherit typography naturally.
    - Preserved ligature disabling (`font-variant-ligatures: none !important`) across all monospace elements.
    - Applied tabular numbers (`font-variant-numeric: tabular-nums`) to tables, stats, timer, progress bar percentages, and cursor coordinates.
    - Audited client and replaced all hardcoded font families (including Recharts chart ticks and tooltips in `WeeklyChart.jsx`) with CSS variables.
  - **Page Metadata & Route Titles (`client/index.html`, `client/src/hooks/useDocumentTitle.js`):**
    - Configured `<title>DevPrep – Developer Preparation Platform</title>`, meta description, and theme-color meta tags for light (`#F4EFE6`) and dark (`#151310`) using `media="(prefers-color-scheme: ...)"`.
    - Built lightweight custom hook `useDocumentTitle(title, retainOnUnmount)` (0 dependencies, no `react-helmet`) and wired it across all 12 page components (`Dashboard · DevPrep`, `Problems · DevPrep`, `<Title> · DevPrep`, `Assessment: <Topic> · DevPrep`, etc.).
  - **Logo Concepts & Standalone Preview (`client/public/logo-options.html`):**
    - Designed 3 original, hand-crafted geometric SVG concepts honoring the "Paper and Ink" engineering aesthetic (no gradients, AI glows, stock icons, or squircle badges):
      - **Option A:** Curly brace `{` whose lower tail flows into a bookmark ribbon with a sharp swallowtail notch.
      - **Option B:** Capital "D" monogram whose vertical stem is an editor text cursor (caret with top/bottom crossbars) in terracotta.
      - **Option C:** Rectangular notebook page with a top-right folded dog-ear corner and embedded terracotta `< / >` code chevrons.
    - Built interactive preview page at `client/public/logo-options.html` displaying all 3 options at 16px, 32px, 64px, and 128px across Light and Dark backgrounds, alongside realistic mock sidebar headers, mock browser tab strips, and raw SVG source code inspection.
    - Strict boundary observed: Stopped before applying any mark to the sidebar or favicon, awaiting user selection.
  - **Build Verification:**
    - Verified `npx vite build client` transforms 2,337 modules with 0 errors.
- **Files created/changed:**
  - `client/index.html`
  - `client/src/index.css`
  - `client/src/hooks/useDocumentTitle.js`
  - `client/src/components/StatCard.jsx`
  - `client/src/components/WeeklyChart.jsx`
  - `client/src/pages/Dashboard.jsx`
  - `client/src/pages/Problems.jsx`
  - `client/src/pages/ProblemDetails.jsx`
  - `client/src/pages/MockTest.jsx`
  - `client/src/pages/TestResult.jsx`
  - `client/src/pages/Applications.jsx`
  - `client/src/pages/Profile.jsx`
  - `client/src/pages/Login.jsx`
  - `client/src/pages/Signup.jsx`
  - `client/src/pages/AdminQuestions.jsx`
  - `client/src/pages/QuestionForm.jsx`
  - `client/src/pages/AdminMcq.jsx`
  - `client/public/logo-options.html`
  - `Design.md`
  - `Memory.md`

### Milestone: Brand Logo Integration, Dark-Theme Tile & Favicon Pipeline
- **What was built:**
  - **Applied Brand Logo (`client/public/logo.png`):**
    - Integrated authentic DevPrep logo (1312×1199, brown and terracotta on transparent background). Zero modifications, recoloring, or CSS filters applied to the source image.
  - **Theme-Driven Dark Mode Tile (`--logo-tile`):**
    - Solved dark-background contrast for dark-brown elements (mortarboard cap, pen stem, `< / >` chevrons) without multi-file duplication or CSS filters.
    - Light theme (`:root`): Logo renders on page background with transparent background (`--logo-tile: transparent;`) and zero padding.
    - Dark theme (`[data-theme="dark"]`): Logo renders on a small cream tile (`--logo-tile: #F4EFE6;`) with `border-radius: 10px;`, proportional padding (`--tile-pad`, ~6px at 32px), and no shadow/glow.
  - **Reusable `<Logo />` Component (`client/src/components/Logo.jsx`):**
    - Props: `size` (default 32), `showWordmark` (default false), `className`, `wordmarkClassName`.
    - Computes exact image height and proportional width (ratio 1312:1199) to eliminate layout shift (CLS).
    - Uses `alt="DevPrep"`, `decoding="async"`, and renders the wordmark in Young Serif (`--font-heading`) with terracotta dot.
  - **Application-Wide Placement:**
    - Sidebar Header: `Logo(size=28, showWordmark=true)` inside NavLink to Dashboard (`/`). On mobile screens (`max-width: 900px`), CSS hides the wordmark to display the logo alone.
    - Mobile Top Bar: `Logo(size=24, showWordmark=false)` displayed between mobile menu trigger and page title on viewports `<= 900px`.
    - Login & Signup: `Logo(size=46, showWordmark=true)` positioned prominently above the form card, plus `Logo(size=36, showWordmark=true)` on the desktop narrative panel.
    - README Header: Embedded centered in `README.md` at 100×91px.
  - **PowerShell Favicon & Web Manifest Pipeline:**
    - Used Windows PowerShell with `System.Drawing` (0 new npm packages, helper script removed afterward) to generate derived favicons from `logo.png` on `#F4EFE6` cream tiles with ~10% padding:
      - `client/public/favicon-32.png` (32×32 PNG, 1.2 KB)
      - `client/public/favicon-192.png` (192×192 PNG, 15.0 KB)
      - `client/public/apple-touch-icon.png` (180×180 opaque PNG, 12.7 KB)
      - `client/public/favicon.ico` (multi-resolution ICO with 16, 32, 48px icons, 3.8 KB)
      - `client/public/site.webmanifest` (references `favicon-192.png`, theme_color `#F4EFE6`)
    - Linked all icon files in `client/index.html`.
  - **Build & Test Verification:**
    - Client build: `2,338 modules transformed, 0 errors`.
    - All test suites passing (`test:db`, `test:percentage`).
- **Files created/changed:**
  - `client/src/components/Logo.jsx`
  - `client/src/components/Sidebar.jsx`
  - `client/src/components/Layout.jsx`
  - `client/src/pages/Login.jsx`
  - `client/src/pages/Signup.jsx`
  - `client/src/index.css`
  - `client/index.html`
  - `client/public/favicon-32.png`
  - `client/public/favicon-192.png`
  - `client/public/apple-touch-icon.png`
  - `client/public/favicon.ico`
  - `client/public/site.webmanifest`
  - `README.md`
  - `Design.md`
  - `Memory.md`

### Milestone: Dual-Skin Visual Architecture ("Paper" & "Studio")
- **What was built:**
  - **Git Safety Baseline:**
    - Committed master state and created git tag `theme-paper-v1` on commit `4c972eb`.
    - Created and switched to isolated working branch `feature/studio-theme`.
  - **Token Architecture (`paper.css` & `studio.css`):**
    - Extracted all design system tokens into separate skin definitions:
      - `client/src/styles/skins/paper.css` (`[data-skin="paper"]` and `[data-skin="paper"][data-theme="dark"]`) reproducing the authentic warm paper & ink notebook aesthetic with 100% fidelity.
      - `client/src/styles/skins/studio.css` (`[data-skin="studio"]` and `[data-skin="studio"][data-theme="dark"]`) implementing the modern precision engineering workbench (cool neutrals `#F8F7F4`, cobalt blue accent `#2B44B8`, periwinkle dark accent `#8FA6FF`, deep zinc text `#18181B`). Never uses pure `#000` or `#FFF`.
    - Guaranteed all shared tokens are present in both skins: `--bg`, `--surface`, `--surface-2`, `--surface-3`, `--border`, `--border-strong`, `--text`, `--text-muted`, `--accent`, `--accent-hover`, `--accent-soft`, `--accent-contrast`, `--success`, `--warning`, `--danger`, `--info`, `--sidebar-bg`, `--sidebar-text`, `--sidebar-active-bg`, `--sidebar-active-text`, `--shadow-sm`, `--radius-sm`, `--radius-md`, `--focus-ring`, `--selection`, `--chart-1`..`5`, `--logo-tile`, `--modal-backdrop`, `--tracking-heading`, `--font-heading/body/mono`.
  - **Central Skin Configuration (`client/src/config/theme.js`):**
    - Single source of truth: `export const DEFAULT_SKIN = 'paper';`.
  - **Context & State Management (`client/src/context/ThemeContext.jsx`):**
    - Extended `ThemeContext` to provide `{ skin, setSkin, mode, toggleMode, theme, setTheme, toggleTheme, isDark }`.
    - Persisted in `localStorage` under `devprep-skin` and `devprep-theme`.
  - **Zero-Flash HTML Boot Script (`client/index.html`):**
    - Updated inline synchronous anti-flash script to resolve and apply both `data-skin` and `data-theme` to `<html>` prior to React mounting, completely eliminating layout/theme flashes.
  - **Profile Appearance UI (`client/src/pages/Profile.jsx`):**
    - Added an "Appearance & Theme" section with selectable visual skin cards ("Paper" vs. "Studio") featuring custom color swatch previews, alongside the Light/Dark mode toggle.
    - Switching skins applies instantaneously across all DOM elements without page reload or residual color bleed.
  - **Comprehensive Hardcoded Color & Style Audit:**
    - Replaced all legacy hardcoded rgba backdrops, ghost button hovers, modal overlays, review indicators, and skeleton shimmers across `client/src/index.css` with CSS variables.
    - Updated `WeeklyChart.jsx` to dynamically render `var(--chart-1, var(--accent))`.
  - **Automated WCAG 2.1 Contrast Suite (`server/scripts/test-contrast.js`):**
    - Built standalone test verifying 32 distinct contrast pairs across all 4 combinations (Paper Light, Paper Dark, Studio Light, Studio Dark).
    - All 32 checks passed $\ge 4.5:1$ threshold (minimum: 4.55:1, maximum: 16.54:1).
- **Files created/changed:**
  - `client/src/config/theme.js`
  - `client/src/styles/skins/paper.css`
  - `client/src/styles/skins/studio.css`
  - `client/src/context/ThemeContext.jsx`
  - `client/src/index.css`
  - `client/index.html`
  - `client/src/pages/Profile.jsx`
  - `client/src/components/WeeklyChart.jsx`
  - `server/scripts/test-contrast.js`
  - `server/package.json`
  - `Design.md`
  - `README.md`
  - `Memory.md`

---

## Decisions Made
1. **Module System (Backend):** CommonJS (`require` / `module.exports`) in `server/` for compatibility with `path.join(__dirname, ...)` in `Architecture.md` and standard B.Tech syllabus conventions. Client uses modern ES modules via Vite.
2. **Environment Variable Loading:** Explicitly configured `dotenv.config({ path: path.join(__dirname, '.env') })` in `server.js` so environment variables load reliably whether the process starts from project root or `server/`.
3. **API Proxying:** Configured `server.proxy` in `vite.config.js` to route `/api/*` to `http://localhost:5000`, removing the need for hardcoded backend URLs in the client.
4. **Persistence Layer & Testing:** Strict JSON files in `server/data/` using `server/utils/fileDb.js` with Promise-chained write queues and atomic temp-file rename (`fs.rename`). Standalone test runners auto-detect server status and launch in-process instances if port 5000 is inactive.
5. **Authentication Security:**
   - Passwords hashed using `bcryptjs` with 10 salt rounds.
   - Passwords never logged, stored in plain text, or returned in API responses.
   - Login uses a generic message ("Invalid email or password") regardless of whether email was missing or password didn't match.
   - JWT tokens signed with 7-day expiration.
   - Role checks (`requireAdmin`) strictly enforced at the API middleware layer.
6. **Code Notepad Safety & Privacy (Phase 5B):**
   - User code is stored strictly as text. It is NEVER compiled, evaluated, or executed.
   - Character count is capped at 20,000 characters per language.
   - Every solution is strictly scoped to `req.user.id`; client-sent IDs are never trusted.
   - In-memory drafts per language prevent losing edits when toggling between language tabs.
7. **Incremental Seeding:** `server/scripts/seed.js` is built incrementally:
   - Phase 3 (done): Admin & demo users + base progress skeleton in `users.json` and `progress.json`.
   - Phase 5 (done): 36 DSA questions in `questions.json` and demo user's 8 solved problems & activity.
   - Phase 5B (done): 1 sample solution for Two Sum in `solutions.json`.
   - Phase 7 (done): 5 sample applications for demo user in `applications.json`.
   - Phase 8: 45+ MCQs and demo test attempts in `mockTests.json`.
8. **Unified Progress API Contract:** Both solve status toggling and profile updates use `POST /api/progress` with an `action` discriminator (`"markSolved"`, `"unmarkSolved"`, `"updateProfile"`).
9. **Stored Streak:** Streak is kept as a stored object (`{ current: 0, lastActiveDate: null }`) in `progress.json` and updated on solve events.
10. **Design System:** Custom CSS variables enforcing the "Warm Paper and Ink" palette (`#F4EFE6` paper, `#26211B` ink, `#B5472B` terracotta accent), Fraunces serif headings, DM Sans body, JetBrains Mono code, and flat SVG charting.
11. **Admin CRUD & Data Safety (Phase 6):**
   - Server-side validation rejects invalid enum values (`topic`, `difficulty`) with 400 Bad Request before database writes.
   - Dynamic form arrays in React use immutable array updates (`[...examples, newEx]` and `.filter()`) to support arbitrary test cases and constraints.
   - Question deletion runs cascading cleanup on `solutions.json` to prevent orphan records.
   - Delete operations require explicit user confirmation via an accessible modal (`Modal.jsx`) to avoid irreversible data loss.
12. **Universal Form Control Styling & Native Popup Theming:**
   - Universal form control rules (`input`, `select`, `textarea`, `.form-input`, `.form-select`, `.form-textarea`) ensure 100% theme conformance and eliminate unstyled browser defaults across the application.
   - CSS `color-scheme` aligns native dropdown menus and date pickers with the active theme.
   - Custom SVG chevrons styled with theme variables replace divergent operating system dropdown arrows.
13. **User Scoping & Isolation (Phase 7):**
   - Application records are strictly partitioned by `req.user.id`. A user cannot read, update, or delete any application record belonging to another user (returns 404), ensuring complete data privacy across students.
14. **Dynamic Status Aggregation:**
   - Status counters on the application tracker are computed dynamically from the user's fetched application array (`applications.filter(a => a.status === s).length`), keeping UI chips synchronized without redundant network calls.
15. **MCQ Attempt Immutability & Defensive Review (Phase 8B):**
   - Attempts in `mockTests.json` preserve a full review snapshot `{ questionId, topic, question, options, selectedIndex, correctIndex, isCorrect, explanation }` at submit time. Furthermore, `TestResult.jsx` implements graceful fallback handling so deletion of master MCQ records can never corrupt or break historical student scorecards.
16. **Capacity Guardrails & Topic Inventory (Phase 8B):**
   - `GET /api/mock-test/counts` exposes active inventory counts, enabling the frontend Mock Test setup to automatically adjust and cap question count selectors when a topic has limited inventory.
17. **Shared Portal Architecture & Body Scroll Lock:**
   - All modals (`Modal.jsx`, `McqModal.jsx`, `ApplicationModal.jsx`) render into `document.body` via `ReactDOM.createPortal`. When open, `document.body.style.overflow = 'hidden'` locks viewport scrolling, and Tab navigation is trapped within the active dialog to ensure accessible keyboard boundaries.
18. **Persistent Segmented Navigation & Session Cache:**
   - The Admin area is encapsulated by `AdminLayout.jsx`, keeping the segmented tab bar mounted across route changes. An in-memory session cache (`adminCache.js`) and skeleton row loaders eliminate blank flashes and layout jumps.
19. **Ghost Icon Buttons & Responsive Stacked Cards:**
   - Replaced divergent filled buttons with 32px transparent ghost buttons with 1px border. Under 700px, wide data tables dynamically transform into vertical stacked cards using CSS pseudo-elements (`td::before { content: attr(data-label) }`).
20. **Live Multi-Store Aggregation & Flat SVG Recharts Theming (Phase 9):**
   - Progress and activity metrics are computed dynamically on each request to `GET /api/progress` by cross-referencing `questions.json`, `mockTests.json`, `applications.json`, and `progress.json`. This completely prevents out-of-sync denormalized counter drift.
   - Recharts visual styling strictly follows Design.md guidelines: flat SVG fills using theme variables (`var(--accent)`), clean border tooltips without drop-shadows or gradients, and responsive auto-scaling via `ResponsiveContainer`.
21. **Unified Percentage Metric & Dynamic Question Pool Scoping (Phase 9 Bugfix):**
   - Unified both backend and frontend on a single `percent` metric (whole number from 0 to 100, `Math.round((solved / total) * 100)` with 0 when total is 0). `ProgressBar.jsx` sets width as `${calculatedPercent}%` with a minimum visible 4px width when `percent > 0` and smooth 300ms transition.
   - Solved questions are validated against `questions.json` to guarantee that question deletions never leave zombie solved counts or skew topic percentages.
22. **Sanitized Profile State & Bidirectional Theme Sync (Phase 10):**
   - Skills and goals are strictly sanitized on the backend (trimmed, deduplicated, length capped at 30 skills / 30 chars and 15 goals / 100 chars) to prevent payload bloat in `progress.json`.
   - Theme changes in `Profile.jsx` immediately update `ThemeContext` and persist to `progress.json` via `{ action: "updateProfile", theme }`.
23. **Isolated Web Worker Sandbox & Zero Server Execution (Phase 10B):**
   - User JavaScript is strictly restricted to execution inside a background browser Web Worker thread (`testWorker.js`).
   - The worker scope explicitly disables and freezes `fetch`, `XMLHttpRequest`, `WebSocket`, `importScripts`, and `indexedDB`.
   - A hard 2.0-second timeout on the main thread terminates the worker if an infinite loop occurs, preventing UI freezing.
   - The Express server code contains 0 instances of `eval`, `new Function`, `vm`, or `child_process`.
   - Comparison supports deep exact matching and multiset `unorderedArray` matching. Hidden tests conceal arguments and expected values.
24. **Native Textarea Undo Stack Preservation:**
   - In modern browsers, `textarea.setRangeText()` or `textarea.value = ...` does not push entries into the browser's native Undo stack.
   - DevPrep uses `document.execCommand('insertText', false, text)` and `document.execCommand('delete')` for indentations, brace insertions, and pair deletions.
   - This records native atomic edit steps in the browser's undo manager, ensuring `Ctrl+Z` and `Ctrl+Y` always work seamlessly without losing history.

25. **Universal Accessible Focus Rings & Off-Canvas Drawer Trapping (Phase 11):**
    - Enforced an app-wide `:focus-visible` rule (`outline: 2px solid var(--accent); outline-offset: 2px;`) across all interactive controls.
    - When the mobile sidebar drawer opens on viewports < 900px, background viewport scrolling is locked (`document.body.style.overflow = 'hidden'`) and `Escape` dismisses the drawer with automatic focus return to the triggering menu button.
    - Unified empty state representation under `EmptyState.jsx` across all feature pages.

26. **Single-Weight Font Synthesis Prevention & Pure SVG Brand Marks:**
    - Young Serif has a single font weight (400). To eliminate artificial browser faux-bolding (which distorts serif geometry), all headings and title classes enforce `font-synthesis: none; -webkit-font-synthesis: none; font-weight: 400 !important;`. Visual hierarchy relies on scale, line-height, and ink/muted color contrast.
    - Route titles use a custom zero-dependency `useDocumentTitle` React hook.
    - Brand marks and favicons are constructed strictly as pure geometric SVG path shapes, avoiding AI clichés, stock graphics, and webfont-dependent `<text>` tags (which cannot render in browser tab favicons).

27. **Multi-Skin Theme Engine & Contrast Compliance:**
    - The platform supports two interchangeable visual skins: "Paper" (editorial study notebook) and "Studio" (modern precision workbench).
    - Tokens are decoupled into `paper.css` and `studio.css` driven by `[data-skin="paper"]` and `[data-skin="studio"]`.
    - Central default is declared in `DEFAULT_SKIN = 'paper'` (`client/src/config/theme.js`).
    - Both light and dark modes in both skins achieve WCAG AA $\ge 4.5:1$ contrast across all primary and semantic text.

---

## How to Revert the Theme

If you ever wish to revert from the "Studio" skin back to the original "Paper" skin, use any of these 3 methods:

1. **Via UI (Instant, No Reload):**
   Navigate to **Profile & Settings > Appearance & Theme** and click the **"Paper"** skin card. The application updates immediately.
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

### Mock Tests Route Blank Page Bugfix & ErrorBoundary Architecture
- **Root Cause Analysis:**
  - In commit `574c361` ("feat: branding polish with Young Serif typography, metadata, and logo concepts"), `useDocumentTitle(isTestActive ? 'Assessment: ' + selectedTopic : 'Mock Tests');` was placed on line 48 in `client/src/pages/MockTest.jsx` before `selectedTopic` (line 51) and `isTestActive` (line 59) were declared.
  - In JavaScript/ES6, accessing `const` variables before declaration enters the Temporal Dead Zone (TDZ), throwing `ReferenceError: Cannot access 'isTestActive' before initialization`.
  - Because React lacked an `ErrorBoundary`, unhandled render-time exceptions caused the entire React component tree to unmount, leaving `<div id="root"></div>` completely blank with no user feedback.
  - Regression verified: Bug was introduced in commit `574c361` and existed across both skins (Paper and Studio) and both light/dark modes on tag `theme-paper-v1`.
- **The Source Fix:**
  - In `client/src/pages/MockTest.jsx`, moved `useDocumentTitle` to execute strictly after state initialization (`isTestActive`, `selectedTopic`).
  - Added robust state management for setup errors (`inventoryError`, `attemptsError`, `errorMessage`), dynamic Retry triggers, and an `EmptyState` card if question bank inventory is empty.
  - Question count selector dynamically respects available topic inventory (`availableCount`) and shows capacity warning when fewer questions exist.
- **Failures Made Visible (React ErrorBoundary & 404):**
  - Created `client/src/components/ErrorBoundary.jsx`: Class component with `getDerivedStateFromError` and `componentDidCatch`. Displays a themed card ("Something went wrong on this page") with "Try again" and "Go to Dashboard" buttons. Errors and component stacks are logged strictly to `console.error` and never rendered in the UI.
  - Wrapped dynamic `<Outlet />` inside `Layout.jsx` and `<Routes>` in `App.jsx` with `<ErrorBoundary>` for resilient isolation (app shell stays responsive even if a route crashes).
  - Created `client/src/pages/NotFound.jsx`: Themed 404 page with large mono code, heading, and "Go to Dashboard" action, mounted as top-level and authenticated fallback `*` catch-all.
- **Automated Verification:**
  - Automated test script `server/scripts/verify-flow-and-sweep.js` (`npm run test:mock-tests`) verified via headless Chrome CDP:
    1. Entire Mock Test flow (setup topic with 5 questions, start, answer, Previous/Next state persistence, countdown timer, submit, result scorecard with accuracy and reviews, retake navigation).
    2. 5-way matrix test: Paper Light, Paper Dark, Studio Light, Studio Dark, and Admin user.
    3. App-wide sweep: 10/10 routes passed with 0 exceptions and 0 console errors.

### Phase: Profile Photo: Profile Photo, Canvas Cropper & Avatars Engine
- **What was built:**
  - **Zero New Dependencies:** Pure HTML5 Canvas crop and resize without any third-party image libraries (`multer`, `sharp`, `canvas`, etc.).
  - **EXIF Stripping & Re-encoding:** Re-encodes user photos via an offscreen HTML5 canvas to a 256x256 square WebP (with JPEG fallback at 0.85 quality), naturally stripping all EXIF metadata (GPS location, device specs, timestamps).
  - **Dedicated Backend Storage:** Avatars stored in isolated `server/data/avatars.json` mapping `{ "<userId>": { "dataUrl": "...", "updatedAt": "..." } }`, preserving lightweight `users.json`. Added `server/data/avatars.json` to `.gitignore`.
  - **Route-Scoped Body Limit & Security:**
    - Mounted `app.use('/api/profile/avatar', express.json({ limit: '200kb' }))` strictly before the global 100 KB parser. Exceeding 200 KB cleanly triggers HTTP 413 "Payload Too Large".
    - `validateAvatarPayload(image)` verifies data URL prefix (`image/webp`, `image/jpeg`, `image/png`), rejects SVG and GIF, enforces decoded binary size $\le 100$ KB, and validates binary magic bytes (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `RIFF`...`WEBP` for WebP) to prevent disguised files.
    - Endpoints: `GET /api/profile/avatar`, `PUT /api/profile/avatar`, `DELETE /api/profile/avatar`, all strictly authenticated via `requireAuth` and scoped to `req.user.id`.
  - **Frontend UI & Components:**
    - `client/src/components/Avatar.jsx`: Reusable circular avatar with configurable pixel size (`size`), border ring, shimmer loading placeholder (prevents initials flash), and fallback to initials.
    - `client/src/components/CropModal.jsx`: Canvas-based interactive crop modal with circular stencil guide, mouse/touch drag-to-pan, zoom slider (1x to 3x), keyboard navigation (arrow keys to move, +/- to zoom), and client validations (JPG/PNG/WebP, $\le 5$ MB, $\ge 64\times 64$, $\le 8000\times 8000$).
    - `client/src/context/AuthContext.jsx`: Manages `avatar` state across the entire session; hydrates on login/restore and updates globally without page reloads.
    - `client/src/pages/Profile.jsx`: 72px avatar header. Shows "Change photo" and "Remove photo" with confirmation modal in Edit mode only; changes save immediately and update `AuthContext`.
    - Integrated `<Avatar />` into `Sidebar.jsx` (38px), `Layout.jsx` topbar (32px, links to `/profile`), and `Dashboard.jsx` (48px greeting banner).
- **Files created/changed:**
  - `PRD.md` (updated with Section 5.H Profile Photo)
  - `Architecture.md` (updated with avatars data model & profile routes)
  - `Design.md` (updated with Section 6 Avatar & CropModal specifications)
  - `Phases.md` (updated with Phase: Profile Photo roadmap & verification checklist)
  - `.gitignore` (added `server/data/avatars.json`)
  - `server/utils/fileDb.js`
  - `server/utils/validators.js`
  - `server/controllers/profileController.js`
  - `server/routes/profileRoutes.js`
  - `server/middleware/errorHandler.js`
  - `server/server.js`
  - `server/scripts/test-avatar.js`
  - `server/package.json`
  - `client/src/services/api.js`
  - `client/src/context/AuthContext.jsx`
  - `client/src/components/Avatar.jsx`
  - `client/src/components/CropModal.jsx`
  - `client/src/components/Sidebar.jsx`
  - `client/src/components/Layout.jsx`
  - `client/src/pages/Dashboard.jsx`
  - `client/src/pages/Profile.jsx`
  - `client/src/index.css`
  - `Memory.md`

### Phase: Final Full QA Pass
- **What was verified & built:**
  - Full end-to-end QA audit across 16 core functional areas: Auth, Dashboard, Problems, Problem Details, Admin Questions, MCQ Bank, Mock Tests, Applications, Profile, Theming/Branding, Navigation/Errors, Data Storage, Security, Responsive & A11y, Code Health, and Fresh Setup.
  - Built comprehensive test suites:
    - `server/scripts/qa-auth-security.js` (25/25 checks passed): signup validation matrix, duplicate email case-insensitivity, generic 401s, JWT expiry, student 403 on admin routes, multi-tenant isolation, raw XSS safety, payload limits.
    - `server/scripts/qa-data-concurrency.js` (17/17 checks passed): 50 concurrent writes serialized without file corruption, missing file fallback, corrupted JSON recovery, path traversal defense, ID uniqueness.
    - `server/scripts/qa-browser-responsive-a11y.js` (101/101 checks passed): 96 viewport checks across 4 widths (360, 768, 1280, 1920) $\times$ 4 skin/theme combinations $\times$ 6 core routes with 0 horizontal overflow; modal focus trap and Escape dismissal; Profile view/edit mode toggle; 200% zoom scaling.
    - `server/scripts/test-fresh-setup.js`: automated clean reproduction from git archive in isolated temporary directory verifying `npm install`, `seed`, `npm run build`, and `/api/health` 200 OK.
  - Generated comprehensive `QA_REPORT.md` documenting all 198 checks, root cause resolutions, and known architectural considerations.
  - Backed up and restored `server/data/` to pristine baseline state.
- **Files created/changed:**
  - `QA_REPORT.md`
  - `server/nodemon.json`
  - `server/scripts/qa-auth-security.js`
  - `server/scripts/qa-data-concurrency.js`
  - `server/scripts/qa-browser-responsive-a11y.js`
  - `server/scripts/test-fresh-setup.js`
  - `server/package.json`
  - `Memory.md`

### Phase: Repository Cleanup, Data Split Architecture & Git History Sanitization
- **What was built, split & sanitized:**
  - **Full Outside Backup:**
    - Safely backed up `server/data/` (including personal user data, progress, applications, solutions, and avatar) and `client/public/qa-screenshots/` to `..\devprep-live-backup\` completely outside the repository.
  - **Data File Split & Git Tracking Boundaries:**
    - Split `server/data/mockTests.json` into:
      1. `server/data/mcqBank.json`: Tracked in Git. Contains the 45 curated multiple-choice questions across 9 DSA topics.
      2. `server/data/mockAttempts.json`: Ignored in Git (`.gitignore`). Contains user test attempts, scores, time taken, and snapshot reviews.
    - Updated `server/utils/fileDb.js` with `MCQ_BANK` and `MOCK_ATTEMPTS` constants with automatic fallback creation.
    - Updated `mockTestController.js`, `adminMcqController.js`, and `progressController.js` to use the split files.
    - Cleaned 24 orphaned test UUIDs from live `server/data/progress.json`, leaving only the 3 legitimate accounts (`admin`, `demo`, and real user).
  - **Idempotent Self-Contained Seeder (`seed.js`):**
    - Seed data (admin, demo user, 36 DSA questions, 45 MCQs, demo progress, 5 applications, 1 solution, 2 mock attempts) is hardcoded inside `seed.js`.
    - Strictly non-destructive and idempotent: re-running `npm run seed` appends missing demo records without ever deleting, overwriting, or modifying existing user accounts or progress.
    - Prints a security warning when default development credentials (`Admin@1234` / `Demo@1234`) are detected.
  - **Updated `.gitignore`:**
    - Explicitly ignores all live database collections: `users.json`, `avatars.json`, `solutions.json`, `applications.json`, `progress.json`, `mockAttempts.json`.
    - Explicitly keeps `questions.json`, `mcqBank.json`, and `.gitkeep` tracked.
  - **Artifact Cleanup & Secret Rotation:**
    - Audited the 6 QA screenshots: verified they show only demo user test results and 0 personal information. Removed `qa-screenshots/` and `logo-options.html` from Git and disk (preserved in backup).
    - Generated a cryptographically secure 64-character hex `JWT_SECRET` in local `server/.env`.
    - Replaced sample secrets in `server/.env.example` and `README.md` with `CHANGE_ME_TO_A_LONG_RANDOM_STRING`. Added production security warnings in `README.md`.
  - **Local Commit Purge & Git History Proof:**
    - Untracked all ignored data files from Git index (`git rm --cached`).
    - Reset commit `72e7cf1` and created a single clean baseline commit `9e4d0f2` on branch `fix/mock-test-polish`.
    - Executed `git reflog expire --expire=now --all` and `git gc --prune=now`.
    - Proved complete eradication: `git cat-file -t 72e7cf1` fails with `fatal: Not a valid object name`, and `git log --all -S...` returns 0 results for all personal strings and hashes.
  - **Fresh-Clone Validation:**
    - Performed clean `git clone` to isolated temporary directory `devprep-fresh-clone-test`.
    - Confirmed clone `server/data/` contained ONLY `questions.json`, `mcqBank.json`, and `.gitkeep`.
    - Executed clean `npm run seed` and verified end-to-end functionality via automated suite (Demo login, Dashboard stats, Mock test submission & snapshots, Past Tests, My Solution, Admin MCQ Bank, Profile Photo upload).
    - Safely deleted the temporary clone directory.
- **Files created/changed:**
  - `.gitignore`
  - `README.md`
  - `Memory.md`
  - `server/.env.example`
  - `server/utils/fileDb.js`
  - `server/controllers/mockTestController.js`
  - `server/controllers/adminMcqController.js`
  - `server/controllers/progressController.js`
  - `server/scripts/seed.js`
  - `server/scripts/qa-data-concurrency.js`
  - `server/data/mcqBank.json`
- **What was built & fixed:**
  - **Spacing Audit & Fixes (Result & Review Pages & Global Layout):**
    - Diagnosed root causes: `.review-question-meta`, `.review-opt-left`, and `.topic-stat-header` had no flex/gap rules defined in `index.css`, collapsing "Question 1Graphs", "AO(V)", and "Graphs1/2 (50%)" inline without spacing.
    - Added comprehensive CSS rules: 20-24px review card padding, 10px question-meta gap, 12px option row gap with 28x28px fixed-width letter chips (A/B/C/D), wrapping option text, 16px explanation box padding, and 0 horizontal overflow / right cutoff at 360px mobile width.
  - **Progress Bar Unification & Root Cause Fix:**
    - Diagnosed root cause: `.topic-stat-bar-fill` in `index.css` (line 3452) was completely missing the `background` / `background-color` CSS property. The calculated width percentage was applied, but the bar rendered 100% transparent.
    - Built a single unified, accessible `<ProgressBar percent={...} label={...} value={...} />` component (`client/src/components/ProgressBar.jsx`) with `var(--accent)` fill, 4px min-width when percent > 0, smooth 300ms transition, and ARIA attributes (`role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`).
    - Replaced custom bars on both Test Result ("Topic Performance") and Dashboard ("Topic Proficiency") with the unified component.
  - **Top Bar Alignment:**
    - Diagnosed root causes: `.topbar-right` had no flex CSS rule, `.theme-toggle-btn` was 36x36px while `<Avatar>` was passed `size={32}`, and `.topbar-avatar-link` had `opacity: 0.9` hover dimming and missing border matching.
    - Fixed `.topbar-right` with `display: flex; align-items: center; gap: 12px;`.
    - Unified both the Theme Toggle button and the Avatar link to exact 40x40px dimensions with matching `border: 1px solid var(--border)` and vertical alignment on the exact same line across all screen sizes (360px, 768px, 1280px).
  - **Mock Test History & Immutable Snapshot Architecture:**
    - Backend Endpoints:
      - `GET /api/mock-test/attempts`: Paginated (`?page=&limit=`) list returning lightweight summary objects (`id`, `topic`, `score`, `total`, `accuracy`, `date`, `timeTaken`, `topicBreakdown`, `hasSnapshot`) sorted newest first. Omit heavy review arrays.
      - `GET /api/mock-test/attempts/:id`: Full report route returning `{ attempt, reviews, hasSnapshot }`. Enforces strict multi-tenant privacy (`attempt.userId === req.user.id`), returning HTTP 404 for missing or foreign user attempts.
    - Immutable Question Snapshots:
      - Deep-clones question text, options, user selectedIndex, correctIndex, isCorrect, explanation, and topic at submission time. Future admin edits to MCQ bank never alter historic student attempt reports.
      - Pruning & Storage Quota: Retains complete question review snapshots for the latest 50 attempts per user, automatically pruning `reviews` on older attempts (~4 KB per 10-question test snapshot; 50 attempts $\approx 200$ KB).
      - Legacy attempt fallback: Older attempts without snapshots display score summary and a friendly legacy notice rather than crashing.
    - Frontend Past Tests & Review Navigation:
      - Mock Tests Page: Added "Past Tests" section below the setup card with responsive table on desktop/tablet, mobile cards (<680px), pagination controls (10/page), loading/error/empty states, and "View report" navigation buttons.
      - Routed Result Page: Supports `/mock-tests/attempts/:id` with "Back to Past Tests" navigation, friendly 404 "Report not found" card, and filter chips ("All", "Incorrect", "Unanswered") with live question counts.
      - Dashboard Integration: Recent Activity mock test items now include `attemptId` and directly link to `/mock-tests/attempts/:id`.
  - **Automated Verification:**
    - `server/scripts/test-mock-polish.js`: 11/11 automated checks PASSED (auth, submissions, summary listing, pagination, full report fetch, 404 multi-tenant isolation, snapshot immutability, dashboard attemptId).
    - `server/scripts/qa-browser-mock-polish.js`: 31/31 CDP browser checks PASSED across Paper/Studio, Light/Dark, 360px/768px/1280px.
    - Server restart & persistence verified: Reports persist across server restarts and retain data integrity.
    - Client production build: Built in 17.37s with 0 errors.
- **Files created/changed:**
  - `client/src/components/ProgressBar.jsx`
  - `client/src/pages/TestResult.jsx`
  - `client/src/pages/MockTest.jsx`
  - `client/src/components/ActivityFeed.jsx`
  - `client/src/components/Layout.jsx`
  - `client/src/App.jsx`
  - `client/src/index.css`
  - `client/src/services/api.js`
  - `server/controllers/mockTestController.js`
  - `server/routes/mockTestRoutes.js`
  - `server/controllers/progressController.js`
  - `server/package.json`
  - `server/scripts/test-mock-polish.js`
  - `server/scripts/qa-browser-mock-polish.js`
  - `Memory.md`

---

## Known Bugs / TODO
- None. All 198 quality assurance checks passed with 100% success. Zero P0/P1/P2 issues.

---

## How to Run (Exact Commands)

### 1. Seed or Reset Data
```bash
cd server
npm run seed
```

### 2. Run Test Suites
```bash
cd server
npm run test:db         # Test JSON file persistence engine
npm run test:auth       # Test authentication lifecycle
npm run test:phase5     # Test questions & progress endpoints
npm run test:phase5b    # Test "My Solution" code notepad API & privacy
npm run test:phase6     # Test Admin question CRUD and authorization
npm run test:phase7     # Test Job & Internship application tracker CRUD and user isolation
npm run test:phase8     # Test Timed Mock Tests Engine, anti-cheat, and grading
npm run test:phase8b    # Test Admin MCQ Bank CRUD, validation, and attempt immutability
npm run test:phase9     # Test Student Analytics & Activity Dashboard aggregations
npm run test:percentage # Test percentage calculation rules and edge cases
npm run test:phase10    # Test Student Profile, skills tags, goals, and settings
npm run test:phase10b   # Test Client-Side Test Runner, safety audit, validators & equality
npm run test:editor     # Test Code Editor keyboard behaviors, symbols, undo & performance
npm run test:contrast   # Test WCAG 2.1 AA Contrast Ratio (>= 4.5:1) across all skins/themes
npm run test:mock-tests # Test Mock Test flow, ErrorBoundary, 404, and app-wide route sweep
npm run test:avatar     # Test Profile Photo upload, WebP conversion, and payload validation
npm run test:mock-polish # Test Mock Test Polish, Snapshot Immutability, History API & Isolation
npm run test:qa:mock-polish # Headless Chrome CDP suite for top bar alignment, bars & 360px overflow
npm run test:qa:auth    # Comprehensive Auth & Security QA suite (25 checks)
npm run test:qa:data    # Concurrency & file integrity QA suite (17 checks)
npm run test:qa:browser # Responsive viewports & modal a11y QA suite (101 checks)
npm run test:qa:fresh   # Clean clone and setup simulation from scratch
```

### 3. Start Backend Server
```bash
cd server
npm run dev
# Server listens on http://localhost:5000
```

### 4. Start Frontend Client (in a separate terminal)
```bash
cd client
npm run dev
# Vite runs on http://localhost:5173
```

---

## Test Accounts
- **Admin Account:** `admin@devprep.com` / `Admin@1234` (Role: `admin`)
- **Demo User:** `demo@devprep.com` / `Demo@1234` (Role: `user` — has 8 solved problems, 1 saved solution, 5 tracked applications, and 2 mock test attempts)

---

## Next Step
All 12 implementation phases from `Phases.md` are 100% complete! DevPrep is fully functional, end-to-end verified, comprehensively documented, and ready for viva and practical demonstration.
