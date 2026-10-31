# Architecture: DevPrep

## 1. Tech Stack (approved list; do not add others without asking)

**Frontend (`client/`)**
- React (JavaScript, not TypeScript) + Vite
- React Router (`react-router-dom`)
- Plain CSS with CSS variables (no Tailwind unless explicitly approved)
- Recharts (charts)
- Lucide React (icons)
- Native `fetch` (no axios)

**Backend (`server/`)**
- Node.js + Express
- `cors`
- `bcryptjs` (password hashing), `jsonwebtoken` (JWT), `dotenv` (environment variables)
- `nodemon` (dev dependency)
- Node `fs/promises` and `path` for JSON storage
- `crypto.randomUUID()` for unique IDs (no extra package)

**Tools:** VS Code / Antigravity, Git + GitHub, Postman, npm.

**Storage:** JSON files only. No database.

## 2. High-Level Flow

```
React (Vite, port 5173)
   |  fetch() over HTTP/JSON
   v
Express API (port 5000)
   |  routes -> controllers -> fileDb utility
   v
JSON files in server/data/
```

Request lifecycle: React page calls a function in `services/api.js`, which sends an HTTP request to `/api/...`. The Express route passes it to a controller, which validates input, reads/writes the JSON file through the `fileDb` utility, and returns JSON. React updates state and re-renders.

During development, the Vite dev server proxies `/api` to `http://localhost:5000` (configured in `vite.config.js`), so the client never hardcodes the backend URL.

## 3. Folder Structure

```
DevPrep/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/      Sidebar, StatCard, ProgressBar, QuestionTable,
│   │   │                    DifficultyBadge, Modal, Loader, ErrorMessage,
│   │   │                    ProtectedRoute, AdminRoute, ThemeToggle
│   │   ├── pages/           Dashboard, Problems, ProblemDetails, MockTest,
│   │   │                    TestResult, Applications, AdminQuestions,
│   │   │                    QuestionForm, Profile, Login, Signup
│   │   ├── services/api.js  all fetch calls live here
│   │   ├── context/         AuthContext.jsx, ThemeContext.jsx
│   │   ├── hooks/           (optional) useFetch.js
│   │   ├── App.jsx          routes + layout
│   │   ├── main.jsx
│   │   └── index.css        CSS variables, global styles
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── data/                questions.json, applications.json,
│   │                        progress.json, mockTests.json, users.json,
│   │                        solutions.json, avatars.json (gitignored)
│   ├── routes/              questionRoutes, applicationRoutes,
│   │                        mockTestRoutes, progressRoutes, authRoutes,
│   │                        solutionRoutes, profileRoutes
│   ├── controllers/         one per route file
│   ├── utils/
│   │   ├── fileDb.js        readJson / writeJson with write queue
│   │   └── validators.js    request validation helpers
│   ├── middleware/          auth.js (requireAuth, requireAdmin), errorHandler.js, notFound.js
│   ├── scripts/             seed.js (admin + demo user + demo data)
│   ├── .env.example         JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, PORT
│   ├── server.js
│   └── package.json
├── PRD.md  Architecture.md  Rules.md  Phases.md  Design.md  Memory.md
└── README.md
```

## 4. Frontend Routes

| Path | Page |
|---|---|
| `/login`, `/signup` | Public auth pages |
| `/` | Dashboard |
| `/problems` | Problem Library |
| `/problems/:id` | Problem Details |
| `/mock-tests` | Select topic, take test |
| `/mock-tests/result` | Test Result |
| `/applications` | Job/Internship Tracker |
| `/admin/questions` | Admin question list |
| `/admin/questions/new`, `/admin/questions/:id/edit` | Question form |
| `/admin/mcq` | Admin MCQ Bank management |
| `/profile` | Profile & Settings |

All routes except `/login` and `/signup` are wrapped in `ProtectedRoute`; `/admin/*` routes also use `AdminRoute`. Sidebar navigation: Dashboard, Problems, Mock Tests, Applications, Profile, a Logout button, and an Admin link shown only to admins.

State management: React `useState`/`useEffect` per page, plus React Context for auth and theme. No Redux.

## 5. REST API

All responses are JSON. Errors use `{ "error": "message" }` with a proper status code (400 validation, 401 not logged in, 403 forbidden, 404 not found, 409 duplicate email, 500 server).

**Auth**
- `POST /api/auth/signup` body `{ name, email, password }` returns `{ token, user }`
- `POST /api/auth/login` body `{ email, password }` returns `{ token, user }`
- `GET /api/auth/me` returns the current `user` (requires token)

All endpoints below require the header `Authorization: Bearer <token>`. Question create/update/delete require the `admin` role. Applications, progress, and mock tests are scoped to the logged-in user.

**Questions**
- `GET /api/questions` (optional `?topic=&difficulty=&search=`)
- `GET /api/questions/:id`
- `POST /api/questions`
- `PUT /api/questions/:id`
- `DELETE /api/questions/:id`

**Solutions (My Solution notepad)**
- `GET /api/solutions` returns list of saved solutions for user (`questionId`, `language`, `updatedAt`)
- `GET /api/solutions/:questionId` returns all saved language solutions for that question
- `PUT /api/solutions/:questionId` body `{ language, code }` creates or updates saved solution
- `DELETE /api/solutions/:questionId?language=...` deletes a saved solution for a specific language

**Mock tests**
- `GET /api/mock-test?topic=Arrays&count=10` returns shuffled MCQs **without** correct answers
- `POST /api/mock-test/submit` body `{ topic, answers: [{ questionId, selectedIndex }], timeTaken }`; server grades, saves the attempt, returns score, accuracy, topic-wise result, and per-question review
- `GET /api/mock-test/attempts` returns past attempts for the logged-in user

**Admin MCQ Bank (admin only, requireAuth + requireAdmin)**
- `GET /api/admin/mcq` (optional `?topic=&search=`, includes `correctIndex` and `explanation`)
- `GET /api/admin/mcq/:id` returns single MCQ with answers and explanation
- `POST /api/admin/mcq` body `{ topic, question, options, correctIndex, explanation }`
- `PUT /api/admin/mcq/:id` body `{ topic, question, options, correctIndex, explanation }`
- `DELETE /api/admin/mcq/:id` deletes MCQ from question bank

**Applications**
- `GET /api/applications` (optional `?status=&search=`)
- `POST /api/applications`
- `PUT /api/applications/:id`
- `DELETE /api/applications/:id`

**Progress & profile**
- `GET /api/progress` returns solved IDs, streak, per-topic progress, recent activity, weekly activity, mock test count, profile
- `POST /api/progress` body `{ action: "markSolved" | "unmarkSolved" | "updateProfile", ... }`

**Profile Avatar (Phase: Profile Photo)**
- `GET /api/profile/avatar` returns `{ avatar: dataUrl | null }`
- `PUT /api/profile/avatar` body `{ image: "data:image/webp;base64,..." }` (strictly max 200 KB body limit) returns `{ avatar: dataUrl }`
- `DELETE /api/profile/avatar` removes avatar and returns `{ message: "Avatar removed", avatar: null }`
- Note: Scoped strictly to `req.user.id`. Binary size limit 100 KB with magic byte signature verification (JPEG, PNG, WebP). Rejects SVG, GIF, and renamed binaries.

## 6. JSON Data Models

**questions.json** (array)
```json
{
  "id": "uuid-or-number",
  "title": "Two Sum",
  "topic": "Arrays",
  "difficulty": "Easy",
  "description": "...",
  "examples": [{ "input": "nums = [2,7,11,15], target = 9", "output": "[0,1]" }],
  "constraints": ["2 <= nums.length <= 10000"],
  "solutionApproach": "Use a HashMap...",
  "functionName": "twoSum",
  "starterCode": "function twoSum(nums, target) {\n  // Write your code here\n}",
  "compare": "unorderedArray",
  "testCases": [
    { "args": [[2, 7, 11, 15], 9], "expected": [0, 1], "hidden": false },
    { "args": [[3, 2, 4], 6], "expected": [1, 2], "hidden": true }
  ]
}
```
*(The `functionName`, `starterCode`, `compare`, and `testCases` fields are optional. When present, the frontend enables the client-side JavaScript Web Worker test runner.)*

**mockTests.json**
```json
{
  "questionBank": [
    { "id": "...", "topic": "Arrays", "question": "...", "options": ["A","B","C","D"],
      "correctIndex": 1, "explanation": "..." }
  ],
  "attempts": [
    { "id": "...", "userId": "...", "topic": "Arrays", "score": 8, "total": 10, "accuracy": 80,
      "date": "2026-10-28T10:00:00Z", "topicBreakdown": {} }
  ]
}
```
(The mock test needs multiple-choice options, which the coding-question schema doesn't have, so MCQs live in their own bank.)

**applications.json** (array)
```json
{ "id": "...", "userId": "...", "company": "Google", "role": "SDE Intern", "location": "Bangalore",
  "appliedDate": "2026-10-01", "status": "Interview", "notes": "" }
```

**solutions.json** (array)
```json
{ "id": "...", "userId": "...", "questionId": "q-arr-1", "language": "JavaScript",
  "code": "function twoSum(nums, target) {\n  // solution\n}", "updatedAt": "2026-10-30T00:00:00Z" }
```

**users.json** (array)
```json
{ "id": "...", "name": "", "email": "lowercase@example.com", "passwordHash": "...", "role": "user", "createdAt": "..." }
```

**progress.json** (object keyed by userId)
```json
{
  "<userId>": {
    "solvedQuestionIds": [],
    "streak": { "current": 0, "lastActiveDate": null },
    "activity": [{ "type": "solved", "text": "Solved Two Sum", "date": "..." }],
    "profile": { "skills": [], "goals": [], "theme": "light" }
  }
}
```
Topic percentages, solved counts, and weekly chart data are **computed** at request time, not stored.

**avatars.json** (object keyed by userId, gitignored)
```json
{
  "<userId>": {
    "dataUrl": "data:image/webp;base64,UklGR...",
    "updatedAt": "2026-10-30T12:00:00.000Z"
  }
}
```
Stores cropped 256x256 client-sanitized images (15–60 KB). Created on first write; deleting an avatar removes the key.

## 7. JSON Storage Design (`utils/fileDb.js`)
- Resolve all paths with `path.join(__dirname, '..', 'data', fileName)`; file names are hardcoded constants, never taken from user input.
- `readJson(file, fallback)`: use `fs/promises.readFile`; if the file is missing, create it with the fallback; if JSON is invalid, log the error and return the fallback (or a clear 500), never crash.
- `writeJson(file, data)`: serialize writes per file through a simple promise queue to avoid simultaneous write corruption; write to a temp file then rename for atomic saves.
- IDs generated with `crypto.randomUUID()` (seed data may use readable IDs).

## 8. Error Handling
- Controllers use `try/catch` and pass errors to a central `errorHandler` middleware.
- `validators.js` checks required fields, allowed enum values (topics, difficulties, statuses), types, and max lengths, returning 400 with clear messages.
- The client shows a loading state, an error message with retry, and an empty state on every data page.

## 9. Authentication & Authorization
- **Libraries:** `bcryptjs` (10 salt rounds), `jsonwebtoken` (7-day expiry), `dotenv`.
- **`.env`:** `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `PORT`. Commit `.env.example`, never `.env`.
- **Signup:** validate input, lowercase the email, reject duplicates (409), hash the password, save with role `user`, return `{ token, user }` (never the hash). Create an empty progress entry for the new user.
- **Login:** find user by email, `bcrypt.compare`; use the same message for unknown email and wrong password ("Invalid email or password"); return `{ token, user }`.
- **Token:** sent as `Authorization: Bearer <token>`; stored in the client's localStorage (simple, but note the trade-off in the report: httpOnly cookies are safer in production).
- **Middleware:** `requireAuth` verifies the token and sets `req.user = { id, role }`; `requireAdmin` checks `req.user.role === "admin"`.
- **Ownership:** controllers for applications, progress, and mock-test attempts always scope by `req.user.id`. IDs belonging to another user return 404.
- **Client:** `AuthContext` (user, login, signup, logout), `ProtectedRoute`, `AdminRoute`; `api.js` attaches the token, and on a 401 response clears auth and redirects to `/login`.
- **Seed:** `npm run seed` creates the admin and demo users and the demo user's sample data.

## 10. Deployment (optional, last phase)
Local run is the baseline. If time permits: client on Vercel, server on Render/Railway (note: free hosts may reset local JSON files, so mention this limitation in the report).
