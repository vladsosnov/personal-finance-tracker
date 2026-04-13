# Paddle Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add worldwide Paddle billing so users can buy Pro or Lifetime, have entitlements synced by webhook, and see upgrade/manage actions throughout the app.

**Architecture:** The backend becomes the billing source of truth. It creates Paddle checkout and portal links, stores normalized billing fields on the user model, and updates entitlements from webhook events. The frontend calls billing mutations, redirects users through checkout, and refreshes account state to expose premium features.

**Tech Stack:** Node 20, Express, GraphQL, Mongoose, Next.js 14, Apollo Client, Mantine, Jest, Cypress, Paddle Billing HTTP API

---

### Task 1: Normalize Billing State In Backend Models

**Files:**
- Modify: `backend/src/db/models/user.model.ts`
- Modify: `backend/src/modules/auth/types.ts`
- Modify: `backend/src/modules/auth/user.repository.ts`
- Modify: `backend/src/utils/validation.ts`
- Test: `backend/src/utils/__tests__/validation.test.ts`

- [ ] **Step 1: Write the failing entitlement tests**

```ts
describe("getEffectivePlan", () => {
  it("returns free when user is missing", () => {
    expect(getEffectivePlan(undefined)).toBe("free");
  });

  it("returns lifetime for admins", () => {
    expect(getEffectivePlan({ role: "admin", plan: "free" })).toBe("lifetime");
  });

  it("returns lifetime when unlocked", () => {
    expect(getEffectivePlan({ role: "user", plan: "lifetime" })).toBe("lifetime");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && yarn test backend/src/utils/__tests__/validation.test.ts --runInBand`
Expected: FAIL with missing `getEffectivePlan` or outdated assertions for string subscriptions

- [ ] **Step 3: Add normalized billing types and storage**

```ts
export type BillingPlan = "free" | "pro" | "lifetime";
export type BillingStatus = "inactive" | "active" | "canceled" | "past_due";

export type UserDocument = {
  email: string;
  plan: BillingPlan;
  billingStatus: BillingStatus;
  billingProvider?: "paddle";
  paddleCustomerId?: string;
  paddleSubscriptionId?: string;
  paddleTransactionId?: string;
  subscriptionRenewsAt?: Date;
  subscriptionCanceledAt?: Date;
  lifetimeUnlockedAt?: Date;
  // existing fields...
};
```

- [ ] **Step 4: Update repositories and validation helpers**

```ts
export const getEffectivePlan = (user: { role: string; plan: BillingPlan } | null | undefined): BillingPlan => {
  if (!user) return "free";
  return user.role === "admin" ? "lifetime" : user.plan;
};

export const getSubscriptionLabel = (plan: BillingPlan) => {
  if (plan === "pro") return "Pro";
  if (plan === "lifetime") return "Lifetime";
  return "Free";
};
```

- [ ] **Step 5: Run tests to verify the model layer passes**

Run: `cd backend && yarn test backend/src/utils/__tests__/validation.test.ts --runInBand`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/db/models/user.model.ts backend/src/modules/auth/types.ts backend/src/modules/auth/user.repository.ts backend/src/utils/validation.ts backend/src/utils/__tests__/validation.test.ts
git commit -m "refactor: normalize billing state"
```

### Task 2: Add Paddle Billing Service And Webhook Processing

**Files:**
- Create: `backend/src/modules/billing/paddle.client.ts`
- Create: `backend/src/modules/billing/billing.service.ts`
- Create: `backend/src/modules/billing/billing.routes.ts`
- Create: `backend/src/modules/billing/__tests__/billing.service.test.ts`
- Modify: `backend/src/modules/auth/user.repository.ts`
- Modify: `backend/src/index.ts`
- Test: `backend/src/modules/billing/__tests__/billing.service.test.ts`

- [ ] **Step 1: Write failing billing service tests**

```ts
it("maps a completed lifetime transaction to lifetime entitlement", async () => {
  const result = applyBillingEvent(existingUser, lifetimeCompletedEvent);
  expect(result.plan).toBe("lifetime");
  expect(result.billingStatus).toBe("active");
});

it("does not downgrade a lifetime user when a pro subscription expires", async () => {
  const result = applyBillingEvent(lifetimeUser, proExpiredEvent);
  expect(result.plan).toBe("lifetime");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && yarn test src/modules/billing/__tests__/billing.service.test.ts --runInBand`
Expected: FAIL because billing service files do not exist

- [ ] **Step 3: Add a minimal Paddle HTTP client**

```ts
export const createTransactionCheckout = async (payload: PaddleTransactionPayload) => {
  const response = await fetch(`${PADDLE_API_BASE}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create Paddle checkout");
  return response.json();
};
```

- [ ] **Step 4: Implement entitlement mapping and webhook idempotency**

```ts
export const applyBillingEvent = (user: User, event: PaddleWebhookEvent): BillingUpdate => {
  if (event.eventType === "transaction.completed" && event.plan === "lifetime") {
    return { plan: "lifetime", billingStatus: "active", lifetimeUnlockedAt: new Date(event.occurredAt) };
  }

  if (event.eventType === "subscription.activated") {
    return { plan: user.plan === "lifetime" ? "lifetime" : "pro", billingStatus: "active" };
  }

  if (event.eventType === "subscription.expired") {
    return user.plan === "lifetime"
      ? { plan: "lifetime", billingStatus: "active" }
      : { plan: "free", billingStatus: "inactive" };
  }

  return { plan: user.plan, billingStatus: user.billingStatus };
};
```

- [ ] **Step 5: Register the webhook route in the server**

```ts
app.use("/billing", createBillingRouter({
  paddleWebhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? "",
}));
```

- [ ] **Step 6: Run backend billing tests**

Run: `cd backend && yarn test src/modules/billing/__tests__/billing.service.test.ts --runInBand`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/billing backend/src/modules/auth/user.repository.ts backend/src/index.ts
git commit -m "feat: add paddle billing service"
```

### Task 3: Expose Billing GraphQL API And Enforce Premium Entitlements

**Files:**
- Modify: `backend/src/schema.ts`
- Modify: `backend/src/modules/auth/user.repository.ts`
- Modify: `backend/src/utils/validation.ts`
- Create: `backend/src/modules/billing/types.ts`
- Test: `backend/src/__tests__/auth.test.ts`
- Test: `backend/src/modules/goals/__tests__/goal.service.test.ts`

- [ ] **Step 1: Write failing API tests**

```ts
it("returns a checkout url for an authenticated pro upgrade", async () => {
  expect(response.body.data.createBillingCheckout.url).toContain("paddle");
});

it("keeps free users limited to three goals", async () => {
  expect(errorMessage).toContain("Upgrade to create more");
});
```

- [ ] **Step 2: Run targeted tests**

Run: `cd backend && yarn test src/__tests__/auth.test.ts src/modules/goals/__tests__/goal.service.test.ts --runInBand`
Expected: FAIL because billing mutations are missing

- [ ] **Step 3: Add billing schema types and mutations**

```graphql
enum BillingPlan {
  FREE
  PRO
  LIFETIME
}

type BillingCheckoutPayload {
  url: String!
}

type BillingPortalPayload {
  url: String!
}

extend type Mutation {
  createBillingCheckout(plan: BillingPlan!): BillingCheckoutPayload!
  createBillingPortalSession: BillingPortalPayload!
}
```

- [ ] **Step 4: Resolve checkout and portal actions through the billing service**

```ts
createBillingCheckout: async ({ plan }: { plan: "PRO" | "LIFETIME" }, context: Context) => {
  const userId = ensureAuthed(context);
  return createCheckoutForUser(userId, plan);
},
createBillingPortalSession: async (_args: unknown, context: Context) => {
  const userId = ensureAuthed(context);
  return createPortalForUser(userId);
},
```

- [ ] **Step 5: Keep display subscription derived from normalized plan**

```ts
export const toSafeUser = (user: SafeUserSource) => ({
  id: user.id,
  email: user.email,
  subscription: getSubscriptionLabel(getEffectivePlan(user)),
  role: user.role,
  primaryCurrency: user.primaryCurrency,
  emailVerified: user.emailVerified,
});
```

- [ ] **Step 6: Run backend tests**

Run: `cd backend && yarn test src/__tests__/auth.test.ts src/modules/goals/__tests__/goal.service.test.ts --runInBand`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/schema.ts backend/src/modules/billing/types.ts backend/src/modules/auth/user.repository.ts backend/src/utils/validation.ts backend/src/__tests__/auth.test.ts backend/src/modules/goals/__tests__/goal.service.test.ts
git commit -m "feat: expose billing graphql api"
```

### Task 4: Add Frontend Billing Queries, Hook, And Redirect Flow

**Files:**
- Create: `frontend/src/features/profile/gql/billing.ts`
- Create: `frontend/src/features/profile/hooks/useBilling.ts`
- Create: `frontend/src/app/billing/checkout/page.tsx`
- Create: `frontend/src/app/billing/success/page.tsx`
- Modify: `frontend/src/shared/constants/routes.ts`
- Modify: `frontend/src/shared/gql/queries.ts`
- Test: `frontend/src/features/profile/hooks/__tests__/useBilling.test.tsx`

- [ ] **Step 1: Write failing billing hook tests**

```tsx
it("redirects unauthenticated users to auth with a plan in the next url", async () => {
  await result.current.startCheckout("pro");
  expect(mockPush).toHaveBeenCalledWith("/auth?next=%2Fbilling%2Fcheckout%3Fplan%3Dpro");
});

it("opens checkout url returned by the API", async () => {
  await result.current.startCheckout("lifetime");
  expect(window.location.assign).toHaveBeenCalledWith("https://pay.paddle.test/checkout");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && yarn test src/features/profile/hooks/__tests__/useBilling.test.tsx --runInBand`
Expected: FAIL because billing hook does not exist

- [ ] **Step 3: Add the billing GraphQL operations**

```ts
export const CREATE_BILLING_CHECKOUT = gql`
  mutation CreateBillingCheckout($plan: BillingPlan!) {
    createBillingCheckout(plan: $plan) {
      url
    }
  }
`;
```

- [ ] **Step 4: Implement the billing hook**

```ts
export const useBilling = (me: MeUser | null) => {
  const router = useRouter();
  const [createCheckout] = useMutation(CREATE_BILLING_CHECKOUT);

  const startCheckout = async (plan: "pro" | "lifetime") => {
    if (!me) {
      router.push(`/auth?next=${encodeURIComponent(`/billing/checkout?plan=${plan}`)}`);
      return;
    }

    const result = await createCheckout({ variables: { plan: plan.toUpperCase() } });
    window.location.assign(result.data.createBillingCheckout.url);
  };

  return { startCheckout };
};
```

- [ ] **Step 5: Add checkout and success pages**

```tsx
export default function BillingSuccessPage() {
  return <BillingSuccessClient />;
}
```

- [ ] **Step 6: Run frontend billing hook tests**

Run: `cd frontend && yarn test src/features/profile/hooks/__tests__/useBilling.test.tsx --runInBand`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/profile/gql/billing.ts frontend/src/features/profile/hooks/useBilling.ts frontend/src/app/billing frontend/src/shared/constants/routes.ts frontend/src/shared/gql/queries.ts frontend/src/features/profile/hooks/__tests__/useBilling.test.tsx
git commit -m "feat: add frontend billing flow"
```

### Task 5: Replace Static Plan Cards With Real Upgrade And Billing Actions

**Files:**
- Modify: `frontend/src/features/landing/components/PlansSection.tsx`
- Modify: `frontend/src/features/profile/components/SubscriptionCard.tsx`
- Modify: `frontend/src/features/profile/components/profile-client.tsx`
- Modify: `frontend/src/features/profile/hooks/useDataManagement.ts`
- Modify: `frontend/src/features/landing/constants/landingData.ts`
- Test: `frontend/src/features/landing/components/__tests__/PlansSection.test.tsx`
- Test: `frontend/src/features/profile/components/__tests__/SubscriptionCard.test.tsx`

- [ ] **Step 1: Write failing component tests**

```tsx
it("renders Start Pro and Get Lifetime buttons", () => {
  render(<PlansSection />);
  expect(screen.getByRole("button", { name: /start pro/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /get lifetime/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run targeted component tests**

Run: `cd frontend && yarn test src/features/landing/components/__tests__/PlansSection.test.tsx src/features/profile/components/__tests__/SubscriptionCard.test.tsx --runInBand`
Expected: FAIL because current UI still says coming soon / soon

- [ ] **Step 3: Inject billing actions into landing and profile cards**

```tsx
<Button onClick={() => startCheckout("pro")} variant={plan.highlight ? "filled" : "light"}>
  Start Pro
</Button>

<Button onClick={() => startCheckout("lifetime")} variant="light">
  Get Lifetime
</Button>
```

- [ ] **Step 4: Add manage-billing action for active Pro**

```tsx
{currentPlan === "Pro" ? (
  <Button variant="default" onClick={openBillingPortal}>Manage billing</Button>
) : null}
```

- [ ] **Step 5: Run UI tests**

Run: `cd frontend && yarn test src/features/landing/components/__tests__/PlansSection.test.tsx src/features/profile/components/__tests__/SubscriptionCard.test.tsx --runInBand`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/landing/components/PlansSection.tsx frontend/src/features/profile/components/SubscriptionCard.tsx frontend/src/features/profile/components/profile-client.tsx frontend/src/features/profile/hooks/useDataManagement.ts frontend/src/features/landing/constants/landingData.ts frontend/src/features/landing/components/__tests__/PlansSection.test.tsx frontend/src/features/profile/components/__tests__/SubscriptionCard.test.tsx
git commit -m "feat: add upgrade actions to pricing ui"
```

### Task 6: Add Upgrade CTAs At Free Plan Limits And Verify End-To-End

**Files:**
- Modify: `frontend/src/features/dashboard/components/dashboard-client.tsx`
- Modify: `frontend/src/features/profile/components/ImportProgressCard.tsx`
- Modify: `frontend/src/features/profile/hooks/useImport.ts`
- Test: `frontend/src/features/dashboard/components/__tests__/DashboardClient.test.tsx`
- Test: `frontend/cypress/e2e/profile.cy.ts`
- Test: `frontend/cypress/e2e/dashboard.cy.ts`

- [ ] **Step 1: Write failing limit CTA tests**

```tsx
it("shows an upgrade action when the free goal limit is reached", () => {
  render(<DashboardClient />);
  expect(screen.getByRole("button", { name: /start pro/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the targeted tests**

Run: `cd frontend && yarn test src/features/dashboard/components/__tests__/DashboardClient.test.tsx --runInBand`
Expected: FAIL because limit copy has no billing action

- [ ] **Step 3: Add reusable upgrade CTA wiring to free-plan limits**

```tsx
const goalLimitMessage = plan.maxGoals !== null && goals.length >= plan.maxGoals
  ? {
      text: `Free plan supports up to ${plan.maxGoals} goals. Upgrade to add more.`,
      action: <Button size="xs" onClick={() => startCheckout("pro")}>Start Pro</Button>,
    }
  : null;
```

- [ ] **Step 4: Add Cypress stubs for billing success paths**

```ts
cy.intercept("POST", "**/graphql", (req) => {
  if (req.body.operationName === "CreateBillingCheckout") {
    req.reply({ body: { data: { createBillingCheckout: { url: "https://sandbox-checkout.paddle.test" } } } });
  }
});
```

- [ ] **Step 5: Run frontend and E2E verification**

Run: `cd frontend && yarn test src/features/dashboard/components/__tests__/DashboardClient.test.tsx --runInBand`
Expected: PASS

Run: `cd frontend && yarn cypress:run --spec cypress/e2e/profile.cy.ts,cypress/e2e/dashboard.cy.ts`
Expected: PASS with checkout mutation stubbed and UI showing upgrade/manage actions

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/dashboard/components/dashboard-client.tsx frontend/src/features/profile/components/ImportProgressCard.tsx frontend/src/features/profile/hooks/useImport.ts frontend/src/features/dashboard/components/__tests__/DashboardClient.test.tsx frontend/cypress/e2e/profile.cy.ts frontend/cypress/e2e/dashboard.cy.ts
git commit -m "feat: add upgrade prompts at free plan limits"
```

### Task 7: Final Verification And Documentation

**Files:**
- Modify: `backend/README.md`
- Modify: `frontend/README.md`

- [ ] **Step 1: Document required billing environment variables**

```md
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
PADDLE_ENVIRONMENT=sandbox
PADDLE_PRO_PRICE_ID=
PADDLE_LIFETIME_PRICE_ID=
```

- [ ] **Step 2: Run full targeted verification**

Run: `cd backend && yarn test --runInBand`
Expected: PASS

Run: `cd frontend && yarn test --runInBand`
Expected: PASS

Run: `cd backend && yarn type-check && yarn lint`
Expected: PASS

Run: `cd frontend && yarn type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add backend/README.md frontend/README.md
git commit -m "docs: add paddle billing setup"
```
