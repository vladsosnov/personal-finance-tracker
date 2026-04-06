export {};

const mockGoal = {
  id: "goal-1",
  title: "Emergency Fund",
  targetAmount: 10000,
  initialAmount: 1000,
  currency: "USD",
  color: "#228be6",
  sortOrder: 0,
  isCompleted: false,
  completedAt: null,
  currentAmount: 3500,
  progress: 35,
  createdAt: "2024-01-01T00:00:00.000Z",
};

const mockGoalDetails = {
  ...mockGoal,
  operations: [
    {
      id: "op-1",
      type: "INCREASE",
      amount: 2500,
      currency: "USD",
      convertedAmount: 2500,
      note: "Salary deposit",
      operationDate: "2024-02-01",
      createdAt: "2024-02-01T00:00:00.000Z",
    },
  ],
};

const plnGoal = {
  id: "goal-pln",
  title: "Car Fund",
  targetAmount: 50000,
  initialAmount: 0,
  currency: "PLN",
  color: "#40c057",
  sortOrder: 0,
  isCompleted: false,
  completedAt: null,
  currentAmount: 17850,
  progress: 35.7,
  createdAt: "2024-01-01T00:00:00.000Z",
};

const usdGoal = {
  ...mockGoal,
  id: "goal-usd",
};

const plnGoalDetails = {
  ...plnGoal,
  operations: [
    {
      id: "op-pln-1",
      type: "INCREASE",
      amount: 800,
      currency: "PLN",
      convertedAmount: 800,
      note: null,
      operationDate: "2024-08-15",
      createdAt: "2024-08-15T00:00:00.000Z",
    },
    {
      id: "op-usd-1",
      type: "INCREASE",
      amount: 900,
      currency: "USD",
      convertedAmount: 3348,
      note: "USD contribution",
      operationDate: "2025-07-29",
      createdAt: "2025-07-29T00:00:00.000Z",
    },
  ],
};

const meWithPln = {
  me: { id: "user-1", email: "test@example.com", subscription: "Pro", role: "user", primaryCurrency: "PLN", emailVerified: true },
};

function stubMultiCurrencyGraphQL() {
  cy.intercept("POST", `${Cypress.env("apiUrl")}/graphql`, (req) => {
    const query = req.body.query ?? "";
    const operationName = req.body.operationName ?? "";
    if (operationName === "Me" || query.includes("query Me")) {
      req.reply({ body: { data: meWithPln } });
    } else if (operationName === "Goals" || query.includes("query Goals")) {
      req.reply({ body: { data: { goals: [plnGoal, usdGoal] } } });
    } else if (operationName === "Goal" || query.includes("query Goal")) {
      const goalId = req.body.variables?.id;
      const details = goalId === "goal-pln" ? plnGoalDetails : { ...mockGoalDetails, id: "goal-usd" };
      req.reply({ body: { data: { goal: details } } });
    } else if (operationName === "ExchangeRates" || query.includes("query ExchangeRates")) {
      req.reply({ body: { data: { exchangeRates: { base: req.body.variables?.base ?? "PLN", rates: JSON.stringify({ USD: 0.27, EUR: 0.23, PLN: 1 }), fetchedAt: new Date().toISOString() } } } });
    } else if (operationName === "CreateGoal" || query.includes("mutation CreateGoal")) {
      req.reply({ body: { data: { createGoal: { id: "goal-new" } } } });
    } else if (operationName === "UpdateGoalProgress" || query.includes("mutation UpdateGoalProgress")) {
      req.reply({ body: { data: { updateGoalProgress: plnGoalDetails } } });
    } else {
      req.reply({ body: { data: {} } });
    }
  }).as("graphql");

  cy.intercept("POST", `${Cypress.env("apiUrl")}/analytics/track`, { statusCode: 200, body: { ok: true } });
}

// Use testIsolation: false because the dashboard page's dynamic import + React concurrent
// rendering causes "Unknown root exit status" errors that corrupt the Next.js page cache,
// preventing subsequent cy.visit("/goals") from rendering the client component.
describe("Dashboard — Multi-Currency", { testIsolation: false }, () => {
  before(() => {
    // Navigate to about:blank to fully reset Next.js client state from prior specs
    cy.window().then((win) => { win.location.href = "about:blank"; });
    cy.wait(500);
    stubMultiCurrencyGraphQL();
    cy.visit("/goals");
    cy.contains("Car Fund", { timeout: 10000 }).should("be.visible");
  });

  beforeEach(() => {
    stubMultiCurrencyGraphQL();
  });

  it("displays goals with their respective currency symbols", () => {
    cy.contains("Car Fund").should("be.visible");
    cy.contains("Emergency Fund").should("be.visible");
    // PLN goal amounts should show zł
    cy.contains("zł 17 850.00").should("exist");
    cy.contains("zł 50 000.00").should("exist");
    // USD goal amounts should show $
    cy.contains("$ 3 500.00").should("exist");
  });

  it("shows the currency selector in the create goal form", () => {
    cy.get("form[aria-label='Create goal']").within(() => {
      cy.contains("Currency").should("be.visible");
    });
  });

  it("selects a PLN goal and shows operations with currency info", () => {
    cy.contains("Car Fund").click();
    // PLN operation
    cy.contains("zł 800.00").should("exist");
    // USD operation in a PLN goal — should show original currency
    cy.contains("$ 900.00").should("exist");
  });

  it("shows the currency selector in the add operation modal", () => {
    cy.get("[aria-label='Add operation']").click();
    cy.get("[role='dialog']").within(() => {
      cy.contains("Currency").should("be.visible");
      cy.contains("button", /cancel/i).click();
    });
    cy.get("[role='dialog']").should("not.exist");
  });

  it("shows the currency selector in the edit goal modal", () => {
    cy.get("[aria-label='Manage goals']").click();
    cy.get("[aria-label='Edit Car Fund']").click();

    cy.get("[role='dialog']").within(() => {
      cy.contains("Currency").should("be.visible");
      cy.contains("button", /cancel/i).click();
    });
    cy.get("[role='dialog']").should("not.exist");
    cy.get("[aria-label='Exit manage mode']").click();
  });
});
