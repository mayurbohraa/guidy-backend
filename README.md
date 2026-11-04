# Guidy Backend

## About the project

Guidy’s Express API enforces role and ownership rules, persists academic records and uploaded files in MongoDB, and coordinates resource moderation and in-app notification delivery.

## Key features

- JWT authentication, current-account lookup, and role checks for course administration and resource moderation.
- Authenticated profile viewing and contact editing, with explicit restrictions on editable fields.
- Course registration, schedules, events, tasks, notebooks, grades, progress, and notifications.
- Ownership-scoped changes to personal tasks, events, notebooks, and notifications.
- Resource submission, pending-only review updates, and authenticated downloads with approval checks.
- File-format validation, persistent GridFS storage, and optional ClamAV scanning.
- Role-aware workspace search, an administrator-only user directory, and durable notification retries.
- Repeatable showcase data and bundled fictional documents for demonstration downloads.

Recovery uses a password-bound code that can be revealed only by the signed-in owner through their authenticated session. Use GET /profile/recovery-code to reveal the code and POST /verify-recovery-code to check it before reset. Resetting the password invalidates the old code and sessions. Approval records an in-app notification without sending email or disclosing the code.

## Repositories

- [Backend repository](https://github.com/mayurbohraa/guidy-backend)
- [Companion frontend repository and application setup](https://github.com/mayurbohraa/guidy-frontend)

## Tech stack

Node.js, TypeScript 4.9, Express 4, MongoDB, Mongoose 6, Passport JWT, jsonwebtoken, bcrypt, Multer, dotenv, cors, and phone. Regression checks use Node's built-in test runner.

## Prerequisites

- Node.js 24 and npm; the latest recorded checks used Node.js 24.13.0 and npm 11.12.1.
- Git to clone the repository.
- A reachable MongoDB instance or Atlas cluster and a valid connection string.

## Installation and setup

1. Clone and open the backend repository:

   ```sh
   git clone https://github.com/mayurbohraa/guidy-backend.git
   cd guidy-backend
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
| `PORT` | No | API port. Defaults to `4000`. |
| `CRON_SECRET` | No | At least 32 characters to enable scheduled notification processing. |
| `CLAMAV_HOST`, `CLAMAV_PORT` | No | Private ClamAV service address. Port defaults to `3310`. |
| `REQUIRE_MALWARE_SCAN` | No | Set to `true` to reject uploads when scanning is unavailable. |
| `TEST_DB_URL` | No | MongoDB connection for isolated integration tests. Falls back to `DB_URL`. |

Keep `.env` and credentials outside Git. Set hosting variables separately. The current entry point preserves the project's DNS resolvers (`8.8.8.8` and `1.1.1.1`) and IPv4 preference for Atlas connections. If startup cannot connect, check cluster availability, network access, credentials, and DNS resolution.

## Commands and verification

| Command | Purpose |
|---|---|
| `npm run dev` | Run the API with automatic restart. |
| `npm run build` | Compile TypeScript into `dist/`. |
| `npm start` | Run the compiled server after building. |
| `npm test` | Compile and run the backend regression suite. |
| `npm run test:integration` | Test against a uniquely named temporary MongoDB database and remove that database afterward. |
| `npm run migrate:uploads` | Copy available legacy files into GridFS and preserve the originals. |
| `npm run seed:demo` | Compile and insert missing showcase records into the configured database. |

## API overview

All paths below are relative to `/api/v1`. Protected requests use `Authorization: Bearer <token>`.

| Area | Endpoints or responsibility |
|---|---|
| Authentication | `POST /signup`, `POST /login`; public signup allows student and contributor roles. |
| Password change | `PUT /profile/password` verifies the current password and invalidates existing sessions on success. |
| Profile | `GET /profile`, `PUT /profile`; edit first name, last name, university email, and optional mobile number. |
| Courses | `/course`; lookup, year/term subjects, and administrator writes. |
| Registration | `/registration`; current selection, registration, course dropping, and semester clearing. |
| Personal records | `/events`, `/tasks`, `/notebook`, and `/grades`. |
| Resources | `/resources`; submissions, approved library, administrator queue, moderation, and downloads. |
| Search and directory | `GET /search` returns role-scoped results. `GET /users` is administrator-only. |
| App metadata | `GET /role` lists roles and signup eligibility. `GET /settings` describes upload policy. |
| Notifications | `/notifications`; account messages and read status. |

New registrations require four to six courses from the same year and term. Administrators are provisioned separately. Import `Guidy.postman_collection.json` for request examples and configure its variables with your own endpoint and account values.

Contributors use `GET /resources/mine` to see their own submissions and review statuses. They can download their own files and withdraw a pending submission via `DELETE /resources/mine/:id`.

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
| Search and directory | `GET /search` returns role-scoped results. `GET /users` is administrator-only. |
| App metadata | `GET /role` lists roles and signup eligibility. `GET /settings` describes upload policy. |
| Notifications | Three per demo role, including read and unread examples. |

Stable IDs and insert-only writes prevent duplicate records and preserve existing grades, registrations, completed tasks, and review decisions. Dates are relative to the first insertion. A second run during verification inserted zero records.

## File storage and deployment

New uploads are stored in MongoDB GridFS. Legacy downloads can use the original file when it still exists, and the migration command copies available files into GridFS. The upload limit is 10 MiB locally and 4 MiB on Vercel to allow room for multipart overhead. See the [Vercel Functions limits](https://vercel.com/docs/functions/limitations).

Format checks run for every new upload. Malware scanning requires a reachable private [ClamAV service](https://docs.clamav.net/manual/Usage/ClamdProtocol.html). Configure it and set `REQUIRE_MALWARE_SCAN=true` to require a successful scan.

Resource events and their notification jobs are saved together. Jobs retry when due on notification reads, through the admin retry action, or through an external scheduler calling `GET /api/v1/jobs/notifications` with `Authorization: Bearer <CRON_SECRET>`.

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

## Verification

On 4 November 2026, TypeScript compilation, 14 regression checks, and 12 isolated MongoDB workflow tests passed. The workflows cover role permissions, ownership, uploads, moderation, contributor withdrawals, notification retries, search, and recovery. Hosted deployment verification remains pending.
