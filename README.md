# personal-finance-tracker

Personal Finance Tracker is a full-stack app for tracking financial goals - create goals, log progress over time, visualize trends, and manage your data.

## Project Demo

Live links:

- Frontend: [TBD later](https://YOUR_FRONTEND_URL)
- Backend API: [TBD later](https://YOUR_BACKEND_URL)
- GraphQL docs (GraphiQL): [TBD later](https://YOUR_BACKEND_URL/graphql)

## What Is Implemented

- Cookie-based JWT authentication with access/refresh token rotation
- REST auth endpoints: `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- User-scoped goals — each user sees only their own data
- Goal cards with target amount, initial amount, current amount, and progress
- Goal operations (increase/decrease) with optional notes and custom dates
- Drag-to-reorder goals
- Goal color picker (hex)
- Mark goal as completed when target is reached
- Dashboard overview stats
- Interactive progress charts (Highcharts)
- Export all goals and operations as a `.txt` JSON backup
- Import progress from a `.txt` backup file with a preview step
- Reset all data
- Theme switcher: light, dark, system
- Subscription plan UI (Free / Pro / Lifetime)
- GraphQL API with `graphql-http`, documented via GraphiQL
- Shared GraphQL schema types generated for frontend usage
- Rate limiting on auth and GraphQL endpoints
- Health endpoints: `GET /health`, `GET /healthcheck`

## Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Apollo Client, Mantine, Highcharts, Jest
- **Backend:** Node.js, Express 5, GraphQL (`graphql-http`), TypeScript, MongoDB (Mongoose), JWT, Jest

## Repository Structure

```
frontend/   Next.js client application
backend/    Express + GraphQL API server
```

## Local Setup

**Prerequisites:**

- Node.js `v20+` (see `.nvmrc`)
- MongoDB Atlas URI or a local MongoDB instance

**Install dependencies:**

```bash
cd frontend && yarn
cd ../backend && yarn
```

**Environment variables:**

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/finance-goals
JWT_SECRET=your-secret-here
```

**Optional — override the default backend URL for the frontend:**

```bash
echo "NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql" > frontend/.env.local
```

**Run locally (separate terminals):**

```bash
cd backend && yarn dev
```

```bash
cd frontend && yarn dev
```

**Local URLs:**

- Frontend: `http://localhost:3000`
- GraphQL API: `http://localhost:4000/graphql`
- GraphQL docs (GraphiQL): `http://localhost:4000/graphql`
- Health: `http://localhost:4000/health`

## GraphQL API Overview

All GraphQL operations are sent to `POST /graphql`. Authentication is handled via HTTP-only cookies set by the REST auth endpoints.

**Queries:**

| Query | Description |
|---|---|
| `me` | Current user info |
| `goals` | List all goals for the authenticated user |
| `goal(id)` | Get a single goal by ID |
| `exportAllData` | Export all goals and operations as a JSON string |

**Mutations:**

| Mutation | Description |
|---|---|
| `createGoal` | Create a new goal |
| `editGoal` | Edit goal title, target, initial amount, or color |
| `updateGoalColor` | Update only the goal color |
| `deleteGoal` | Delete a goal and all its operations |
| `reorderGoals` | Reorder goals by providing an ordered list of IDs |
| `completeGoal` | Mark a goal as completed (only when current >= target) |
| `updateGoalProgress` | Add an operation (increase or decrease) to a goal |
| `editGoalOperation` | Edit an existing operation |
| `deleteGoalOperation` | Delete an operation |
| `importGoals` | Bulk-import goals with operations |
| `resetAllData` | Delete all goals and operations for the current user |

## Deployment

- TBD later as status is "in development"
