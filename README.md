# Guidy Backend

## About the project

The Guidy API supports a university academic tracker with student, contributor, and administrator workflows. It authenticates accounts, stores academic records in MongoDB, and manages the submission and review of learning resources.

## Key features

- JWT authentication, current-account lookup, and role checks for course administration and resource moderation.
- Authenticated profile viewing and contact editing, with explicit restrictions on editable fields.
- Course registration, schedules, events, tasks, notebooks, grades, progress, and notifications.
- Ownership-scoped changes to personal tasks, events, notebooks, and notifications.
- Resource submission, pending-only review updates, and authenticated downloads with approval checks.
- One-file uploads up to 10 MB, with an allowlist of document, image, and ZIP extensions.
- Repeatable showcase data and bundled fictional documents for demonstration downloads.

## Repositories

- [Backend repository](https://github.com/mayurbohraa/guidy_backend)
- [Companion frontend repository and application setup](https://github.com/mayurbohraa/guidy_frontend)

## Tech stack

Node.js, TypeScript 4.9, Express 4, MongoDB, Mongoose 6, Passport JWT, jsonwebtoken, bcrypt, Multer, dotenv, cors, and phone. Regression checks use Node's built-in test runner.

## Prerequisites

- Node.js 24 and npm; the latest recorded checks used Node.js 24.13.0 and npm 11.12.1.
- Git to clone the repository.
- A reachable MongoDB instance or Atlas cluster and a valid connection string.

## Installation and setup

1. Clone and open the backend repository:

   ```sh
   git clone https://github.com/mayurbohraa/guidy_backend.git
   cd guidy_backend
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Copy `.env.example` to `.env`, then configure the variables below. Generate a signing secret with:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

4. Save that generated value as `secret_key` in `.env` and set `DB_URL` to the intended database.
5. Start the API:

   ```sh
   npm run dev
   ```

6. Check `http://localhost:4000/`. The server opens its port after MongoDB connects. Application endpoints use the `/api/v1` prefix.

## Environment configuration

| Variable | Required | Purpose |
|---|---|---|
| `DB_URL` | Yes | MongoDB connection string. The example uses a local `guidy` database. |
| `secret_key` | Yes | Random JWT signing secret of at least 32 bytes. |
| `PORT` | No | API port; defaults to `4000`. |

Keep `.env` and credentials outside Git. Set hosting variables separately. The current entry point preserves the project's DNS resolvers (`8.8.8.8` and `1.1.1.1`) and IPv4 preference for Atlas connections. If startup cannot connect, check cluster availability, network access, credentials, and DNS resolution.

## Commands and verification

| Command | Purpose |
|---|---|
| `npm run dev` | Run the API with automatic restart. |
| `npm run build` | Compile TypeScript into `dist/`. |
| `npm start` | Run the compiled server after building. |
| `npm test` | Compile and run the backend regression suite. |
| `npm run seed:demo` | Compile and insert missing showcase records into the configured database. |

Latest recorded verification, 3 November 2026: **10 regression tests passed** and TypeScript compilation passed. Additional read-only API checks against MongoDB verified all three supplied demo logins, safe profile responses, populated account sections, student progress, and a sample resource download. The temporary verification server was stopped afterward. The latest hosted deployment has not been verified.

## API overview

All paths below are relative to `/api/v1`. Protected requests use `Authorization: Bearer <token>`.

| Area | Endpoints or responsibility |
|---|---|
| Authentication | `POST /signup`, `POST /login`; public signup allows student and contributor roles. |
| Profile | `GET /profile`, `PUT /profile`; edit first name, last name, university email, and optional mobile number. |
| Courses | `/course`; lookup, year/term subjects, and administrator writes. |
| Registration | `/registration`; current selection, registration, course dropping, and semester clearing. |
| Personal records | `/events`, `/tasks`, `/notebook`, and `/grades`. |
| Resources | `/resources`; submissions, approved library, administrator queue, moderation, and downloads. |
| Notifications | `/notifications`; account messages and read status. |

New registrations require four to six courses from the same year and term. Administrators are provisioned separately. Import `Guidy.postman_collection.json` for request examples and configure its variables with your own endpoint and account values.

## Demo data

Run `npm run seed:demo` only with `DB_URL` pointing to the intended showcase database. The three existing Guidy demo accounts must already exist; the script does not create accounts or change passwords.

| Record type | Seeded data |
|---|---|
| Courses | 32 fictional courses across four years and Fall/Spring terms. |
| Student registration | Four first-year Fall courses, when no registration already exists. |
| Grades | Assessment scores for the 32 demo courses and any additional registered courses lacking grades. |
| Notebooks | Eight student notebooks, covering the eight year/term combinations. |
| Resources | 14 records: eight accepted, four pending, and two denied. |
| Tasks | Five per demo role, including open and completed examples. |
| Events | Six per demo role, including past, current-day, and upcoming examples. |
| Notifications | Three per demo role, including read and unread examples. |

Stable IDs and insert-only writes prevent duplicate records and preserve existing grades, registrations, completed tasks, and review decisions. Dates are relative to the first insertion. A second run during verification inserted zero records.

## File storage and deployment

Locally, uploads are stored in `uploads/`. On Vercel, runtime uploads use temporary storage; ordinary uploaded files need durable shared storage to remain available across instances and redeployments.

The 14 fictional text documents in `scripts/demo-resources/` are included with the source. Authenticated demo downloads can fall back to those bundled files when runtime uploads are absent. Include this directory in the deployment package. The same approval rules still apply.

Deploy the frontend and backend independently, configure the backend environment variables, and point the frontend at the API base URL. The health endpoint reports a running server; it does not prove that every deployed workflow has been tested.

## Project structure

```text
Backend/
├── scripts/
│   ├── demo-resources/          Bundled fictional showcase documents
│   └── seed-demo.cjs            Repeatable database seed
├── src/
│   ├── helpers/                 Authentication, uploads, async and error handling
│   ├── modules/                 Feature routers, controllers, services, and models
│   ├── index.ts                 Server and database startup
│   └── routes.ts                Versioned API routing
├── test/
│   └── security.test.cjs        Security and data-workflow regression checks
├── .env.example
├── .gitignore
├── Guidy.postman_collection.json
├── package.json
├── tsconfig.json
└── README.md
```

## Current limitations

Password recovery needs an email provider and reset-token implementation. Roles and settings modules are scaffolding. Resource notifications are best effort, without a persistent retry queue. Upload checks validate extension and size; they do not scan file contents. Full destructive workflow testing in an isolated database remains pending.
