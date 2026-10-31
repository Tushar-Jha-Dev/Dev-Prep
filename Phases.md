# DevPrep: Implementation Phases (3-Day Realistic Roadmap)

This roadmap breaks down the complete development of DevPrep into 12 structured phases designed for a college project (B.Tech CSE). Each phase produces a fully working, testable milestone, teaches core software engineering concepts, and enforces the rules in `Rules.md` and `Design.md`.

---

## Realistic Schedule: Day 1 / Day 2 / Day 3 Split (~24 Hours Total)

To be honest about the time required without burning out, the project is structured across 3 focused work days:

- **Day 1: Foundations, Security & Shell (~8.5 Hours)**
  - Phase 1: Setup, Vite, Express, Git & Environment (1.5h)
  - Phase 2: Backend Foundation, fileDb Write Queue & Health (2.0h)
  - Phase 3: Auth Backend, JWT, Roles & Initial Seeding (2.5h)
  - Phase 4: Frontend Shell, Warm Paper Theming & Auth Pages (2.5h)
- **Day 2: Core Domain Features & Management (~10.5 Hours)**
  - Phase 5: Questions API, Problem Library & Details with Solve Toggle (2.5h)
  - Phase 5B: "My Solution" Code Notepad & Solutions API (1.5h)
  - Phase 6: Admin Question Management CRUD (2.0h)
  - Phase 7: Applications Tracker with Private Scoping (2.0h)
  - Phase 8: Mock Tests Engine with Server Grading & Anti-Cheat (2.5h)
- **Day 3: Aggregations, Polish, Testing & Documentation (~7.0 Hours)**
  - Phase 9: Dashboard, Flat Recharts Visualization & Stat Aggregations (2.5h)
  - Phase 10: Profile & Settings with Theme Sync (1.5h)
  - Phase 11: Comprehensive Polish, Responsive Drawer & A11y Audit (1.5h)
  - Phase 12: End-to-End Testing & Documentation (1.5h)

---

## Phase Overview & Fallback Plan

| Phase | Focus Area | Est. Time | Fallback / Can Cut? |
|---|---|---|---|
| **Phase 1** | Setup, Vite, Express, Git & Environment | 1.5 hrs | Essential |
| **Phase 2** | Backend Foundation, fileDb Write Queue & Health | 2.0 hrs | Essential |
| **Phase 3** | Auth Backend, JWT, Roles & Initial Seeding | 2.5 hrs | Essential |
| **Phase 4** | Frontend Shell, Warm Paper Theming & Auth Pages | 2.5 hrs | Essential |
| **Phase 5** | Questions API, Problem Library & Details (Solve Toggle) | 2.5 hrs | Essential |
| **Phase 5B** | "My Solution" Code Notepad & Solutions API | 1.5 hrs | Essential |
| **Phase 6** | Admin Question Management (CRUD) | 2.0 hrs | Essential |
| **Phase 7** | Applications Tracker (User-Scoped CRUD & Modals) | 2.0 hrs | Essential |
| **Phase 8** | Mock Tests (MCQ Engine, Server Grading & Review) | 2.5 hrs | Essential |
| **Phase 9** | Dashboard, Flat Recharts, Stats & Stored Streak | 2.5 hrs | Essential |
| **Phase 10** | Profile & Settings (Skills, Goals, Theme Sync) | 1.5 hrs | Optional cut: Complex goal editing |
| **Phase 11** | Responsive Drawer, Accessibility & States Audit | 1.5 hrs | Optional cut: Notes page, extra animations |
| **Phase 12** | End-to-End Testing & Documentation (README) | 1.5 hrs | Optional cut: Cloud deployment |

> **Cuts if falling behind schedule:**
> 1. *Notes Page* (PRD Section 5.H already specifies this as stretch).
> 2. *Cloud Deployment* (Local run with complete persistence is the required baseline).
> 3. *Advanced Profile Goal Editing* (Keep profile basic with skills tags and stats).

---

## Phase 1: Project Setup, Environments & Git Baseline
- **Goal:** Initialize client and server workspaces, establish configuration and environment boundaries, and commit a clean baseline to Git.
- **Files to create or change:**
  - `server/package.json`, `server/server.js`, `server/.env.example`, `server/.env`
  - `client/package.json`, `client/vite.config.js`, `client/index.html`, `client/src/main.jsx`, `client/src/App.jsx`
  - `.gitignore` (excludes `node_modules`, `server/.env`, build artifacts)
- **Concepts I'll learn in it:**
  - *Client-Server Separation:* Why modern web architectures separate frontend presentation from backend API logic.
  - *Vite Development Proxy:* How `/api` proxying eliminates CORS issues in local development and avoids hardcoding URLs.
  - *Environment Security:* Why secrets must never be committed to Git and how `.env.example` acts as a developer template.
  - *Git Version Control:* Initializing a repository, staging, ignoring files, and creating clean initial commits.
- **Verification checklist:**
  - [ ] Run `cd server && npm run dev` -> Console shows server listening on `http://localhost:5000`.
  - [ ] Run `cd client && npm run dev` -> Vite starts on `http://localhost:5173`.
  - [ ] Open browser to `http://localhost:5173` -> DevPrep placeholder appears without console errors.
  - [ ] Check `git status` -> Verify `node_modules` and `server/.env` are properly ignored.
- **Rough time estimate:** 1.5 Hours

---

## Phase 2: Backend Foundation, File DB Engine & Health Route
- **Goal:** Build the JSON file persistence layer (`fileDb.js`) with an atomic write queue, corrupted-file recovery, centralized error handling, and request validation helpers.
- **Files to create or change:**
  - `server/utils/fileDb.js` (readJson with fallback, writeJson with promise queue and atomic write-rename)
  - `server/utils/validators.js` (schema and field validation helpers)
  - `server/middleware/errorHandler.js` (consistent `{ "error": "message" }` responses)
  - `server/middleware/notFound.js` (404 handler)
  - `server/routes/healthRoutes.js` (or `/api/health` test endpoint)
  - `server/server.js` (mount middleware and test route)
  - `server/data/` (ensure directory structure exists)
  - `server/scripts/test-fileDb.js` (plain Node test script without external testing libraries)
- **Concepts I'll learn in it:**
  - *Atomic File Operations:* Writing to a temporary file before renaming to prevent partial-write file corruption.
  - *Concurrency & Write Queues:* How a JavaScript Promise chain serializes asynchronous disk writes to avoid race conditions.
  - *Express Middleware Pipeline:* How `req`, `res`, and `next` handle cross-cutting concerns like errors and 404s.
  - *Defensive Programming:* Gracefully handling missing or malformed JSON without crashing the server process.
- **Verification checklist:**
  - [ ] `curl http://localhost:5000/api/health` -> Returns `200 OK` with `{ status: "ok" }`.
  - [ ] Run `node scripts/test-fileDb.js` -> Plain Node script triggers concurrent writes and validates no file corruption.
  - [ ] Intentionally corrupt a mock JSON file with invalid syntax -> Read returns default fallback without server crash.
  - [ ] Request non-existent route `/api/does-not-exist` -> Returns `404` with `{ "error": "Not Found" }`.
- **Rough time estimate:** 2.0 Hours

---

## Phase 3: Authentication & Authorization Backend
- **Goal:** Implement secure user registration, password hashing with bcrypt, JWT token issuing/verification, role authorization middleware, and initial database seeding.
- **Files to create or change:**
  - `server/data/users.json`, `server/data/progress.json`
  - `server/routes/authRoutes.js`
  - `server/controllers/authController.js` (`signup`, `login`, `getMe`)
  - `server/middleware/auth.js` (`requireAuth`, `requireAdmin`)
  - `server/scripts/seed.js` (initial seed: populates admin account, demo user, and initial progress object)
  - `server/package.json` (add `"seed": "node scripts/seed.js"`)
- **Concepts I'll learn in it:**
  - *Cryptographic Salted Hashing:* Why passwords must never be stored plain-text and how bcrypt defends against rainbow tables.
  - *JSON Web Tokens (JWT):* Stateless authentication structure (Header, Payload, Signature) and token expiration.
  - *Role-Based Access Control (RBAC):* Enforcing admin privilege checks on the server rather than trusting the client.
  - *User Scoping:* Why all user-generated data must key off the authenticated `req.user.id` extracted from verified tokens.
- **Verification checklist:**
  - [ ] Run `npm run seed` -> Creates `users.json` with hashed admin and demo credentials and initial `progress.json`.
  - [ ] `POST /api/auth/signup` with valid payload -> Returns 201 with token and user object (no passwordHash).
  - [ ] `POST /api/auth/signup` with duplicate email -> Returns 409 Conflict with `{ "error": "Email already registered" }`.
  - [ ] `POST /api/auth/login` with wrong password -> Returns 401 with generic error "Invalid email or password".
  - [ ] `GET /api/auth/me` with `Bearer <token>` -> Returns user profile; without token returns 401 Unauthorized.
- **Rough time estimate:** 2.5 Hours

---

## Phase 4: Frontend Shell, Theming & Auth Flow
- **Goal:** Construct the Design.md "Warm Paper and Ink" UI system, zero-flash ThemeContext, AuthContext, Protected/Admin routes, base Layout with Sidebar, and responsive Login/Signup pages.
- **Includes loading, error, and empty states for its pages.**
- **Files to create or change:**
  - `client/index.html` (Google fonts: Fraunces, DM Sans, JetBrains Mono; inline anti-flash theme script)
  - `client/src/index.css` (CSS variables for light/dark palette, typography, button/input tokens)
  - `client/src/context/ThemeContext.jsx` (light/dark state, localStorage, html `data-theme`)
  - `client/src/context/AuthContext.jsx` (token storage, login, signup, logout state)
  - `client/src/services/api.js` (centralized fetch wrapper with Bearer token injection and 401 handling)
  - `client/src/components/ThemeToggle.jsx`, `client/src/components/Sidebar.jsx`, `client/src/components/ProtectedRoute.jsx`, `client/src/components/AdminRoute.jsx`
  - `client/src/pages/Login.jsx`, `client/src/pages/Signup.jsx`
  - `client/src/App.jsx` (router configuration)
- **Concepts I'll learn in it:**
  - *CSS Custom Properties & Design Systems:* Swapping entire color schemes without rewriting CSS classes.
  - *Flash of Incorrect Theme (FOIT):* Using a synchronous head script to read theme before DOM rendering.
  - *React Context API:* Providing global auth and theme state down the component tree without prop-drilling.
  - *Client-Side Route Guards:* Protecting private routes and redirecting unauthenticated visitors to `/login`.
- **Verification checklist:**
  - [ ] Open `/` logged out -> Instantly redirected to `/login`.
  - [ ] Click Theme Toggle on Login page -> Seamless transition between warm paper light mode and warm charcoal dark mode.
  - [ ] Reload page -> Theme selection persists without any flash.
  - [ ] Fill Signup form with invalid password (< 8 chars or no numbers) -> Shows inline validation error.
  - [ ] Log in with demo account -> Redirects to Dashboard shell displaying user name and sidebar.
  - [ ] Click Logout -> Clears auth state and redirects back to `/login`.
- **Rough time estimate:** 2.5 Hours

---

## Phase 5: Questions API, Problem Library & Problem Details
- **Goal:** Implement the question repository, multi-parameter filtering, question details view, and "Mark as Solved" toggle linked to user progress via `POST /api/progress`.
- **Includes loading, error, and empty states for its pages.**
- **Incremental Seeding:** Extend `seed.js` to seed `questions.json` (30–36 DSA questions) and the demo user's solved problems, activity, and streak in `progress.json`.
- **Files to create or change:**
  - `server/data/questions.json`
  - `server/scripts/seed.js` (extended with questions & demo progress)
  - `server/routes/questionRoutes.js`, `server/controllers/questionController.js` (list with filters, get single)
  - `server/routes/progressRoutes.js`, `server/controllers/progressController.js` (single `POST /api/progress` with `{ action: "markSolved", questionId }` and `{ action: "unmarkSolved", questionId }`, updating stored `streak` object)
  - `client/src/pages/Problems.jsx`, `client/src/pages/ProblemDetails.jsx`
  - `client/src/components/QuestionTable.jsx`, `client/src/components/DifficultyBadge.jsx`, `client/src/components/ProgressBar.jsx`
  - `client/src/services/api.js` (questions and progress endpoints)
- **Concepts I'll learn in it:**
  - *Query Parameter Filtering:* Combining `search`, `topic`, and `difficulty` parameters in Express route handlers.
  - *Action-Based Progress Endpoint:* Handling multiple user operations via a clean unified `POST /api/progress` API contract.
  - *Stored Streak State:* Updating and persisting the stored `{ current, lastActiveDate }` streak object on solve events.
  - *Shared vs User-Scoped Data:* How public questions are shared by all users while solved status is private to each user.
- **Verification checklist:**
  - [ ] Run `npm run seed` in server -> Seeds questions and demo user's solved history into `progress.json`.
  - [ ] `GET /api/questions?topic=Arrays&difficulty=Easy` -> Returns only matching questions.
  - [ ] Open `/problems` in browser -> View table of questions with difficulty badges, solved indicators, loading and empty states.
  - [ ] Type in search box or change dropdown filters -> Table filters appropriately via API calls.
  - [ ] Click on "Two Sum" -> Opens `/problems/:id` showing description, examples, constraints, and approach.
  - [ ] Click "Mark as Solved" -> Calls `POST /api/progress` with `{ action: "markSolved" }`; button updates and stored streak updates in `progress.json`.
- **Rough time estimate:** 2.5 Hours

---

## Phase 5B: "My Solution" Code Notepad & Solutions API
- **Goal:** Implement personal solution saving across 4 programming languages on Problem Details with Tab-indentation support, unsaved indicators, and question table indicators.
- **Includes loading, error, and empty states for its pages.**
- **Files to create or change:**
  - `server/data/solutions.json`
  - `server/controllers/solutionController.js` (list user solutions, get question solutions, save/update solution, delete solution)
  - `server/routes/solutionRoutes.js` (mounted at `/api/solutions` with `requireAuth`)
  - `server/utils/fileDb.js` (add `SOLUTIONS: 'solutions.json'`)
  - `server/utils/validators.js` (add `ALLOWED_LANGUAGES = ['JavaScript', 'Python', 'Java', 'C++']`, max code length 20,000)
  - `server/server.js` (mount `/api/solutions`)
  - `server/scripts/seed.js` (seed sample solution for demo user)
  - `server/scripts/test-phase5b.js` (automated standalone test suite)
  - `client/src/services/api.js` (solutions API methods)
  - `client/src/pages/ProblemDetails.jsx` (My Solution editor, language dropdown, Tab support, Save/Clear buttons, unsaved indicator)
  - `client/src/components/QuestionTable.jsx` & `client/src/pages/Problems.jsx` (saved solution badge/icon in problems table)
  - `client/src/index.css` (editor styling, language bar, status pills)
- **Concepts I'll learn in it:**
  - *Textarea Tab Key Interception:* Overriding default browser focus shift with `e.preventDefault()` to insert 2 spaces at cursor selection boundaries.
  - *Multi-Language In-Memory State:* Switching between language drafts in React state without losing uncommitted edits.
  - *Defensive Storage Limits:* Enforcing strict payload length caps (20,000 characters) on code text to preserve file storage integrity.
  - *Multi-Tenant Code Privacy:* Strictly partitioning saved solution records by `req.user.id` so students cannot view each other's code.
- **Verification checklist:**
  - [ ] Run `npm run test:phase5b` -> Validates solution CRUD, question 404, invalid language 400, length limits, and strict user isolation.
  - [ ] Open `/problems/q-arr-1` -> View "My Solution" section with language dropdown, monospace textarea, and Save button.
  - [ ] Press `Tab` in the editor -> Inserts 2 spaces instead of moving focus away.
  - [ ] Write code in JavaScript, switch to Python, write code, switch back -> JavaScript code remains intact.
  - [ ] Save solution -> Displays "Saved at <time>", clears unsaved indicator.
  - [ ] Open Problem Library -> Table displays saved solution indicator for problems with saved code.
  - [ ] Log in with another account -> Cannot see or access demo user's saved code.
- **Rough time estimate:** 1.5 Hours

---

## Phase 6: Admin Question Management
- **Goal:** Enable admins to create, update, and delete questions with full server-side validation and protected frontend management interfaces.
- **Includes loading, error, and empty states for its pages.**
- **Files to create or change:**
  - `server/controllers/questionController.js` (add `createQuestion`, `updateQuestion`, `deleteQuestion`)
  - `server/routes/questionRoutes.js` (attach `requireAuth` and `requireAdmin` to POST/PUT/DELETE)
  - `client/src/pages/AdminQuestions.jsx`, `client/src/pages/QuestionForm.jsx`
  - `client/src/components/Modal.jsx` (confirmation dialog for delete)
  - `client/src/services/api.js` (admin question endpoints)
  - `client/src/components/Sidebar.jsx` (conditionally show Admin link only for `admin` role)
- **Concepts I'll learn in it:**
  - *Defense in Depth:* Why UI hiding (not showing the Admin link) is meaningless without backend endpoint protection.
  - *Full REST CRUD Operations:* Implementing Create (POST), Read (GET), Update (PUT), and Delete (DELETE).
  - *Dynamic Form Fields:* Managing array inputs in React state (adding/removing dynamic example test cases and constraints).
  - *Dangerous Action Confirmation:* Using modals to prevent accidental irreversible data loss.
- **Verification checklist:**
  - [ ] Log in as demo user (`user` role) -> Sidebar has no Admin link; navigating directly to `/admin/questions` redirects to `/`.
  - [ ] Send `DELETE /api/questions/:id` using standard user token -> Server returns `403 Forbidden`.
  - [ ] Log in as admin account -> Sidebar shows "Admin" link; `/admin/questions` opens questions table.
  - [ ] Click "Add Question", fill form, and save -> Question appears in library and persists in `questions.json`.
  - [ ] Edit existing question -> Updates reflect across Problem Library and Details page.
  - [ ] Delete question with confirmation -> Question is removed from `questions.json`.
- **Rough time estimate:** 2.0 Hours

---

## Phase 7: Job & Internship Application Tracker
- **Goal:** Build the private application tracking system with status counters, search/filter, and modal-based Add/Edit/Delete operations.
- **Includes loading, error, and empty states for its pages.**
- **Incremental Seeding:** Extend `seed.js` to seed `applications.json` with 5 sample applications for the demo user.
- **Files to create or change:**
  - `server/data/applications.json`
  - `server/scripts/seed.js` (extended with demo applications)
  - `server/routes/applicationRoutes.js`, `server/controllers/applicationController.js`
  - `client/src/pages/Applications.jsx`
  - `client/src/components/ApplicationModal.jsx` (form for add/edit with inline validation)
  - `client/src/services/api.js` (applications CRUD)
- **Concepts I'll learn in it:**
  - *User Data Isolation:* Writing pure JavaScript array filters on JSON records (`applications.filter(app => app.userId === req.user.id)`).
  - *Controlled Modals & Escape Hatches:* Managing accessible dialog state, handling Escape key and outside clicks.
  - *Status Aggregation:* Dynamically computing counts per status (`Applied`, `Interview`, `Selected`, `Rejected`).
  - *Form Reuse:* Sharing a single modal component for both creation and editing modes.
- **Verification checklist:**
  - [ ] Run `npm run seed` in server -> Populates 5 demo applications into `applications.json`.
  - [ ] Open `/applications` as demo user -> Shows 4 status count chips and 5 seeded applications.
  - [ ] Filter by status "Interview" or search by company "Google" -> Displays matching records.
  - [ ] Click "Add Application", submit valid data -> New card appears and status chips update.
  - [ ] Edit application status from "Applied" to "Interview" -> Table updates immediately.
  - [ ] Log in with a different user -> Applications table is empty (verifying data privacy between accounts).
- **Rough time estimate:** 2.0 Hours

---

## Phase 8: Mock Tests Engine
- **Goal:** Create topic-wise multiple-choice mock tests with server-side question shuffling, hidden answers, timed test execution, and comprehensive result scoring.
- **Includes loading, error, and empty states for its pages.**
- **Incremental Seeding:** Extend `seed.js` to seed `mockTests.json` (45+ MCQs across 9 topics) and demo user's sample attempts.
- **Files to create or change:**
  - `server/data/mockTests.json`
  - `server/scripts/seed.js` (extended with MCQ bank & demo attempts)
  - `server/routes/mockTestRoutes.js`, `server/controllers/mockTestController.js`
  - `client/src/pages/MockTest.jsx`, `client/src/pages/TestResult.jsx`
  - `client/src/services/api.js` (mock test fetch & submit endpoints)
- **Concepts I'll learn in it:**
  - *Information Hiding & Anti-Cheat:* Why correct answers must never be sent in the question payload and must stay on the server.
  - *Array Shuffling:* Randomly selecting and ordering questions for fair tests.
  - *Client-Side Timers with `useEffect`:* Building countdown timers, handling cleanup, and auto-submitting on expiration.
  - *Server-Side Evaluation:* Comparing submitted option indices with stored keys, calculating score percentage, and returning detailed answer reviews.
- **Verification checklist:**
  - [ ] Run `npm run seed` in server -> Populates MCQ bank and demo test attempts into `mockTests.json`.
  - [ ] `GET /api/mock-test?topic=Arrays&count=5` -> Inspect response in DevTools: correct answers are NOT included.
  - [ ] Open `/mock-tests`, select topic and question count, click "Start Test" -> Timer starts counting down.
  - [ ] Answer questions, navigate Previous/Next, review question indicator strip.
  - [ ] Submit test -> Sends answers to `/api/mock-test/submit`, redirects to `/mock-tests/result`.
  - [ ] Result page shows Fraunces score ("4/5"), accuracy (80%), and detailed breakdown showing correct answers with explanations.
  - [ ] Attempt is saved to `mockTests.json` keyed by user ID.
- **Rough time estimate:** 2.5 Hours

---

## Phase 8B: Admin MCQ Bank Management
- **Goal:** Enable admins to manage the MCQ question bank (`mockTests.json`), view per-topic question distributions, add/edit/delete MCQs with dynamic option lists and correct answer indicators, while guaranteeing past attempts and student anti-cheat boundaries are never compromised.
- **Includes loading, error, and empty states for its pages.**
- **Files to create or change:**
  - `server/controllers/adminMcqController.js` (list, get, create, update, delete with validation)
  - `server/routes/adminMcqRoutes.js` (protected with `requireAuth` + `requireAdmin`)
  - `server/server.js` (mount `/api/admin/mcq`)
  - `server/controllers/mockTestController.js` (save immutable review snapshot in attempts at submit time)
  - `server/scripts/test-phase8b.js` (automated test suite)
  - `client/src/services/api.js` (admin MCQ endpoints)
  - `client/src/pages/AdminMcq.jsx` (table, topic filter, search, topic count chips with warnings, delete modal)
  - `client/src/components/McqModal.jsx` (modal form with dynamic options 2..6, correctIndex radio, validation)
  - `client/src/components/Sidebar.jsx` (add "MCQ Bank" sub-link in Admin area)
  - `client/src/pages/MockTest.jsx` (cap question count to available count for selected topic and show warning banner if fewer questions exist)
  - `client/src/pages/TestResult.jsx` (defensive rendering for deleted questions)
  - `client/src/App.jsx` (register `/admin/mcq` in `AdminRoute`)
  - `client/src/index.css` (admin MCQ styling)
- **Concepts I'll learn in it:**
  - *Data Integrity & Historical Snapshots:* Why mutable master data (MCQ bank) must not corrupt historical user records (past test attempts), and how snapshots at transaction time protect immutability.
  - *Dynamic Form Arrays with Sub-Selectors:* Managing a variable list of options in React state while binding a single radio button selection (`correctIndex`) to array indices.
  - *Topic Inventory & Capacity Guardrails:* Calculating available questions per topic and gracefully constraining student test configuration when a topic has limited inventory.
  - *Role-Based Access Enforcement:* Ensuring admin operations are strictly guarded at the API middleware layer with `403 Forbidden` for standard users.
- **Verification checklist:**
  - [ ] Run `npm run test:phase8b` -> Validates 401 unauthenticated, 403 student forbidden, 400 validation (option limits, empty strings, invalid topic, out-of-range correctIndex), 409 duplicate question, 201 creation, 200 update, 200 deletion, and immutable past attempt integrity.
  - [ ] Log in as admin -> Sidebar shows "MCQ Bank" link (`/admin/mcq`).
  - [ ] View MCQ list -> Shows topic breakdown summary with question counts, warning indicator for topics with < 5 questions.
  - [ ] Create a new MCQ with 4 options and select option 2 as correct -> Persists in `mockTests.json` and survives server restart.
  - [ ] Open `/mock-tests` as student -> New MCQ appears in test pool for its topic, but correct answer and explanation are NOT in the payload.
  - [ ] Edit the question and options -> Updates persist and reflect in admin list.
  - [ ] Delete an MCQ previously answered in a student test -> Past attempt reviews render cleanly without crashing.
  - [ ] Select a topic with few questions in Mock Test setup -> Question count caps to available count and displays "Only N questions available for this topic".
  - [ ] Both light and dark themes render cleanly on desktop and mobile.
- **Rough time estimate:** 2.0 Hours

---

## Phase 9: Dashboard with Stats, Progress & Visual Charts
- **Goal:** Aggregate all user progress data (solved problems, stored streak, test counts, applications) and render the interactive dashboard with Recharts using flat design colors.
- **Includes loading, error, and empty states for its pages.**
- **Files to create or change:**
  - `server/controllers/progressController.js` (`getDashboardSummary` reading stored `streak`, computing stats, DSA topic percentages, weekly activity)
  - `server/routes/progressRoutes.js` (`GET /api/progress`)
  - `client/src/pages/Dashboard.jsx`
  - `client/src/components/StatCard.jsx`
  - `client/src/components/WeeklyChart.jsx` (Recharts BarChart styled with flat CSS variables `--accent` and `--info`, no glow or gradient)
  - `client/src/components/ActivityFeed.jsx`
- **Concepts I'll learn in it:**
  - *Data Aggregation on the Server:* Computing metrics on-the-fly rather than storing stale denormalized totals.
  - *Data Visualization in React:* Integrating Recharts responsive containers and feeding dynamic data series.
  - *Theme-Aware Flat SVG Charting:* Passing flat CSS variable values (`var(--accent)`, `var(--info)`) so charts adapt cleanly without prohibited glows or gradients.
  - *Stored State Presentation:* Reading the persisted `{ current, lastActiveDate }` streak object directly from `progress.json`.
- **Verification checklist:**
  - [ ] Open `/` as demo user -> Stat cards display real numbers matching data files (Problems Solved, Streak, Tests, Applications).
  - [ ] Topic progress bars show accurate computed percentages (e.g., 2 solved / 4 total in Arrays = 50%).
  - [ ] Weekly activity chart renders with flat terracotta bars (`--accent`) in light mode and flat warm accent in dark mode.
  - [ ] Go solve a new problem in Problem Details -> Return to Dashboard: Solved count and topic progress bar increment immediately.
- **Rough time estimate:** 2.5 Hours

---

## Phase 10: Profile & Settings
- **Goal:** Provide profile management where users can view overall statistics, edit placement goals and technical skills tags, and synchronize theme preferences via `POST /api/progress`.
- **Includes loading, error, and empty states for its pages.**
- **Files to create or change:**
  - `server/controllers/progressController.js` (handle `{ action: "updateProfile", skills, goals, theme }` in `POST /api/progress`)
  - `client/src/pages/Profile.jsx`
  - `client/src/components/SkillTagsInput.jsx`
- **Concepts I'll learn in it:**
  - *Tag/Chip Management UI:* Building tag inputs with add on Enter and remove on click.
  - *Cross-Device Preference Persistence:* Storing user settings in both client `localStorage` and backend user profile.
  - *Unified Action Endpoints:* Reusing `POST /api/progress` for profile updates with `action: "updateProfile"`.
- **Verification checklist:**
  - [ ] Open `/profile` -> Displays user name, email, avatar with initials, and preparation summary.
  - [ ] Add new skill tag (e.g., "Node.js") and update placement goal -> Save sends `POST /api/progress` with `{ action: "updateProfile" }`.
  - [ ] Reload page -> Updated skills and goals persist from `progress.json`.
  - [ ] Change theme preference -> Updates both current view and stored user profile preference.
- **Rough time estimate:** 1.5 Hours

---

## Phase 10B: Client-Side Test Runner (JavaScript Web Worker)
- **Goal:** Add browser-isolated JavaScript test execution inside a Web Worker with 2-second timeout, network API lockdown, test case evaluation, diff viewing, and starter code.
- **Safety:** Code executes ONLY in the browser worker; zero evaluation on server (no eval/new Function/vm/child_process in `server/`).
- **Files to create or change:**
  - `server/utils/validators.js` (validate optional `functionName`, `starterCode`, `compare`, `testCases`)
  - `server/controllers/questionController.js` (accept and sanitize optional test runner fields on POST/PUT)
  - `server/scripts/seed.js` (seed ~12 questions with test cases, starter code, and function names)
  - `client/src/utils/testRunner.js` (worker wrapper with 2-second timeout and promise resolution)
  - `client/src/utils/testWorker.js` (isolated worker with network API lockdown, console capture, and deep compare)
  - `client/src/pages/ProblemDetails.jsx` (Run Tests button, starter code prefill, results panel, JavaScript-only notice, and "Mark as Solved" CTA)
  - `client/src/pages/QuestionForm.jsx` (admin test cases editor and function metadata)
  - `client/src/index.css` (results panel, status badges, code comparison styles)
  - `server/scripts/test-phase10b.js`
- **Concepts I'll learn in it:**
  - *Web Worker Sandboxing:* Executing untrusted client code in background threads with network APIs revoked.
  - *Hard Timeout Termination:* Preventing infinite loops (`while(true){}`) with `worker.terminate()`.
  - *Deep Equality Comparison:* Comparing primitive, array, and object results with exact vs. unordered array matching.
- **Verification checklist:**
  - [ ] Run Tests passes on correct solution and fails with expected vs. actual on wrong code.
  - [ ] Infinite loops terminate within 2 seconds with "Time limit exceeded" without freezing the browser UI.
  - [ ] Network attempts (`fetch`, `XMLHttpRequest`, `WebSocket`) are blocked inside the worker.
  - [ ] Hidden tests display pass/fail without revealing secret test arguments or expected outputs.
  - [ ] Questions without test cases render without the button; non-JS languages show supported notice.
- **Rough time estimate:** 2.5 Hours

---

## Phase 11: Comprehensive Polish, Responsive Drawer & A11y Audit
- **Goal:** Perform an audit of the entire application across desktop, tablet, and mobile; verify all loading/error/empty states, keyboard accessibility, and contrast.
- **Files to create or change:**
  - `client/src/components/Sidebar.jsx` (mobile slide-out drawer with toggle button for screens < 900px)
  - `client/src/components/Loader.jsx`, `client/src/components/ErrorMessage.jsx`, `client/src/components/EmptyState.jsx` (audit shared components)
  - `client/src/index.css` (focus rings, responsive table scrolling, media query transitions)
  - Audit across all pages for loading, error, and empty state coverage
- **Concepts I'll learn in it:**
  - *Systematic Frontend Auditing:* Validating edge cases (network timeouts, empty lists, slow connections) across every route.
  - *Mobile-First Responsive Layouts:* Media queries, off-canvas drawers, and flexible grid transitions.
  - *Web Accessibility (a11y):* ARIA attributes, semantic HTML tags, keyboard tab order, and WCAG AA contrast.
- **Verification checklist:**
  - [ ] Resize viewport to 375px (mobile) -> Sidebar collapses to hamburger menu; toggles smoothly as an off-canvas drawer.
  - [ ] Disconnect network / stop server -> Pages display styled error messages with functional "Retry" buttons.
  - [ ] View an empty account -> Problem list, applications, and activity show friendly empty states with action buttons.
  - [ ] Navigate entire app using only `Tab` and `Enter` -> Visible terracotta focus ring on every button, link, and input.
- **Rough time estimate:** 1.5 Hours

---

## Phase 12: End-to-End Testing & Documentation (README)
- **Goal:** Perform full end-to-end regression testing and write a comprehensive, clear, and honest project README.
- **Files to create or change:**
  - `README.md` (project overview, architecture diagram, exact setup steps, demo credentials, complete feature list, tech stack)
- **Concepts I'll learn in it:**
  - *Technical Documentation:* Writing clear setup guides, API specifications, and architectural documentation.
  - *End-to-End Verification:* Systematically validating every user flow and edge case in a complete full-stack web application.
- **Verification checklist:**
  - [ ] Test complete user journey: Signup new user -> Login -> Solve problems -> Take mock test -> Add application -> Verify dashboard.
  - [ ] Test admin journey: Login as admin -> Add new question -> Edit question -> Verify appearance in student account.
  - [ ] Follow README from scratch on a clean folder clone -> Verify all commands work seamlessly.
- **Rough time estimate:** 1.5 Hours

---

## Phase: Profile Photo
- **Goal:** Add lightweight profile photo customization with browser-side canvas crop & resize, EXIF stripping, binary signature verification, and multi-surface instant avatar synchronization.
- **Files to create or change:**
  - `server/data/avatars.json` (gitignored, created on first write)
  - `server/routes/profileRoutes.js`, `server/controllers/profileController.js` (`GET`, `PUT`, `DELETE /api/profile/avatar`)
  - `server/utils/fileDb.js` (`FILES.AVATARS`)
  - `server/server.js` (mount profile routes with route-specific 200 KB body limit)
  - `client/src/components/Avatar.jsx` (reusable responsive circular avatar with image loader and initials fallback)
  - `client/src/components/CropModal.jsx` (HTML5 canvas circular stencil crop, drag to pan, zoom slider, keyboard navigation)
  - `client/src/context/AuthContext.jsx` (global avatar state, session hydration, live update, logout cleanup)
  - `client/src/pages/Profile.jsx` (Change photo / Remove photo in edit mode, view-only in default mode)
  - `client/src/components/Sidebar.jsx`, `client/src/components/Layout.jsx`, `client/src/pages/Dashboard.jsx` (integrate `<Avatar />`)
  - `client/src/services/api.js` (`getAvatar`, `uploadAvatar`, `deleteAvatar`)
  - `server/scripts/test-avatar.js` (automated test suite for binary validation, magic bytes, oversized 413, SVG rejection, user privacy)
- **Concepts I'll learn in it:**
  - *Client-Side Canvas Image Processing:* Cropping, scaling, and re-encoding raster images to WebP/JPEG using standard HTML5 Canvas without third-party libraries.
  - *EXIF Privacy Sanitization:* Why re-encoding images in a canvas strips sensitive metadata (GPS coordinates, camera serial numbers).
  - *Magic Bytes & File Signature Validation:* Why relying on file extensions is unsafe and how inspecting raw buffer headers prevents malicious file uploads.
  - *Route-Specific Body Parsers:* Applying larger payload limits (200 KB) only to specific upload routes while keeping global server limits tight (100 KB).
  - *Global Media State Synchronization:* Updating context state so avatar changes reflect instantly across topbar, sidebar, drawer, and profile without full reloads.
- **Verification checklist:**
  - [ ] Upload JPG, PNG, and WebP photos; avatar displays immediately on Profile, sidebar, mobile drawer, topbar, and dashboard.
  - [ ] Uploaded avatar persists across page refreshes and backend server restarts.
  - [ ] Attempting to upload SVG, GIF, or a PDF renamed to `.jpg` is rejected with a descriptive 400 error.
  - [ ] Oversized payloads (>200 KB) trigger a clean 413 error from the API.
  - [ ] User A cannot view, modify, or delete User B's profile photo.
  - [ ] Removing avatar reverts to initials circle across all views immediately.
  - [ ] `avatars.json` is ignored by Git and never committed to version control.
- **Rough time estimate:** 2.0 Hours
