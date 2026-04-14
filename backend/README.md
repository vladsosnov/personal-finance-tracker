# Backend

Express + GraphQL API for the Personal Finance Tracker.

**Deployed at:** https://personal-finance-tracker-7r75.onrender.com

## Stack

- Node.js 20+, Express 5, TypeScript
- GraphQL via `graphql-http`
- MongoDB via Mongoose
- JWT auth with HttpOnly cookies
- Nodemailer for email (SMTP or console fallback in dev)

## Getting Started

```bash
cp .env.example .env
# Fill in MONGODB_URI and JWT_SECRET
yarn install
yarn dev
```

## Environment Variables

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Long random secret - `openssl rand -base64 32` |
| `FRONTEND_ORIGIN` | No | Defaults to `http://localhost:3000` |
| `PORT` | No | Defaults to `4000` (set automatically on Render) |
| `SMTP_HOST` | No | SMTP provider host |
| `SMTP_PORT` | No | SMTP port |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | Sender address |

## Scripts

| Command | Description |
| --- | --- |
| `yarn dev` | Start dev server with hot reload |
| `yarn build` | Compile TypeScript to `dist/` |
| `yarn start` | Run compiled output (`dist/index.js`) |
| `yarn test` | Run unit tests |
| `yarn lint` | Run ESLint |
| `yarn type-check` | TypeScript type check |

## Endpoints

### Auth (REST)

| Method | Path |
| --- | --- |
| POST | `/auth/register` |
| POST | `/auth/login` |
| POST | `/auth/logout` |
| POST | `/auth/refresh` |
| GET | `/auth/verify-email?token=...` |
| POST | `/auth/request-verification` |
| POST | `/auth/forgot-password` |
| POST | `/auth/reset-password` |
| POST | `/auth/delete-account` |

### Health

| Method | Path |
| --- | --- |
| GET | `/health` |
| GET | `/healthcheck` |

### GraphQL

| Method | Path |
| --- | --- |
| POST | `/graphql` |
| GET | `/graphql` (dev only - docs UI) |