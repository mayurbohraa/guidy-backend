# Guidy Backend

## Project Overview

The Guidy API manages accounts, course planning, personal study records, and moderated learning resources. Express routes apply authentication, role checks, and ownership rules before accessing MongoDB records and GridFS files.

## Project Preview

<img src="documents/project-preview.webp" alt="Guidy Backend application screens and visual identity" width="520">

Companion application screens and visual identity. Branding mockups are presentation concepts.

## Key Features

- Student and contributor signup, JWT sessions, profiles, and recovery codes.
- Courses, registration, events, tasks, notebooks, and grades.
- Resource uploads, contributor submissions, administrator review, and authorized downloads.
- Workspace search, administrator user lookup, and in-app notifications with retry handling.
- File-format checks, GridFS storage, and optional ClamAV scanning.

## Live Website & Related Repository

Frontend repository: https://github.com/mayurbohraa/guidy-frontend

API deployment: https://guidy-backend.vercel.app/

The API deployment returned HTTP 500 during the availability check on 4 November 2026.

## Tech Stack

- **Server:** Node.js, Express 4, TypeScript 4.9.
- **Data:** MongoDB, Mongoose 6, GridFS.
- **Authentication and files:** Passport JWT, jsonwebtoken, bcrypt, Multer.
- **Checks:** TypeScript compiler and Node.js test runner.

## Prerequisites

Node.js, npm, and a reachable MongoDB instance. Node.js 24 is used for this documentation verification. Optional malware scanning requires a reachable ClamAV daemon.

## Installation & Setup

1. Clone and open the backend:

   ```sh
   git clone https://github.com/mayurbohraa/guidy-backend.git
   cd guidy-backend
   ```

2. Install dependencies:

   ```sh
   npm ci
   ```

3. For a fresh checkout, copy `.env.example` to `.env` and configure `DB_URL`, `PORT` (normally `4000`), and `secret_key`.
4. Generate a signing secret, then save it privately as `secret_key`:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

5. Optional variables are documented in `.env.example`: `CRON_SECRET`, `CLAMAV_HOST`, `CLAMAV_PORT`, and `REQUIRE_MALWARE_SCAN`. Keep private values out of Git.

## Running Locally

Development:

```sh
npm run dev
```

Compile, then start the compiled server:

```sh
npm run build
```

```sh
npm start
```

The listener opens after MongoDB connects. Application routes use `/api/v1`; `/` returns a liveness response.

Run build and regression tests:

```sh
npm test
```

Database workflow checks require a reachable MongoDB cluster. They create and remove a uniquely named test database:

```sh
npm run test:integration
```

Set `TEST_DB_URL` for an explicit test connection; otherwise the integration suite uses the configured connection with its own database name.

## Project Structure

```text
src/
├── app.ts            # Express application and middleware
├── index.ts          # Database connection and local listener
├── routes.ts         # API composition
├── helpers/          # Authentication, files, roles, and errors
└── modules/          # Feature routes, controllers, services, and models
scripts/              # Demo data and upload migration tools
test/                 # Regression and isolated database checks
documents/            # Public application preview
.env.example          # Configuration template
```
