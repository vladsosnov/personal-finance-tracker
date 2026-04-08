# Frontend

Next.js app for the Personal Finance Tracker.

**Deployed at:** [personal-finance-tracker-xyz.vercel.app](https://personal-finance-tracker-xyz.vercel.app/)

## Stack

- Next.js 14 (App Router, static export)
- React 18, TypeScript
- Mantine 8 (UI components and hooks)
- Apollo Client 4 (GraphQL)
- Highcharts (goal progress charts)
- Zustand (lightweight client state)
- Jest + Testing Library (unit tests)
- Cypress (E2E tests)

## Getting Started

```bash
yarn install
yarn dev
```

The dev server starts at `http://localhost:3000` and expects the backend at `http://localhost:4000`.

## Scripts

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

## Testing

Unit tests use Jest with Testing Library. The custom `render` and `renderHook` wrappers in `src/__tests__/test-utils.tsx` provide Apollo MockedProvider and MantineProvider automatically.

```bash
yarn test              # run all tests
yarn test:coverage     # run with coverage report
```

E2E tests use Cypress against a running dev server.

```bash
yarn cypress           # open interactive runner
yarn cypress:run       # headless run
```

## License

See [`LICENSE`](LICENSE).
