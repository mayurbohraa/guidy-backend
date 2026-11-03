# Guidy Backend

## About the project

The Guidy API powers a university academic tracker. It handles authentication, stores academic records in MongoDB, and supports resource submission and review.

## Key features

- JWT authentication and role checks for course administration and resource moderation.
- APIs for courses, registration, events, tasks, notebooks, grades, and notifications.
- Authenticated profile viewing and contact editing; role and credentials remain protected.
- File uploads with a 10 MB limit and allowed file extensions, plus authenticated downloads that respect resource approval status.
- Ownership checks for personal task, notebook, event, and notification changes.

## GitHub repositories

- [Guidy Backend](https://github.com/mayurbohra9/guidy_backend)
- [Guidy Frontend](https://github.com/mayurbohra9/guidy_frontend)

## Tech stack

Node.js, TypeScript, Express, MongoDB, Mongoose, Passport JWT, bcrypt, and Multer.

## Prerequisites

- Node.js 24 and npm.
- A local or isolated development MongoDB instance.

## Installation and setup

1. Open a terminal in the backend repository.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and set the values below. Generate a local signing secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and save it as `secret_key` in the local environment file.
4. Run `npm run dev`. Open `http://localhost:4000/` to check the server health response. Application routes are mounted under `/api/v1`.

## Environment configuration

| Variable | Purpose |
|---|---|
| `DB_URL` | Connection string for the development MongoDB database. |
| `PORT` | API port. Defaults to `4000`, which matches the frontend development proxy. |
| `secret_key` | Random JWT signing secret of at least 32 bytes. Keep it in the local environment or hosting settings. |

Local files are stored in `uploads/`. Vercel uses temporary storage, so persistent uploads across instances and redeployments require durable storage.

Signup supports student and contributor accounts using a Qatar University email. Administrator accounts require separate provisioning. New registrations require four to six courses from one year and term. Existing registrations can be reduced by dropping courses.

## Running locally

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development API with automatic restart. |
| `npm run build` | Compile TypeScript into `dist/`. |
| `npm start` | Run the compiled API after building. |
| `npm test` | Compile and run the security regression tests. |
| `npm run seed:demo` | Add missing showcase records to the configured database without replacing existing records. |

## Project structure

```text
Backend/
â”œâ”€â”€ documents/                   ER diagram
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ helpers/                 Authentication, uploads, and error handling
â”‚   â”œâ”€â”€ modules/                 Routes, controllers, services, and models
â”‚   â”œâ”€â”€ index.ts                 Server entry point
â”‚   â””â”€â”€ routes.ts                Versioned API router
â”œâ”€â”€ test/                        Security regression tests
â”œâ”€â”€ .env.example
â”œâ”€â”€ .gitignore
â”œâ”€â”€ Guidy.postman_collection.json
â”œâ”€â”€ package.json
â”œâ”€â”€ tsconfig.json
â””â”€â”€ README.md
```

## Demo data

Run `npm run seed:demo` from this folder with `DB_URL` pointing to the intended showcase database. The three existing Guidy demo accounts (student, contributor, administrator) must already exist; the script does not create accounts or change passwords.

The seed includes 32 fictional courses across four years and two terms, a four-course student registration, sample assessment scores, eight notebooks, 14 resources (eight accepted, four pending, two denied), and five tasks, six events, and three notifications per role. Existing registration and grade records are preserved. Stable record IDs make reruns insert-only; reviewed resources and completed tasks are not reset. Event dates are relative to the first run.

The 14 fictional text documents in `scripts/demo-resources/` are bundled with the backend. Authenticated demo downloads can use them if temporary uploads are missing; regular uploaded documents still require durable storage on serverless hosting. Keep this folder in the deployment package.
