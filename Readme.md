# Task Board — COP290 Assignment 2

A Jira-inspired project management application built with React, Express, and MongoDB. Teams can create projects, manage Kanban boards, track tasks through configurable workflows, collaborate via comments, and receive in-app notifications.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Running the Application](#running-the-application)
6. [Running the Tests](#running-the-tests)
7. [Design Decisions](#design-decisions)
8. [API Reference](#api-reference)
9. [Database Schema](#database-schema)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router, CSS Modules |
| Backend | Node.js, Express 5, TypeScript, ts-node-dev |
| Database | MongoDB (local), Mongoose ODM |
| Auth | JWT (HTTP-only cookies), bcrypt |
| Testing | Jest, ts-jest, Supertest |
| Style | ESLint, Prettier (Google TypeScript Style Guide) |

---

## Project Structure

```
assignment2/
├── backend/
│   ├── src/
│   │   ├── server.ts          # All Express routes + app export
│   │   └── __tests__/
│   │       └── server.test.ts # Backend unit tests
│   ├── database/
│   │   ├── user.tsx
│   │   ├── project.tsx
│   │   ├── board.tsx
│   │   ├── story.tsx
│   │   ├── task.tsx
│   │   ├── comment.tsx
│   │   └── notifications.tsx
│   ├── jest.config.ts
│   ├── tsconfig.json
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   └── pages/
    │       ├── homepage/
    │       ├── loginpage/
    │       ├── registerpage/
    │       ├── projectpage/
    │       ├── boardpage/
    │       ├── story/
    │       ├── comments/
    │       └── user/
    ├── tsconfig.json
    └── package.json
```

---

## Prerequisites

Make sure the following are installed before you start:

- **Node.js** v18 or higher — https://nodejs.org
- **npm** v9 or higher (comes with Node)
- **MongoDB Community Server** (local) — https://www.mongodb.com/try/download/community

To verify everything is ready:

```bash
node --version    # should print v18.x.x or higher
npm --version     # should print 9.x.x or higher
mongod --version  # should print db version v6.x.x or higher
```

---

## Installation

### 1. Clone or extract the project

```bash
# If from the tar archive:
tar -xvf a2_<entry1>_<entry2>.tar
cd assignment2
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Install testing dependencies (backend only)

If the test packages are not already in `package.json`, install them manually:

```bash
cd backend
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest ts-node
```

**Windows users only** — `NODE_ENV=test` does not work natively on Windows CMD/PowerShell. Install `cross-env` so the test script works cross-platform:

```bash
npm install --save-dev cross-env
```

Then make sure your `backend/package.json` scripts look like this:

```json
"scripts": {
  "test":       "cross-env NODE_ENV=test jest",
  "test:watch": "cross-env NODE_ENV=test jest --watchAll"
}
```

On **macOS / Linux** the scripts work without `cross-env`:

```json
"scripts": {
  "test":       "NODE_ENV=test jest",
  "test:watch": "NODE_ENV=test jest --watchAll"
}
```

---

## Running the Application

You need **three separate terminal windows** — one for MongoDB, one for the backend, one for the frontend.

### Terminal 1 — Start MongoDB

```bash
mongod
```

MongoDB will start and listen on `mongodb://127.0.0.1:27017` by default. Leave this terminal running.

### Terminal 2 — Start the backend

```bash
cd backend
npx ts-node-dev --respawn --transpile-only src/server.ts
```

The backend starts on **http://localhost:3000**. You should see:

```
Server running on 3000
```

### Terminal 3 — Start the frontend

```bash
cd frontend
npm run dev
```

The frontend starts on **http://localhost:5173**. Open this URL in your browser.

### Quick start summary

```
Terminal 1:  mongod
Terminal 2:  cd backend  && npx ts-node-dev --respawn --transpile-only src/server.ts
Terminal 3:  cd frontend && npm run dev
```

---

## Running the Tests

Tests live in `backend/src/__tests__/server.test.ts`. They run fully in-memory — no real MongoDB connection needed, all database calls are mocked.

### Run all tests once

```bash
cd backend
npm test
```

### Run tests in watch mode (re-runs on every file save)

```bash
cd backend
npm run test:watch
```

### What you should see

```
 PASS  src/__tests__/server.test.ts
  Health Check
    ✓ GET / returns 200
  Authentication
    ✓ creates a new user and returns "registered"
    ✓ returns { loggedin: true } and sets a cookie
    ...
  Tests: 74 passed, 74 total
```

### If `npm test` still says "jest not found"

Run Jest directly through npx, which works even if the global PATH does not include your local `node_modules/.bin`:

```bash
cd backend
npx jest
```

For watch mode:

```bash
npx jest --watchAll
```

### How the tests work

All Mongoose models, `jsonwebtoken`, and `bcrypt` are mocked using `jest.mock()`. This means tests never touch MongoDB and run in under a second. The `isLoggedIn` middleware is satisfied by setting a `token` cookie, which the mocked `jwt.verify` accepts and returns a fake user payload for.

If a test unexpectedly returns 302, it means `jwt.verify` returned `undefined` — check that the `beforeEach` block is restoring the mock correctly.

---

## Design Decisions

### Authentication
JWT tokens are stored in HTTP-only cookies so they are not accessible from JavaScript, which protects against XSS attacks. Passwords are hashed using `bcrypt` with a salt round of 10. The `isLoggedIn` middleware verifies the token on every protected route and attaches the decoded user payload to `req.user`.

### Role-Based Access Control
There are two levels of roles. Globally, the user who creates a project becomes its **Global Admin** and has full control. At the project level, a **Project Admin** can manage members and board workflows. **Project Members** can create and edit tasks. **Project Viewers** have read-only access. Roles are determined at request time by comparing the authenticated user's ID against the project's `global_admin`, `project_admin`, and `members` fields.

### Kanban Board and WIP Limits
Each board stores its columns as an embedded array in MongoDB. WIP (Work In Progress) limits are stored as a plain object (`wipLimits`) keyed by column index, e.g. `{ "1": 3 }` means column 1 allows at most 3 tasks. This design lets limits be configured per-column without a schema migration when columns are added or renamed. The limit is enforced on the server in `POST /movetaskonboard` so it cannot be bypassed from the client side.

### Workflow Transitions
Allowed transitions between columns are stored similarly as a `transitions` object (`{ "0": [1], "1": [2, 3] }`). The frontend enforces these client-side for instant feedback, and the server does not re-validate them on move — the WIP limit is the authoritative server-side gate.

### Story Status Sync
A story's status is automatically derived from the earliest-column position of any of its tasks. When a task is moved, the `syncStoryStatus` helper re-scans all columns in order and picks the name of the first column that contains a task belonging to the story.

### Audit Log
Every task creation is logged in an `auditlog` string array. Subsequent status, assignee, and comment changes are intended to be appended to this array. The audit data is stored in MongoDB but there is no dedicated UI to view it — storing it was the requirement.

### Notifications
Notifications are stored as documents in MongoDB and pushed to a user's `notifications` array. The frontend polls `GET /getnotifications/:id` periodically. Users can mark individual notifications as read or clear all of them at once.

### Testing Strategy
All backend routes are tested through the HTTP layer using Supertest so the tests cover real request parsing and response serialisation. The database layer is fully mocked so tests are fast and deterministic. The `__esModule: true` flag is required on every mock factory because the database modules use `export default`, and without it `ts-jest` resolves the default import to `undefined`.

---

## API Reference

All routes are relative to `http://localhost:3000`. Routes marked 🔒 require a valid JWT cookie.

### Auth

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/registerpage` | — | Register a new user. Body: `{ name, email, password, avatar }` |
| POST | `/loginpage` | — | Login. Body: `{ email, password }`. Sets `token` cookie. |
| POST | `/logout` | — | Clears the auth cookie |

### Users

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/profile` | 🔒 | Returns `{ _id, name, avatar }` for the logged-in user |
| GET | `/allusersathome` | — | List all users (name only) |
| GET | `/allusers/:projectId` | — | All users except the project's global admin |
| GET | `/projectusers/:projectId` | — | All users tied to a project (admins + members) |
| GET | `/checkemailexistence/:email` | — | Returns `{ exists: true/false }` |

### Projects

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/createnew` | 🔒 | Create a project. Body: `{ name, description }` |
| GET | `/projects` | 🔒 | All active (non-archived) projects for the current user |
| GET | `/project/:id` | 🔒 | Project details + current user's role |
| GET | `/allprojects` | — | All projects (name only) |
| POST | `/updateprojectdesc/:id` | 🔒 | Update description (admin only). Body: `{ description }` |
| POST | `/archiveproject/:projectId` | 🔒 | Archive a project |
| GET | `/projecttoread/:id` | — | Read-only project view with global admin info |

### Members & Roles

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/addmemberinproject` | — | Add a member. Body: `{ choosenuser, project }` |
| GET | `/getprojectmembers/:id` | — | List project members |
| GET | `/getprojectadmins/:id` | — | List project admins |
| GET | `/allmembersinproject/:id` | — | All non-admin members |
| POST | `/addadminproject` | 🔒 | Promote user to project admin. Body: `{ id, project_admin }` |

### Boards

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/addboardinproject` | — | Create a board with 4 default columns. Body: `{ project }` |
| GET | `/getprojectboards/:id` | — | All boards for a project |
| GET | `/board/:id/:boardpos` | 🔒 | Board details + columns + tasks + role |
| POST | `/deleteboard/:id` | — | Delete a board at position. Body: `{ pos }` |
| GET | `/getprojectboardstoread/:id` | — | Read-only fully populated board view |
| POST | `/movetaskonboard` | — | Move a task between columns (enforces WIP limit). Body: `{ boardid, taskid, from, to }` |
| POST | `/updateworkflow/:id` | 🔒 | Save allowed transitions. Body: `{ transitions }` |
| POST | `/updatewiplimits/:id` | 🔒 | Save WIP limits per column (admin only). Body: `{ wipLimits }` |

### Columns

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/renamecolumn` | 🔒 | Rename column or add new one (`columnpos: -1`). Body: `{ newname, boardid, columnpos }` |
| POST | `/deletecolumn` | 🔒 | Delete a column. Body: `{ boardid, pos }` |

### Stories

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/putstoryonboard/:id` | — | Create story on a board. Body: `[storyname, boardIndex]` |
| GET | `/story/:storyid/:id` | 🔒 | Story details + tasks + role |
| POST | `/addstorytoboard` | — | Push story's tasks into the first board column. Body: `{ storyid }` |
| POST | `/deletestory/:storyid/:id` | 🔒 | Delete story and all its tasks |

### Tasks

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/addtaskinstory` | 🔒 | Create a task. Body: `{ taskname, taskdescription, tasktype, storyid }` |
| POST | `/removetaskinstory/:storyid` | 🔒 | Remove task by index. Body: `{ index }` |
| POST | `/updatetask/:projectId` | 🔒 | Update task fields + fire notifications. Body: `{ _id, assigneeid, reporterid, status, priority, dueDate }` |

### Comments

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/taskcomments/:taskid` | 🔒 | All comments for a task (with user + mention info) |
| POST | `/addcomment` | 🔒 | Add a comment. Body: `{ taskid, text, mentions[] }` |
| POST | `/editcomment` | 🔒 | Edit own comment. Body: `{ editingId, editText }` |
| POST | `/deletecomment` | 🔒 | Delete a comment. Body: `{ commentid }` |

### Notifications

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/getnotifications/:userId` | 🔒 | All notifications for a user |
| POST | `/markasread/:messageId` | 🔒 | Mark a notification as read |
| POST | `/clearmesages` | 🔒 | Delete all notifications for the logged-in user |

---

## Database Schema

### User
```
name, email, password (hashed), avatar,
projects[], archivedprojects[], projectAdmin[],
projectMember[], projectViewer[], notifications[]
```

### Project
```
global_admin (ref: User), name, description,
project_admin[] (ref: User), members[] (ref: User),
boards[] (ref: Board), creationdate, updatedat
```

### Board
```
projectname (ref: Project), stories[] (ref: Story),
columns[{ name, tasks[] (ref: Task) }],
transitions (Object),   // e.g. { "0": [1], "1": [2,3] }
wipLimits (Object)      // e.g. { "1": 3, "2": 5 }
```

### Story
```
boardname (ref: Board), storyname,
tasks[] (ref: Task), status
```

### Task
```
boardname (ref: Board), storyname (ref: Story),
name, description, tasktype (task/bug/story),
assigneeid (ref: User), assignee, reporterid (ref: User), reporter,
status, priority, dueDate, comments[] (ref: Comment),
createdat, updatedat, resolvedat, closedat, auditlog[]
```

### Comment
```
task (ref: Task), user (ref: User),
text, mentions[] (ref: User), createdAt, updatedAt
```

### Notification
```
Message, sendto (ref: User), sendfrom (ref: User),
task (ref: Task), board (ref: Board),
project (ref: Project), story (ref: Story),
date, read (Boolean)
```