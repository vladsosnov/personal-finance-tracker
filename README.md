# personal-finance-tracker

Personal Finance Tracker is a full-stack app for tracking financial goals.  

## Project Demo

Live links:

- Frontend: [TBD later](https://YOUR_FRONTEND_URL)
- Backend API: [TBD later](https://YOUR_BACKEND_URL)
- GraphQL docs (GraphiQL): [TBD later](https://YOUR_BACKEND_URL/graphql)

## What Is Implemented

- JWT authentication (register/login)
- User-scoped goals (each user sees only their own data)
- Goal cards with target/current/progress
- GraphQL API documentation via GraphiQL
- Shared GraphQL schema types generated for frontend usage
- TBD later as status is "in development"

## Stack

- Frontend: Next.js 14 (App Router), React 18, TypeScript, Apollo Client, Mantine, Highcharts, Jest
- Backend: Node.js, Express 5, GraphQL (`graphql-http`), TypeScript, MongoDB (Mongoose), JWT, Jest
- DevOps: TBD later as status is "in development"

## Repository Structure

- `frontend/` Next.js client application
- `backend/` API server (GraphQL + healthcheck)
- `.github/workflows/` CI and deploy pipelines

## Local Setup

Prerequisites:

- Node.js `v20+` (see `.nvmrc`)
- MongoDB Atlas URI (or local MongoDB)

Install dependencies:

```bash
cd frontend && yarn
cd ../backend && yarn
```

Environment variables:

```bash
cp backend/.env.example backend/.env
```

Optional frontend env (if backend is not on default `http://localhost:4000`):

```bash
echo "NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql" > frontend/.env.local
```

Run locally (separate terminals):

```bash
cd backend && yarn dev
```

```bash
cd frontend && yarn dev
```

Local URLs:

- Frontend: `http://localhost:3000`
- GraphQL API: `http://localhost:4000/graphql`
- GraphQL docs (GraphiQL): `http://localhost:4000/graphql`

## Deployment

- TBD later as status is "in development"
