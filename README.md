# Financial Goals Tracker

A full-stack web app for tracking financial goals. Create savings goals, log deposits and withdrawals, visualize progress with charts, and manage your data with import/export.

Built for personal use and available as a hosted service.

## Live Demo

- **App:** [TBD — add your production URL here]
- **API:** [TBD — add your production API URL here]

## Features

**Goals**
- Create, edit, delete, and reorder savings goals
- Set target amount, initial amount, and color
- Track progress with increase/decrease operations (with optional notes and dates)
- Mark goals as completed when target is reached
- Dashboard overview with total stats

**Charts**
- Interactive progress charts per goal (Highcharts)
- Configurable date range (7d / 30d / 90d / 1y / all)

**Data Management**
- Export all goals and operations as JSON backup
- Import from backup file with preview and validation
- Reset all data

**Account**
- Email/password authentication with JWT (HttpOnly cookies)
- Email verification with resend support
- Password reset via email link
- Delete account
- Subscription plans UI (Free / Pro / Lifetime)

**Other**
- Light, dark, and system theme
- Fully keyboard-accessible (WCAG)
- Community feedback/proposals page with voting
- Mobile-responsive layout

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Mantine v8, Apollo Client, Highcharts |
| Backend | Node.js, Express 5, GraphQL (graphql-http), TypeScript, Mongoose |
| Database | MongoDB (Atlas) |
| Auth | JWT access + refresh tokens, HttpOnly cookies, HMAC-SHA256 |
| Email | Nodemailer (any SMTP provider) |

## Project Structure

```
frontend/          Next.js client application
  src/
    app/           Pages (App Router)
    features/      Feature modules (dashboard, profile, auth, feedback, landing)
    shared/        Shared components, constants, hooks, GraphQL queries

backend/           Express + GraphQL API server
  src/
    db/models/     Mongoose models
    modules/       Feature modules (auth, goals, proposals)
    schema.ts      GraphQL schema and resolvers
    auth.ts        JWT and password hashing utilities
    email.ts       Email sending (SMTP or dev console fallback)
```

## Local Development

**Prerequisites:** Node.js v20+, MongoDB (Atlas or local)

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and a strong JWT_SECRET

# Run (separate terminals)
cd backend && npm run dev     # API on http://localhost:4000
cd frontend && npm run dev    # App on http://localhost:3000
```

### Environment Variables

**Backend** (`backend/.env`):

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port (default: 4000) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs — use a long random string in production |
| `FRONTEND_ORIGIN` | No | Allowed CORS origin (default: http://localhost:3000) |
| `SMTP_HOST` | No | SMTP server host (e.g., smtp.gmail.com) |
| `SMTP_PORT` | No | SMTP port (default: 587) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password or app password |
| `SMTP_FROM` | No | Sender email address |

Without SMTP configured, emails are printed to the backend console (dev mode).

**Frontend** (`frontend/.env.local`, optional):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: http://localhost:4000) |

## API Overview

### REST Endpoints (Auth)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account + send verification email |
| POST | `/auth/login` | Sign in |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Clear auth cookies |
| GET | `/auth/verify-email?token=` | Verify email address |
| POST | `/auth/request-verification` | Resend verification email (authenticated) |
| POST | `/auth/forgot-password` | Request password reset link |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/delete-account` | Delete account and all data (authenticated) |
| GET | `/health` | Server status |
| GET | `/healthcheck` | Deep health check (includes DB ping) |

### GraphQL (`POST /graphql`)

Authentication via HttpOnly cookies set by the REST auth endpoints.

**Queries:** `me`, `goals`, `goal(id)`, `exportAllData`, `proposals`

**Mutations:** `createGoal`, `editGoal`, `deleteGoal`, `reorderGoals`, `completeGoal`, `updateGoalProgress`, `editGoalOperation`, `deleteGoalOperation`, `importGoals`, `resetAllData`, `createProposal`, `voteProposal`

## Deployment

### Frontend (Vercel)

1. Import the repo in Vercel, set root directory to `frontend`
2. Add environment variable: `NEXT_PUBLIC_API_URL` = your production backend URL
3. Deploy

### Backend (Railway / Render / Fly.io)

1. Create a new service, set root directory to `backend`
2. Build command: `npm run build`
3. Start command: `npm start`
4. Add environment variables: `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_ORIGIN`, SMTP vars
5. Deploy

### Production Checklist

- [ ] Use a strong, random `JWT_SECRET` (at least 64 characters)
- [ ] Set `FRONTEND_ORIGIN` to your production frontend URL
- [ ] Set `NEXT_PUBLIC_API_URL` to your production backend URL
- [ ] Configure SMTP for real email delivery (Resend, SendGrid, or Amazon SES)
- [ ] Use a dedicated MongoDB Atlas cluster (not free shared tier)
- [ ] Set up a custom domain with HTTPS
- [ ] Set up Stripe or Lemon Squeezy for subscription billing

## License

Copyright (c) 2026 Vlad Sosnov. All rights reserved. See [LICENSE](LICENSE).
