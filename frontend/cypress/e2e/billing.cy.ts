export {};

type BillingPlan = "free" | "pro" | "lifetime";
type BillingStatus = "inactive" | "active";

const BASE_URL = "http://localhost:3000";

const makeGoals = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `goal-${index + 1}`,
    title: index === 0 ? "Emergency Fund" : index === 1 ? "Vacation" : "Car Fund",
    targetAmount: 10000 + index * 1000,
    initialAmount: 0,
    currency: "USD",
    color: "#228be6",
    sortOrder: index,
    isCompleted: false,
    completedAt: null,
    currentAmount: 5000,
    progress: 50,
    createdAt: "2024-01-01T00:00:00.000Z",
  }));

const toSubscriptionLabel = (plan: BillingPlan) => {
  if (plan === "pro") return "Pro";
  if (plan === "lifetime") return "Lifetime";
  return "Free";
};

function stubBillingFlow(initialPlan: BillingPlan = "free", initialGoalsCount = 3) {
  let currentPlan = initialPlan;
  let currentBillingStatus: BillingStatus = initialPlan === "free" ? "inactive" : "active";
  let currentGoalsCount = initialGoalsCount;

  cy.intercept("POST", `${Cypress.env("apiUrl")}/graphql`, (req) => {
    const query = req.body.query ?? "";
    const operationName = req.body.operationName ?? "";

    if (operationName === "Me" || query.includes("query Me")) {
      req.reply({
        body: {
          data: {
            me: {
              id: "user-1",
              email: "test@example.com",
              plan: currentPlan,
              billingStatus: currentBillingStatus,
              subscription: toSubscriptionLabel(currentPlan),
              role: "user",
              primaryCurrency: "USD",
              emailVerified: true,
            },
          },
        },
      });
      return;
    }

    if (operationName === "Goals" || query.includes("query Goals")) {
      req.reply({ body: { data: { goals: makeGoals(currentGoalsCount) } } });
      return;
    }

    if (operationName === "ExchangeRates" || query.includes("query ExchangeRates")) {
      req.reply({
        body: {
          data: {
            exchangeRates: {
              base: "USD",
              rates: JSON.stringify({ EUR: 0.92, PLN: 3.72, GBP: 0.79 }),
              fetchedAt: new Date().toISOString(),
            },
          },
        },
      });
      return;
    }

    if (operationName === "CreateBillingCheckout" || query.includes("mutation CreateBillingCheckout")) {
      const requestedPlan = (req.body.variables?.plan ?? "PRO") as "PRO" | "LIFETIME";
      currentPlan = requestedPlan === "LIFETIME" ? "lifetime" : "pro";
      currentBillingStatus = "active";

      req.reply({
        body: {
          data: {
            createBillingCheckout: {
              url: `${BASE_URL}/profile?billing=return&plan=${currentPlan}`,
            },
          },
        },
      });
      return;
    }

    if (operationName === "CreateBillingPortalSession" || query.includes("mutation CreateBillingPortalSession")) {
      req.reply({
        body: {
          data: {
            createBillingPortalSession: {
              url: `${BASE_URL}/profile?billing=return&plan=pro`,
            },
          },
        },
      });
      return;
    }

    if (operationName === "CreateGoal" || query.includes("mutation CreateGoal")) {
      currentGoalsCount += 1;
      req.reply({ body: { data: { createGoal: { id: `goal-${currentGoalsCount}` } } } });
      return;
    }

    req.reply({ body: { data: {} } });
  }).as("billingGraphql");

  cy.intercept("POST", `${Cypress.env("apiUrl")}/analytics/track`, { statusCode: 200, body: { ok: true } });
}

describe("Billing Flow", () => {
  it("upgrades a free user to Pro from the profile page", () => {
    stubBillingFlow("free", 3);

    cy.visit("/profile");

    cy.contains("button", "Upgrade to Pro").should("be.visible").click();

    cy.url().should("include", "/profile?billing=return&plan=pro");
    cy.contains("Your pro plan is active.").should("be.visible");
    cy.contains("Manage billing").should("be.visible");
    cy.contains("button", "Upgrade to Pro").should("not.exist");
  });

  it("upgrades a free user from the dashboard paywall and removes the free goal limit", () => {
    stubBillingFlow("free", 3);

    cy.visit("/goals");

    cy.contains(/free plan supports up to 3 goals/i).should("be.visible");
    cy.contains("a", "Upgrade to Pro").click();
    cy.url().should("include", "/profile?upgrade=pro");

    cy.contains("button", "Upgrade to Pro").click();
    cy.url().should("include", "/profile?billing=return&plan=pro");
    cy.contains("Your pro plan is active.").should("be.visible");

    cy.visit("/goals");

    cy.contains(/free plan supports up to 3 goals/i).should("not.exist");
    cy.contains("button", "Upgrade to Pro").should("not.exist");
  });

  it("upgrades a free user to Lifetime from the profile page", () => {
    stubBillingFlow("free", 3);

    cy.visit("/profile");

    cy.contains("button", "Get Lifetime").should("be.visible").click();

    cy.url().should("include", "/profile?billing=return&plan=lifetime");
    cy.contains("Your lifetime plan is active.").should("be.visible");
    cy.contains("button", "Get Lifetime").should("not.exist");
  });
});
