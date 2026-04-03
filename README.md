# Personal Finance Tracker

A full-stack app for tracking savings goals, logging deposits and withdrawals, and monitoring progress over time.

The repository is split into two deployable apps:

- `frontend/`: Next.js 14 application
- `backend/`: Express 5 + GraphQL API

## What It Does

- Create, edit, delete, reorder, and complete financial goals
- Record increase and decrease operations with notes and dates
- Visualize goal progress with interactive charts
- Export and import account data as JSON
- Manage account settings, password resets, and email verification
- Collect product feedback and proposal votes
- Support light, dark, and system themes

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 14, React 18, TypeScript, Mantine, Apollo Client, Highcharts |
| Backend | Node.js, Express 5, TypeScript, GraphQL (`graphql-http`), Mongoose |
| Database | MongoDB |
| Auth | JWT access + refresh cookies |
| Email | Nodemailer with SMTP or console fallback in development |

## Repository Layout

```text
.
├── frontend/   Next.js app
├── backend/    Express + GraphQL API
├── DEPLOYMENT.md
└── README.md
```

## Prerequisites

- Node.js 20+
- npm
- MongoDB instance, local or hosted

## Quick Start

1. Install dependencies:

```bash
cd frontend
yarn

cd ../backend
yarn
```

2. Configure the backend environment:

```bash
cp backend/.env.example backend/.env
```

Required backend values:

- `MONGODB_URI`
- `JWT_SECRET`

3. Start the backend:

```bash
cd backend
npm run dev
```

4. Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- GraphQL docs page in development: `http://localhost:4000/graphql`

## Environment Variables

### Backend

Use [`backend/.env.example`](backend/.env.example) as the baseline.

| Variable | Required | Notes |
| --- | --- | --- |
| `PORT` | No | Defaults to `4000` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Use a long random secret in production |
| `FRONTEND_ORIGIN` | No | Defaults to `http://localhost:3000` |
| `SMTP_HOST` | No | Optional SMTP provider |
| `SMTP_PORT` | No | Optional SMTP port |
| `SMTP_USER` | No | Optional SMTP username |
| `SMTP_PASS` | No | Optional SMTP password |
| `SMTP_FROM` | No | Optional sender address |

If SMTP is not configured, the backend falls back to logging email content in development.

### Frontend

The frontend works without a local env file when the backend runs on `http://localhost:4000`.

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | No | Override the backend URL when needed |

## Available Scripts

### Frontend

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run type-check
npm run test
npm run test:watch
npm run test:coverage
npm run generate:types
```

### Backend

```bash
npm run dev
npm run build
npm run start
npm run type-check
npm run lint
npm run test
```

Note: backend `lint` and `test` are currently placeholders in `backend/package.json`.

## API Surface

### REST auth endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/verify-email?token=...`
- `POST /auth/request-verification`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/delete-account`

### Health endpoints

- `GET /health`
- `GET /healthcheck`

### GraphQL

All application data operations are exposed through `POST /graphql`.

Main query and mutation groups include:

- user/account data
- goals and goal operations
- data export and import
- proposals and voting
- admin analytics

## Development Notes

- The backend uses HttpOnly auth cookies.
- CSRF protection is applied to state-changing auth and analytics requests through origin checks.
- In non-production mode, the backend exposes a GraphQL docs page at `GET /graphql`.
- Rate limiting for auth endpoints is in-memory and single-process. Replace it for multi-instance production deployments.

## Deployment

Deployment guidance lives in [`DEPLOYMENT.md`](DEPLOYMENT.md).

Typical setup:

- deploy `frontend/` to Vercel
- deploy `backend/` to Railway, Render, or Fly.io
- provide MongoDB and production environment variables

## Additional Docs

- [`backend/README.md`](backend/README.md)
- [`frontend/README.md`](frontend/README.md)
- [`DEPLOYMENT.md`](DEPLOYMENT.md)

## License

See [`LICENSE`](LICENSE).
