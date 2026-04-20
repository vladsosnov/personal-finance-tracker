# Backend

Express + GraphQL API for the Financial Goals Tracker.

**Deployed at:** https://personal-finance-tracker-7r75.onrender.com

## Stack

- Node.js 20+, Express 5, TypeScript (strict)
- GraphQL via `graphql-http` with modular resolvers
- MongoDB via Mongoose 8
- JWT auth with HttpOnly cookies + Google OAuth
- Pino structured logging with request-ID correlation
- Nodemailer for email (SMTP or console fallback in dev)
- Stripe for billing (Checkout + webhooks)

## Getting Started

```bash
cp .env.example .env
# Fill in MONGODB_URI and JWT_SECRET (min 32 chars)
yarn install
yarn dev
```

Server starts at `http://localhost:4000`.

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Min 32 chars — `openssl rand -base64 32` |
| `FRONTEND_ORIGIN` | No | Defaults to `http://localhost:3000` |
| `PORT` | No | Defaults to `4000` |
| `NODE_ENV` | No | Set to `production` for secure cookies |
| `LOG_LEVEL` | No | Pino log level, defaults to `info` |
| `STRIPE_SECRET_KEY` | For billing | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | For billing | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | For billing | Stripe price ID for Pro plan |
| `STRIPE_LIFETIME_PRICE_ID` | For billing | Stripe price ID for Lifetime plan |
| `GOOGLE_CLIENT_ID` | For OAuth | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For OAuth | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | For OAuth | OAuth callback URL |
| `SMTP_HOST` | No | SMTP provider host |
| `SMTP_PORT` | No | SMTP port (default 587) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | Sender address |

If SMTP is not configured, the backend logs email content in development and throws in production.

## Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start dev server with hot reload (ts-node-dev) |
| `yarn build` | Compile TypeScript to `dist/` |
| `yarn start` | Run compiled output |
| `yarn test` | Run unit tests (Jest) |
| `yarn lint` | Run ESLint |
| `yarn type-check` | TypeScript type check |

## API Surface

### Auth (REST)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account (email + password) |
| POST | `/auth/login` | Login (returns JWT cookies + tokens) |
| POST | `/auth/logout` | Clear auth cookies |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/google` | Initiate Google OAuth flow |
| GET | `/auth/google/callback` | Google OAuth callback |
| GET | `/auth/verify-email?token=...` | Verify email address |
| POST | `/auth/request-verification` | Resend verification email |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/change-password` | Change password (authenticated) |
| POST | `/auth/delete-account` | Delete account + all data |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Uptime + MongoDB connection status |
| GET | `/healthcheck` | Deep check with DB ping |

### Billing

| Method | Path | Description |
|--------|------|-------------|
| POST | `/billing/webhook` | Stripe webhook handler |

### GraphQL (`POST /graphql`)

All data operations. Main query/mutation groups:

- **User:** `me`, `setPrimaryCurrency`
- **Goals:** `goals`, `goal`, `createGoal`, `editGoal`, `deleteGoal`, `reorderGoals`, `completeGoal`
- **Operations:** `updateGoalProgress`, `editGoalOperation`, `deleteGoalOperation`
- **Data:** `exportAllData`, `importGoals`, `resetAllData`
- **Billing:** `createBillingCheckout`, `createBillingPortalSession`
- **Exchange rates:** `exchangeRates`, `supportedCurrencies`
- **Proposals:** `proposals`, `createProposal`, `voteProposal`, `updateProposalStatus`, `deleteProposal`
- **Admin:** `analyticsStats`

GraphQL playground available at `GET /graphql` in non-production mode.

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| POST | `/analytics/track` | Track frontend events |

## Architecture

```text
src/
├── index.ts                    Express app setup, middleware stack, server startup
├── schema.ts                   GraphQL SDL schema + resolver composition
├── modules/
│   ├── auth/                   JWT, passwords, OAuth, routes, login attempts
│   ├── goals/                  Goal + operation repos, service, resolvers
│   ├── billing/                Stripe checkout, portal, webhook handling
│   ├── analytics/              Event tracking and admin stats
│   ├── exchange-rates/         Frankfurter API client + MongoDB cache
│   ├── proposals/              Community feedback and voting
│   └── subscriptions/          Plan enforcement logic
├── db/models/                  Mongoose schemas (User, Goal, GoalOperation, etc.)
├── utils/                      Middleware (CSRF, rate-limit, request-id, timeout, logger)
└── shared/                     Constants (currencies)
```

## Security Features

- CSP + Referrer-Policy via Helmet
- CSRF validation on state-changing requests
- Account lockout (5 failed logins → 15-min cooldown)
- JWT token versioning (invalidate all sessions on password change)
- IP-based rate limiting on all endpoints
- Query depth + size limiting on GraphQL
- 30s request timeout middleware
- PBKDF2 hashing (100K iterations, SHA-512, timing-safe comparison)

## Notes

- Rate limiting is in-memory (single process). For multi-instance deployments, replace with Redis.
- Exchange rates are cached 24h in MongoDB with stale-cache fallback on API failure.
- MongoDB connection retries with exponential backoff on startup.
