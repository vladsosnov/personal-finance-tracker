# Contributing

Thanks for your interest in improving Personal Finance Tracker.

## Before You Start

- Read the root `README.md` for project setup, environment variables, and available scripts.
- The frontend lives in `frontend/`.
- The backend lives in `backend/`.
- Keep changes focused. If a change spans multiple concerns, explain the scope clearly in your pull request.

## Local Setup

Use the setup steps and environment guidance in `README.md`.

Typical workflow:

```bash
cd backend && yarn
cd ../frontend && yarn
```

Run the app locally in separate terminals, one for each package:

```bash
cd backend
yarn dev
```

In a second terminal:

```bash
cd frontend
yarn dev
```

## Development Expectations

- Prefer small, reviewable pull requests.
- Update documentation when behavior, setup, or user-facing flows change.
- Avoid unrelated refactors in the same pull request.
- If you change API contracts or shared behavior, note the frontend and backend impact in the pull request.

## Testing

Run the relevant checks for the area you changed before opening a pull request.

Backend:

```bash
cd backend
yarn type-check
yarn lint
yarn test
```

Frontend:

```bash
cd frontend
yarn type-check
yarn lint
yarn test
yarn build
```

If your change affects end-to-end behavior, also run:

```bash
cd frontend
yarn cypress:run
```

## Pull Requests

Please include:

- a short summary of the change
- the problem it solves
- testing you performed
- screenshots for UI changes when helpful
- any environment, migration, or deployment notes

Link related issues when applicable.

## Reporting Security Issues

Do not open public issues for security vulnerabilities. Follow `SECURITY.md` instead.
