# Paddle Billing Design

## Goal

Ship a working worldwide billing flow for three plans:

- Free: default plan
- Pro: $3/month recurring
- Lifetime: $9 one-time

Pro and Lifetime unlock the same premium capabilities. Lifetime is the highest entitlement and permanently supersedes Pro.

## Current State

The app already has:

- plan metadata in `frontend/src/shared/constants/plans.ts`
- landing and profile pricing UI in `frontend/src/features/landing/components/PlansSection.tsx` and `frontend/src/features/profile/components/SubscriptionCard.tsx`
- backend goal limits enforced from the user's `subscription` string in `backend/src/schema.ts` and `backend/src/utils/validation.ts`

The app does not yet have:

- a payment provider integration
- a source-of-truth billing model
- checkout or billing portal actions
- webhook-driven entitlement sync

## Provider Choice

Use Paddle.

Why:

- supports worldwide sales with merchant-of-record handling
- supports recurring and one-time products in one system
- reduces tax/compliance work compared with assembling the same stack manually
- fits the app's current size and avoids overbuilding billing abstractions

## Product Model

Billing catalog in Paddle:

- `pro-monthly`: recurring monthly price of $3
- `lifetime`: one-time price of $9

Local app entitlement model:

- `free`
- `pro`
- `lifetime`

Rules:

- new users default to `free`
- `pro` and `lifetime` both unlock premium features
- `lifetime` wins if both recurring and one-time purchase history exist
- canceled Pro stays premium until the paid-through period ends
- admin users continue to resolve to lifetime-level access for app gating

## Data Model

Replace the app's loose display-only subscription handling with normalized billing fields on the user record:

- `plan`: `free | pro | lifetime`
- `billingStatus`: `inactive | active | canceled | past_due`
- `billingProvider`: `paddle | null`
- `paddleCustomerId`
- `paddleSubscriptionId`
- `paddleTransactionId`
- `subscriptionRenewsAt`
- `subscriptionCanceledAt`
- `lifetimeUnlockedAt`

The API may continue returning a user-facing `subscription` label, but the server should derive that from normalized fields instead of trusting arbitrary strings.

## Backend Design

Create a dedicated billing module in the backend.

Responsibilities:

- build Paddle checkout links for the requested plan
- create a Paddle customer using the current user email when needed
- return a customer portal / payment-management link for active Pro users
- validate and process Paddle webhooks
- map webhook events into local entitlement updates

Add an authenticated GraphQL mutation for checkout creation:

- `createBillingCheckout(plan: BillingPlan!): BillingCheckoutPayload!`

Add an authenticated GraphQL mutation for billing management:

- `createBillingPortalSession: BillingPortalPayload!`

Add a REST webhook route because Paddle webhook signature validation is simpler at the raw HTTP layer than through GraphQL:

- `POST /billing/paddle/webhook`

Webhook processing rules:

- Pro purchase activates `plan=pro`, stores subscription/customer ids, sets status active
- Pro renewal refreshes status and renewal date
- Pro cancel schedules downgrade only when the subscription actually ends
- Pro expiration downgrades to free unless lifetime is already unlocked
- Lifetime purchase sets `plan=lifetime`, stores transaction id, sets `lifetimeUnlockedAt`, and clears downgrade risk from recurring status checks

## Frontend Design

Landing page:

- replace disabled paid CTAs with active actions
- logged-out users go to auth with a return target for the chosen plan
- logged-in users launch checkout directly

Profile page:

- show current plan from normalized user data
- show upgrade buttons for Free users
- show `Manage billing` for active Pro users
- show `Get Lifetime` upsell for Free and Pro users
- show clear success/cancel feedback after checkout

Limit prompts:

- wherever Free users hit plan restrictions, show a direct upgrade CTA instead of static copy
- the first required upgrade surface is the dashboard goal-limit message
- import-limit messaging in profile should also surface an upgrade action

## Navigation Flow

1. User clicks `Start Pro` or `Get Lifetime`.
2. If logged out, app routes to auth with `next=/billing/checkout?plan=...`.
3. After auth, frontend resumes the plan intent and calls `createBillingCheckout`.
4. Backend returns a Paddle checkout URL.
5. Frontend redirects the browser to Paddle checkout.
6. Paddle redirects back to the app success URL.
7. Frontend refetches `me`.
8. Webhook-confirmed entitlement is rendered in profile, header, and feature gates.

Portal flow:

1. Pro user clicks `Manage billing`.
2. Frontend calls `createBillingPortalSession`.
3. Backend returns a Paddle customer portal URL.
4. Frontend opens the URL in the same tab.

## Error Handling

Expected cases:

- unauthenticated checkout request returns `Unauthorized`
- unsupported plan returns a validation error
- webhook duplicate delivery is ignored idempotently
- portal action for Free or Lifetime returns a user-facing validation error
- checkout success page shows pending-sync copy if redirect lands before webhook processing completes

Operational requirements:

- log webhook event ids and plan transitions
- preserve raw provider ids for support/debugging
- never downgrade a user with `lifetimeUnlockedAt`

## Testing

Backend:

- validation and entitlement-resolution unit tests
- webhook event mapping tests
- checkout mutation auth and plan tests

Frontend:

- plan CTA tests for landing and profile
- billing action hook tests
- dashboard limit CTA test

E2E:

- free user starts Pro checkout
- post-checkout success refreshes account state
- active Pro user opens billing management
- lifetime purchase upgrades and persists premium access

## Environment Variables

Backend:

- `PADDLE_API_KEY`
- `PADDLE_WEBHOOK_SECRET`
- `PADDLE_ENVIRONMENT`
- `PADDLE_PRO_PRICE_ID`
- `PADDLE_LIFETIME_PRICE_ID`
- `PADDLE_DEFAULT_RETURN_URL`

Frontend:

- `NEXT_PUBLIC_APP_URL` if not already present or derivable for return URLs

## Scope Boundaries

Included:

- Paddle checkout
- webhook sync
- profile and landing upgrade actions
- dashboard/profile upgrade prompts
- normalized entitlement model

Not included:

- coupon support
- seat-based billing
- annual plans
- invoice history UI
- provider abstraction beyond what is needed to keep code organized
