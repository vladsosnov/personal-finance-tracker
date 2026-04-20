# Frontend

Next.js app for the Financial Goals Tracker.

**Deployed at:** [financial-goals-tracker.vercel.app](https://financial-goals-tracker.vercel.app)

## Stack

- Next.js 14 (App Router, static export)
- React 18, TypeScript (strict)
- Mantine 8 (UI components and hooks)
- Apollo Client 4 (GraphQL, cache, error handling)
- Highcharts (goal progress charts with trend lines)
- Zustand (toast notifications)
- Jest 30 + Testing Library (825 unit tests)
- Cypress 15 (E2E tests)

## Getting Started

```bash
yarn install
yarn dev
```

Dev server starts at `http://localhost:3000`. Expects the backend at `http://localhost:4000`.

## Environment Variables

Works without a `.env` file when the backend runs on `localhost:4000`.

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_API_URL` | No | Override the backend URL |
| `NEXT_PUBLIC_GRAPHQL_URL` | No | Override the GraphQL endpoint |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `NEXT_PUBLIC_BASE_PATH` | No | Base path for subpath deployments |
| `NEXT_PUBLIC_SITE_URL` | No | Site URL for metadata |

## Scripts

| Command | Description |
|---------|-------------|
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

## Architecture

```text
src/
├── app/                        Next.js App Router pages
│   ├── layout.tsx              Root layout (providers, header, footer)
│   ├── goals/                  Main dashboard page
│   ├── auth/                   Login, register, verify-email, reset-password
│   ├── profile/                User settings, billing, theme, data management
│   ├── feedback/               Community proposals
│   └── admin/                  Admin analytics (role-gated)
├── features/                   Feature modules
│   ├── dashboard/              Goals tracking (hooks, components, modals, chart)
│   ├── auth/                   Auth forms, email verification
│   ├── profile/                Profile cards, import/export, currency settings
│   ├── landing/                Marketing landing page
│   └── expenses/               Expenses placeholder (paid-only, coming soon)
└── shared/                     Cross-feature code
    ├── components/             Header, footer, providers, auth-guard, modals
    ├── hooks/                  PWA install hook
    ├── lib/                    Apollo client, token storage, analytics, toast, confetti
    ├── constants/              Routes, currencies, plans, colors
    ├── utils/                  Date, number, color formatters
    └── gql/                    Shared queries + generated schema types
```

## Testing

### Unit Tests

825 tests with coverage thresholds enforced:
- Statements: 85%
- Branches: 77%
- Functions: 80%
- Lines: 90%

```bash
yarn test              # run all tests
yarn test:coverage     # run with coverage report
```

Custom `render` and `renderHook` wrappers in `src/__tests__/test-utils.tsx` provide Apollo MockedProvider and MantineProvider automatically.

### E2E Tests

Cypress tests cover auth flows, dashboard CRUD, billing, and data management.

```bash
yarn cypress           # open interactive runner
yarn cypress:run       # headless (Chrome)
```

## Key Features

- **Responsive** — mobile-first with drawer navigation, fluid typography
- **PWA** — installable with service worker, iOS Safari detection
- **Dark mode** — system/light/dark with Mantine color scheme
- **Animations** — scroll-triggered reveals, staggered entrances, page transitions (respects `prefers-reduced-motion`)
- **Accessibility** — skip-to-content, aria labels, keyboard navigation, semantic HTML
- **Lazy loading** — dynamic imports for chart, modals (reduces initial bundle)
- **Multi-currency** — 20+ currencies with live exchange rate display
- **Onboarding** — guided first-time experience with example goal creation

## Subscription Model

| Plan | Limits |
|------|--------|
| Free | Up to 3 goals, operations log, themes, import/export |
| Pro | Unlimited goals, future paid features |
| Lifetime | Everything in Pro, permanent access |
