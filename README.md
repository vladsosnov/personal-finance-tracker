# Personal Finance Tracker

A full-stack app for tracking savings goals, logging deposits and withdrawals, and monitoring progress over time.

**Live demo:** [personal-finance-tracker-xyz.vercel.app](https://personal-finance-tracker-xyz.vercel.app/)

## What It Does

- Create, edit, delete, reorder, and complete financial goals
- Record increase and decrease operations with notes and dates
- Visualize goal progress with interactive charts
- Offer paid plans for unlimited goals and paid-only features
- Show the Expenses area only to paid users (`Pro` and `Lifetime`)
- Export and import account data as JSON
- Manage account settings, password resets, and email verification
- Collect product feedback and proposal votes
- Support light, dark, and system themes

## Plans

| Plan | Price | Includes |
| --- | --- | --- |
| `Free` | `$0` | Up to 3 goals, operations log, theme settings |
| `Pro` | `$5/mo` | Unlimited goals, Expenses access, future paid features |
| `Lifetime` | `$12 once` | Everything in Pro, permanent access |

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 14, React 18, TypeScript, Mantine 8, Apollo Client, Highcharts, Zustand |
| Backend | Node.js 20+, Express 5, TypeScript, GraphQL (`graphql-http`), Mongoose |
| Database | MongoDB |
| Auth | JWT access + refresh HttpOnly cookies |
| Email | Nodemailer (SMTP or console fallback in dev) |
| Backend hosting | Render |
| CI/CD | GitHub Actions, Vercel |

## Repository Layout

```text
.
├── frontend/       Next.js app (deployed to Vercel)
├── backend/        Express + GraphQL API
├── .github/        CI/CD workflows
└── README.md
```

## Prerequisites

- Node.js 20+
- Yarn
- MongoDB instance (local or hosted)

## Quick Start

1. Install dependencies:

```bash
cd frontend && yarn
cd ../backend && yarn
```

2. Configure the backend environment:

```bash
cp backend/.env.example backend/.env
```

Required backend values: `MONGODB_URI`, `JWT_SECRET`

3. Start the backend:

```bash
cd backend
yarn dev
```

4. Start the frontend in a second terminal:

```bash
cd frontend
yarn dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- GraphQL docs (dev only): `http://localhost:4000/graphql`

## Environment Variables

### Backend

See [`backend/.env.example`](backend/.env.example) for the full list.

| Variable | Required | Notes |
| --- | --- | --- |
| `PORT` | No | Defaults to `4000` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Long random secret for production |
| `FRONTEND_ORIGIN` | No | Defaults to `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | Yes for billing | Stripe secret API key for Checkout and Billing Portal |
| `STRIPE_WEBHOOK_SECRET` | Yes for billing | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | Yes for billing | Stripe price ID for the Pro subscription |
| `STRIPE_LIFETIME_PRICE_ID` | Yes for billing | Stripe price ID for the Lifetime one-time purchase |
| `STRIPE_SUCCESS_RETURN_URL` | No | Defaults to `FRONTEND_ORIGIN`; used as the success return base URL |
| `STRIPE_CANCEL_RETURN_URL` | No | Defaults to `FRONTEND_ORIGIN`; used as the cancel return base URL |
| `SMTP_HOST` | No | SMTP provider host |
| `SMTP_PORT` | No | SMTP port |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | Sender address |

If SMTP is not configured, the backend logs email content in development.

### Frontend

Works without a local env file when the backend runs on `http://localhost:4000`.

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | No | Override the backend URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Google OAuth client ID |

## Available Scripts

### Frontend (`frontend/`)

| Command | Description |
| --- | --- |
| `yarn dev` | Start dev server |
| `yarn build` | Production build (static export) |
| `yarn start` | Serve the static build locally |
| `yarn lint` | Run ESLint |
| `yarn type-check` | Run TypeScript type checker |
| `yarn test` | Run unit tests (Jest) |
| `yarn test:watch` | Run tests in watch mode |
| `yarn test:coverage` | Run tests with coverage report |
| `yarn cypress` | Open Cypress E2E runner |
| `yarn cypress:run` | Run Cypress E2E headless |

### Backend (`backend/`)

| Command | Description |
| --- | --- |
| `yarn dev` | Start dev server with hot reload |
| `yarn build` | Compile TypeScript |
| `yarn start` | Run compiled output |
| `yarn lint` | Run ESLint |
| `yarn type-check` | Run TypeScript type checker |
| `yarn test` | Run unit tests (Jest) |

## API Surface

### REST Auth Endpoints

| Method | Endpoint |
| --- | --- |
| POST | `/auth/register` |
| POST | `/auth/login` |
| POST | `/auth/refresh` |
| POST | `/auth/logout` |
| GET | `/auth/verify-email?token=...` |
| POST | `/auth/request-verification` |
| POST | `/auth/forgot-password` |
| POST | `/auth/reset-password` |
| POST | `/auth/delete-account` |

### Health

- `GET /health`
- `GET /healthcheck`

### GraphQL

All application data operations go through `POST /graphql`. Main query/mutation groups:

- User and account data
- Goals and goal operations
- Data export and import
- Proposals and voting
- Admin analytics

## CI/CD

The GitHub Actions pipeline runs on every push and PR to `main`:

1. **Backend** -- type check, lint, unit tests
2. **Frontend** -- type check, lint, unit tests, build
3. **E2E** -- Cypress tests (non-blocking)
4. **Deploy** -- Vercel deployment (on push to `main`)

The backend is deployed to Render at `https://personal-finance-tracker-7r75.onrender.com`.

## Development Notes

- Auth uses HttpOnly cookies with CSRF origin checks
- The backend exposes a GraphQL docs page at `/graphql` in non-production mode
- Rate limiting for auth endpoints is in-memory; replace for multi-instance deployments
- The frontend is deployed to Vercel at `https://personal-finance-tracker-xyz.vercel.app`

## Additional Docs

- [`backend/README.md`](backend/README.md) -- backend architecture and API details
- [`frontend/README.md`](frontend/README.md) -- frontend architecture and component structure

## License

See [`LICENSE`](LICENSE).
