# PRD: DevPrep – Developer Preparation Platform

## 1. Overview
DevPrep is a full-stack web app that helps students prepare for coding interviews and placements. It combines a problem library, mock tests, DSA progress tracking, a job/internship application tracker, and a preparation dashboard in one place.

It is a college project (B.Tech CSE, GGSIPU) built within a **2-day** target. It must be functional (real CRUD, real API calls), not a static UI, and the student must be able to explain every part of the code in a viva.

## 2. Target Users
- **Primary:** B.Tech / college students preparing for placements and internships.
- **Secondary:** An admin who manages the shared question bank.
- Multiple users, each with their own account. Roles: `user` (default) and `admin`.

## 3. Goals
1. Let a student practice problems, track which are solved, and see progress by topic.
2. Let a student take topic-wise mock tests and review results.
3. Let a student track job/internship applications.
4. Let multiple students create their own accounts (signup/login) so each has private progress, applications, and test history.
5. Demonstrate React frontend, Node/Express backend, REST APIs, CRUD, JSON file storage, authentication and authorization, client-server communication, state management, responsive design, and data visualization.

## 4. Non-Goals (Out of Scope)
- No database (MongoDB, MySQL, PostgreSQL, SQLite, Firebase, etc.).
- No real code execution, compiler, or sandbox API. A "My Solution" code notepad allows students to write and save personal code solutions per language (JavaScript, Python, Java, C++), but code is strictly persisted as text and never executed, compiled, or evaluated.
- No social/OAuth login, email verification, password reset, or refresh tokens (basic email + password only).
- No payments, emails, or third-party integrations.
- No AI features inside the app.

## 5. Features

### 0. Authentication (Signup / Login)
- **Signup:** name, email, password, confirm password. Email must be valid and unique; password at least 8 characters with a letter and a number.
- **Login:** email + password. Logout button in the sidebar.
- Session survives a page refresh. An invalid or expired token sends the user back to the login page.
- Passwords are hashed and never stored or returned in plain text.
- Roles: new accounts are `user`; a seeded account is `admin`. Only admins can see and use the Admin section (enforced on the server, not just hidden in the UI).
- Each user has their own progress, applications, mock test attempts, and profile. The question bank is shared.
- Login and Signup pages support both themes and include the theme toggle.
- **Acceptance:** two different accounts see different data; a logged-out visitor can only reach `/login` and `/signup`.

### A. Dashboard
- Stat cards: Problems Solved, Current Streak, Mock Tests Completed, Applications.
- DSA progress by topic (progress bars): Arrays, Strings, Linked Lists, Stack, Queue, Trees, Graphs, Dynamic Programming, Binary Search. Values are **computed** from solved questions vs total questions per topic.
- Recent activity list.
- Weekly progress chart (Recharts).
- **Acceptance:** all numbers come from the API, and marking a problem solved updates the dashboard.

### B. Problem Library
- Table of questions with: title, topic, difficulty, solved/unsolved status, and saved-solution indicator.
- Search by title; filter by topic; filter by difficulty (filters work together).
- Click a row to open Problem Details.
- **Acceptance:** filtering is done via API query params (`topic`, `difficulty`, `search`).

### C. Problem Details
- Shows title, topic, difficulty badge, description, examples, constraints, solution approach.
- "Mark as Solved" button (toggle) that persists via the API.
- "My Solution" code notepad: Monospace text editor supporting 4 languages (JavaScript, Python, Java, C++), Tab key indentation, Save button, unsaved changes indicator, Clear with confirmation, and "Saved at <time>" timestamps. Code is persisted via API to JSON storage. No compiler or code execution.

### D. Mock Tests
- Select topic and number of questions, then start.
- One question at a time, multiple-choice, Previous/Next navigation, question counter ("Question 3 of 10"), and a timer.
- Submit to compute score and accuracy.
- Result page: score (e.g. 8/10), accuracy (80%), topic-wise performance, answer review (your answer vs correct answer, with explanation).
- Backend selects and shuffles questions; correct answers are checked on the server at submit time.
- Each attempt is saved per user so "Mock Tests Completed" is accurate.

### E. Job / Internship Tracker
- Add, edit, delete applications (modal form). Each user sees only their own applications.
- Fields: Company Name, Role, Location, Applied Date, Status, Notes.
- Statuses: Applied, Interview, Rejected, Selected.
- Search and filter by status; statistics (count per status).

### F. Admin Question Management
- Table of all questions with Add, Edit, Delete.
- Fields: Title, Topic, Difficulty, Description, Examples, Constraints, Solution Approach.
- Delete asks for confirmation. Only users with the `admin` role can open this page or call the write endpoints.

### G. Profile & Settings
- The logged-in user's profile (name, email, skills, goals), preparation statistics, and theme preference (light/dark).
- Skills and goals are editable and saved per user.
- Profile photo avatar with client-side crop & resize and server-side avatar storage.

### H. Profile Photo (Phase: Profile Photo)
- Client-side canvas crop & resize to a 256x256 square (WebP with JPEG fallback, 15–60 KB). Strips all EXIF metadata (e.g. GPS coordinates) upon re-encoding.
- Stored separately from `users.json` in `server/data/avatars.json` as `{ "<userId>": { "dataUrl": "...", "updatedAt": "..." } }` to keep user records lightweight.
- REST endpoints scoped to `req.user.id`: `GET /api/profile/avatar`, `PUT /api/profile/avatar` (max 200 KB JSON body), `DELETE /api/profile/avatar`.
- Security validation: Rejects non-raster formats (SVG, GIF). Verifies magic bytes for JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), and WebP (`RIFF....WEBP`). Rejects malformed base64 and files exceeding 100 KB binary size.
- Reusable `<Avatar />` component rendering across Profile, sidebar, mobile drawer, topbar, and dashboard greeting with fallback initials and image loading placeholder.
- Interactive crop modal with zoom slider, pan drag, keyboard arrows, and instant synchronization via `AuthContext`.

### I. Admin MCQ Bank Management
- Admin-only management of the multiple-choice question bank in `mockTests.json`.
- List of questions with search and topic filter, per-topic question count summary, and flags/warnings for topics with fewer than 5 questions.
- Create, edit, and delete questions with full validation: topic (valid DSA topic), question (required, max 500 chars), options (2 to 6 unique, non-empty, max 200 chars each), correctIndex (integer pointing to valid option), explanation (optional, max 500 chars).
- Duplicate question text within the same topic rejected with 409 Conflict.
- Deleting or editing an MCQ does not break past attempts (reviews store a snapshot at submit time, and UI handles missing questions gracefully).
- User-facing Mock Test setup dynamically caps question count to available count and warns when fewer questions are available.

### I. Client-Side Test Runner (JavaScript Web Worker)
- Client-side isolated test execution for JavaScript algorithmic questions.
- Safety: Code executes strictly in the browser inside a dedicated Web Worker thread. Never executes on the Express server (no eval, new Function, vm, or child_process in server/).
- Network isolation: Worker explicitly deletes/disables `fetch`, `XMLHttpRequest`, `WebSocket`, `importScripts`, and `indexedDB`.
- Execution bounds: 2-second hard timeout (terminates worker with "Time limit exceeded") and 50-line console output cap.
- Data model extensions in `questions.json`: optional `functionName`, `starterCode`, `compare` (`"exact"` or `"unorderedArray"`), and `testCases` array (max 20 cases of `{ args, expected, hidden }`).
- Results display: Pass/Fail breakdown, input args, expected output, received output, execution runtime (ms). Hidden test cases reveal only pass/fail status without exposing secret test cases.
- Solved integration: When all test cases pass, a "Mark as Solved" button is offered (does not auto-mark).

### J. Notes (stretch, only if time permits)
- Simple notes list with add/delete. Skip if behind schedule.

## 6. Seed Data Requirements
- At least 3–4 questions per topic (about 30–36 total), mixed difficulties, including: Two Sum, Valid Parentheses, Merge Two Sorted Lists, Binary Tree Inorder Traversal, Maximum Subarray, Climbing Stairs, Graph Valid Tree, Coin Change.
- At least 5 multiple-choice mock test questions per topic.
- 5 sample applications (owned by the demo user): Google (SDE Intern, Interview), Microsoft (SWE Intern, Applied), Amazon (SDE Intern, Rejected), TCS (Graduate Engineer, Selected), Adobe (Frontend Intern, Applied).
- A seeded demo user (`demo@devprep.com` / `Demo@1234`) with sample solved problems, activity, and applications so the dashboard looks populated for demos, plus a seeded admin account (credentials from `.env`). New signups start with empty progress. Numbers in the UI mockup (e.g. 127 solved) were visual reference only; real numbers must match the data.

## 7. Non-Functional Requirements
- Responsive (desktop, tablet, mobile; sidebar collapses on small screens).
- **Light/dark theme toggle** available on every page (including login/signup). It persists across reloads, defaults to the OS preference on first visit, and has no flash of the wrong theme on load.
- Loading and error states on every API-backed page.
- Clean, readable, beginner-friendly code with comments where helpful.
- Runs locally with `npm install` and `npm run dev` in each of `client` and `server`.

## 8. Success Criteria
- All features above work end to end with data persisted in JSON files across server restarts.
- No console errors in normal use.
- The student can explain the architecture, API flow, and JSON storage logic.
- README with setup instructions exists.
