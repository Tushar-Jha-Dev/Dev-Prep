# Rules: DevPrep (read before every task)

You are helping a B.Tech student build DevPrep for a college project. The student must **understand** the code, so teach while you build.

Read `PRD.md`, `Architecture.md`, `Design.md`, `Phases.md`, and `Memory.md` before starting any work.

## 1. Workflow
1. Work on **one phase at a time**, exactly as listed in `Phases.md`. Do not start the next phase until the student says "approved".
2. Before coding a phase, give a short plan (files to create or change).
3. After coding, summarize what you built, how to run and test it, and what the student should check manually.
4. Explain every new file and every important block of code in simple, beginner-friendly language. Add short comments in the code where they help understanding.
5. When a phase is finished, **update `Memory.md`** (see section 8).
6. If something in the docs is unclear or conflicts, ask the student instead of guessing.
7. Prefer the simplest solution that works. Do not over-engineer.

## 2. Tech Boundaries

**Use only:** React + Vite (JavaScript), React Router, plain CSS with CSS variables, Recharts, Lucide React, native fetch, Node.js, Express, cors, bcryptjs, jsonwebtoken, dotenv, nodemon, `fs/promises`, `path`, `crypto`, and `@neondatabase/serverless` (Postgres storage driver).

**Do NOT use or add:**
- Any other database driver or ORM (MongoDB, Mongoose, MySQL, SQLite, Prisma, Sequelize, Firebase, Supabase, etc.)
- TypeScript, Next.js, Redux, axios, Tailwind, or UI kits (MUI, Bootstrap, Chakra, shadcn) unless the student approves
- Passport, express-session, OAuth/social login, or third-party auth services (Firebase Auth, Auth0, Clerk). Auth must be done exactly as described in `Architecture.md` section 9
- Code-execution features on the server (compilers, server-side sandbox APIs, backend code evaluation runners). Note: A client-side JavaScript test runner inside an isolated Web Worker (Phase 10B) is approved under the Safety Rules below.
- Any new package not listed above without asking first and explaining why

### Approved Override: PostgreSQL Storage Driver for Vercel Deployment
- **Scope Change Approved:** To enable production deployment on Vercel with persistent data, DevPrep supports two interchangeable storage drivers behind a unified storage interface (`server/storage/`):
  1. `file` driver (default): Local JSON file persistence via `server/utils/fileDb.js` for local development and offline testing.
  2. `postgres` driver: Cloud PostgreSQL persistence via Neon on Vercel Serverless.
- **Approved Package:** Exactly ONE Postgres client package (`@neondatabase/serverless`). No ORMs.
- **Driver Selection:** Controlled by `STORAGE_DRIVER` env var (or auto-selected in production when `DATABASE_URL` is set). Local dev without `DATABASE_URL` remains 100% functional with local JSON files.
- **Serverless Parallel Safety:** Per-record rows, parameterized SQL queries, explicit transactions, row-level locks (`SELECT ... FOR UPDATE`), and single-statement upserts.
- **API & UI Contract Integrity:** Zero API contract changes; all endpoint routes, JSON request/response formats, and frontend components remain identical.

### Code Execution Safety Rules (Phase 10B)
- User code runs ONLY in the browser, inside a Web Worker. Never execute user code on the Express server: no eval, new Function, vm, or child_process anywhere in server/.
- No external code-execution APIs (Judge0, Piston, etc.) and no new npm packages.
- Never run user code on the main page thread.
- Before running user code, the worker must disable `fetch`, `XMLHttpRequest`, `WebSocket`, `importScripts`, and `indexedDB` so the code can't make network calls.
- Every run has a 2-second timeout. After that the worker is terminated and the user sees "Time limit exceeded". Limit captured console output to 50 lines.

## 3. Scope Boundaries
- Build only what is in `PRD.md`. No extra features, pages, or "nice to haves".
- Do not rename files, folders, routes, or API endpoints defined in `Architecture.md`.
- Do not rewrite or refactor code from earlier phases unless it is broken, and say so if you do.
- Never delete or overwrite the student's data files in `server/data/` except when seeding in the phase that creates them.

## 4. Backend Rules
- Use `async/await` and `fs/promises`. No blocking `fs.readFileSync` in request handlers.
- All JSON file access goes through `server/utils/fileDb.js`. Never read or write files directly in controllers.
- File names and paths are hardcoded constants; never build file paths from user input.
- Validate every POST/PUT body (required fields, allowed values, types, lengths) and return `400` with a clear message on failure. Return `404` for unknown IDs.
- Never send correct answers to the client in `GET /api/mock-test`; grade on the server in `/submit`.
- Handle missing or corrupted JSON files without crashing the server.
- Use consistent error shape: `{ "error": "message" }`.
- Keep the project in plain CommonJS **or** plain ES modules, pick one in Phase 1 and stay consistent.

### Authentication rules
- Follow `Architecture.md` section 9: `bcryptjs` hashing plus JWT in the `Authorization` header.
- Never store or log plain-text passwords. Never return `passwordHash` in any response.
- Use one generic message for failed logins ("Invalid email or password").
- Solutions, applications, progress, and mock-test attempts must be scoped by `req.user.id`. Never trust a `userId` sent in a request body or URL.
- Admin checks happen on the server with `requireAdmin`, not only by hiding buttons.
- Keep it simple: no refresh tokens, password reset, email verification, or social login.
- `JWT_SECRET` comes from `.env`; never hardcode it.

## 5. Frontend Rules
- Functional components with hooks only.
- All API calls go through `src/services/api.js`; components never call `fetch` directly.
- Every page that loads data must handle **loading**, **error**, and **empty** states.
- Follow `Design.md` for colors, spacing, fonts, and components. Use CSS variables, no hardcoded colors in components (including chart colors).
- The light/dark toggle must work on every page, including Login and Signup, and both themes must be checked for readable contrast.
- Do not fall back to generic "AI template" styling (gradients, glassmorphism, purple/blue gradients, emoji icons). Follow the avoid-list in `Design.md`.
- No inline styles except for dynamic values (e.g., progress bar width).
- Use semantic HTML, labels on form inputs, and accessible button text.
- Do not hardcode data that should come from the API (stats, topic progress, lists).

## 6. Code Quality
- Clear names, small components, no duplicated logic when a shared component fits.
- No leftover `console.log`, dead code, or unused imports.
- Keep each file focused; split files over about 250 lines.
- Secrets (`JWT_SECRET`, `ADMIN_PASSWORD`) live only in `server/.env`, which must be listed in `.gitignore`. Commit a `.env.example` with placeholder values instead.

## 7. Testing & Verification
- After each phase, run the app and verify the phase's checklist from `Phases.md`.
- Test new endpoints (e.g., with Postman or curl) and show the student the requests and responses.
- If something fails, fix it and explain the cause. Don't hide errors.

## 8. Memory.md Protocol
After finishing each phase, update `Memory.md` with:
- Current phase and status
- What was built (files created/changed)
- Decisions made and why
- Known bugs or TODOs
- Exact next step

At the start of every session, read `Memory.md` first so context isn't rebuilt from scratch.

## 9. Honesty & Academic Integrity
- Never invent internship organizations, supervisors, dates, or certificates in any file, README, or report.
- When writing the README or report, describe the project as a self-developed full-stack project.
- Don't claim features work unless you have run and verified them.
