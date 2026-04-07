export {};

const meResponse = {
  me: { id: "user-1", email: "test@example.com", subscription: "Free", role: "user", primaryCurrency: "USD", emailVerified: true },
};

const nearCompleteGoal = {
  id: "goal-1",
  title: "Emergency Fund",
  targetAmount: 10000,
  initialAmount: 1000,
  currency: "USD",
  color: "#228be6",
  sortOrder: 0,
  isCompleted: false,
  completedAt: null,
  currentAmount: 9500,
  progress: 95,
  createdAt: "2024-01-01T00:00:00.000Z",
};

const nearCompleteGoalDetails = {
  ...nearCompleteGoal,
  operations: [
    {
      id: "op-1",
      type: "INCREASE" as const,
      amount: 8500,
      currency: "USD",
      convertedAmount: 8500,
      note: "Savings",
      operationDate: "2024-06-01",
      createdAt: "2024-06-01T00:00:00.000Z",
    },
  ],
};

function stubCompletionGraphQL() {
  let completed = false;

  cy.intercept("POST", `${Cypress.env("apiUrl")}/graphql`, (req) => {
    const query = req.body.query ?? "";
    const operationName = req.body.operationName ?? "";

    if (operationName === "Me" || query.includes("query Me")) {
      req.reply({ body: { data: meResponse } });
    } else if (operationName === "Goals" || query.includes("query Goals")) {
      const goal = completed
        ? { ...nearCompleteGoal, currentAmount: 10000, progress: 100, isCompleted: true, completedAt: new Date().toISOString() }
        : nearCompleteGoal;
      req.reply({ body: { data: { goals: [goal] } } });
    } else if (operationName === "Goal" || query.includes("query Goal")) {
      const details = completed
        ? { ...nearCompleteGoalDetails, currentAmount: 10000, progress: 100, isCompleted: true, completedAt: new Date().toISOString() }
        : nearCompleteGoalDetails;
      req.reply({ body: { data: { goal: details } } });
    } else if (operationName === "UpdateGoalProgress" || query.includes("mutation UpdateGoalProgress")) {
      // After adding an operation that reaches the target, return goal at 100%
      const updatedDetails = {
        ...nearCompleteGoalDetails,
        currentAmount: 10000,
        progress: 100,
        operations: [
          ...nearCompleteGoalDetails.operations,
          {
            id: "op-2",
            type: "INCREASE",
            amount: 500,
            currency: "USD",
            convertedAmount: 500,
            note: "Final push",
            operationDate: new Date().toISOString().split("T")[0],
            createdAt: new Date().toISOString(),
          },
        ],
      };
      req.reply({ body: { data: { updateGoalProgress: updatedDetails } } });
    } else if (operationName === "CompleteGoal" || query.includes("mutation CompleteGoal")) {
      completed = true;
      req.reply({
        body: {
          data: {
            completeGoal: {
              ...nearCompleteGoalDetails,
              currentAmount: 10000,
              progress: 100,
              isCompleted: true,
              completedAt: new Date().toISOString(),
            },
          },
        },
      });
    } else if (operationName === "ExchangeRates" || query.includes("query ExchangeRates")) {
      req.reply({ body: { data: { exchangeRates: { base: "USD", rates: JSON.stringify({ EUR: 0.92, PLN: 3.72 }), fetchedAt: new Date().toISOString() } } } });
    } else {
      req.reply({ body: { data: {} } });
    }
  }).as("graphql");

  cy.intercept("POST", `${Cypress.env("apiUrl")}/analytics/track`, { statusCode: 200, body: { ok: true } });
}

describe("Dashboard — Goal Completion", { testIsolation: false }, () => {
  before(() => {
    cy.window().then((win) => { win.location.href = "about:blank"; });
    cy.wait(500);
    stubCompletionGraphQL();
    cy.visit("/goals");
    cy.contains("Emergency Fund", { timeout: 10000 }).should("be.visible");
  });

  beforeEach(() => {
    stubCompletionGraphQL();
  });

  it("shows a goal near completion at 95%", () => {
    cy.contains("95.0%").should("be.visible");
  });

  it("selects the goal and shows its details", () => {
    cy.contains("Emergency Fund").click();
    cy.contains("Savings").should("be.visible");
  });

  it("adds an operation that reaches the target and triggers the completion modal", () => {
    cy.get("[aria-label='Add operation']").click();

    cy.get("[role='dialog']").within(() => {
      cy.get("input[placeholder='500']").clear().type("500");
      cy.contains("button", "Add").click();
    });

    cy.wait("@graphql");

    // The completion modal should appear automatically
    cy.contains("Complete goal?", { timeout: 10000 }).should("be.visible");
    cy.contains("Emergency Fund").should("be.visible");
    cy.contains("reached its target").should("be.visible");
  });

  it("confirms goal completion via the modal", () => {
    // Modal is still open from previous test — click Complete inside the dialog
    cy.get("[role='dialog']").within(() => {
      cy.contains("button", "Complete").click();
    });
    cy.wait("@graphql");
    cy.contains("Complete goal?").should("not.exist");
  });
});
