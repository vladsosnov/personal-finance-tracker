export {};

const meResponse = {
  me: { id: "user-1", email: "test@example.com", subscription: "Free", role: "user", emailVerified: true },
};

const mockGoal = {
  id: "goal-1",
  title: "Emergency Fund",
  targetAmount: 10000,
  initialAmount: 1000,
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
      note: "Salary deposit",
      operationDate: "2024-02-01",
      createdAt: "2024-02-01T00:00:00.000Z",
    },
  ],
};

function stubDashboardGraphQL(goals = [mockGoal], goalDetails = mockGoalDetails) {
  cy.intercept("POST", `${Cypress.env("apiUrl")}/graphql`, (req) => {
    const query = req.body.query ?? "";
    const operationName = req.body.operationName ?? "";
    if (operationName === "Me" || query.includes("query Me")) {
      req.reply({ body: { data: meResponse } });
    } else if (operationName === "Goals" || query.includes("query Goals")) {
      req.reply({ body: { data: { goals } } });
    } else if (operationName === "Goal" || query.includes("query Goal")) {
      req.reply({ body: { data: { goal: goalDetails } } });
    } else if (operationName === "CreateGoal" || query.includes("mutation CreateGoal")) {
      req.reply({ body: { data: { createGoal: { id: "goal-new" } } } });
    } else if (operationName === "UpdateGoalProgress" || query.includes("mutation UpdateGoalProgress")) {
      req.reply({ body: { data: { updateGoalProgress: mockGoal } } });
    } else if (operationName === "DeleteGoal" || query.includes("mutation DeleteGoal")) {
      req.reply({ body: { data: { deleteGoal: { id: req.body.variables?.goalId } } } });
    } else if (operationName === "EditGoal" || query.includes("mutation EditGoal")) {
      req.reply({ body: { data: { editGoal: mockGoal } } });
    } else if (operationName === "CompleteGoal" || query.includes("mutation CompleteGoal")) {
      req.reply({
        body: {
          data: {
            completeGoal: { ...mockGoalDetails, isCompleted: true, completedAt: new Date().toISOString() },
          },
        },
      });
    } else if (operationName === "DeleteGoalOperation" || query.includes("mutation DeleteGoalOperation")) {
      req.reply({ body: { data: { deleteGoalOperation: mockGoalDetails } } });
    } else {
      req.reply({ body: { data: {} } });
    }
  }).as("graphql");

  cy.intercept("POST", `${Cypress.env("apiUrl")}/analytics/track`, { statusCode: 200, body: { ok: true } });
}

// Use testIsolation: false because the dashboard page's dynamic import + React concurrent
// rendering causes "Unknown root exit status" errors that corrupt the Next.js page cache,
// preventing subsequent cy.visit("/goals") from rendering the client component.
describe("Dashboard", { testIsolation: false }, () => {
  before(() => {
    stubDashboardGraphQL();
    cy.visit("/goals");
    cy.contains("Emergency Fund", { timeout: 10000 }).should("be.visible");
  });

  beforeEach(() => {
    stubDashboardGraphQL();
  });

  it("renders the dashboard with goals list", () => {
    cy.contains("Emergency Fund").should("be.visible");
    cy.contains("35.0%").should("be.visible");
  });

  it("displays overview stats", () => {
    cy.contains("$10 000.00").should("exist");
    cy.contains("$3 500.00").should("exist");
  });

  it("shows the create goal form", () => {
    cy.contains("Create goal").should("be.visible");
    cy.get("input[placeholder='Buy a house']").should("be.visible");
  });

  it("disables add goal button when form is empty", () => {
    cy.contains("button", "Add goal").should("be.disabled");
  });

  it("creates a new goal via the form", () => {
    cy.get("input[placeholder='Buy a house']").clear().type("Vacation Fund");
    cy.get("input[placeholder='25000']").clear().type("8000");
    cy.contains("button", "Add goal").click();
    cy.wait("@graphql");
    // Clear inputs for next test
    cy.get("input[placeholder='Buy a house']").clear();
    cy.get("input[placeholder='25000']").clear();
  });

  it("selects a goal and shows details panel", () => {
    cy.contains("Emergency Fund").click();
    cy.contains("Salary deposit").should("be.visible");
  });

  it("shows operations table for selected goal", () => {
    // Goal is already selected from previous test
    cy.contains("$2 500.00").should("exist");
  });

  it("opens and submits the add operation form", () => {
    cy.get("[aria-label='Add operation']").click();

    cy.get("[role='dialog']").within(() => {
      cy.get("input[placeholder='500']").clear().type("1000");
      cy.contains("button", "Add").click();
    });

    cy.wait("@graphql");
  });

  it("enters manage mode and shows edit/delete buttons", () => {
    cy.get("[aria-label='Manage goals']").click();

    cy.get("[aria-label='Edit Emergency Fund']").should("exist");
    cy.get("[aria-label='Remove Emergency Fund']").should("exist");

    // Exit manage mode
    cy.get("[aria-label='Exit manage mode']").click();
  });

  it("opens edit goal modal and shows current values", () => {
    cy.get("[aria-label='Manage goals']").click();
    cy.get("[aria-label='Edit Emergency Fund']").click();

    cy.get("[role='dialog']").should("be.visible");
    cy.get("[role='dialog']").within(() => {
      // Edit modal has a Title input containing the goal name
      cy.get("input[aria-required]").first().should("have.value", "Emergency Fund");
    });

    cy.get("[role='dialog']").within(() => {
      cy.contains("button", /cancel/i).click();
    });
    cy.get("[role='dialog']").should("not.exist");
    cy.get("[aria-label='Exit manage mode']").click();
  });

  it("opens delete goal modal and cancels", () => {
    cy.get("[aria-label='Manage goals']").click();
    cy.get("[aria-label='Remove Emergency Fund']").click();

    cy.get("[role='dialog']").should("be.visible");
    cy.contains("Emergency Fund").should("be.visible");

    cy.get("[role='dialog']").within(() => {
      cy.contains("button", /cancel/i).click();
    });

    cy.get("[role='dialog']").should("not.exist");
    cy.get("[aria-label='Exit manage mode']").click();
  });

  it("edits an operation from the operations table", () => {
    // Goal is already selected from prior tests; operations table is visible
    cy.contains("Salary deposit").should("be.visible");

    cy.get("[aria-label*='Edit'][aria-label*='operation']").first().click();

    cy.get("[role='dialog']").should("be.visible");
    cy.get("[role='dialog']").within(() => {
      cy.contains("Edit operation").should("be.visible");
      cy.contains("button", /cancel/i).click();
    });
    cy.get("[role='dialog']").should("not.exist");
  });

  it("opens delete operation modal and cancels", () => {
    cy.contains("Salary deposit").should("be.visible");

    cy.get("[aria-label*='Delete'][aria-label*='operation']").first().click();

    cy.get("[role='dialog']").should("be.visible");
    cy.get("[role='dialog']").within(() => {
      cy.contains("button", /cancel/i).click();
    });

    cy.get("[role='dialog']").should("not.exist");
  });

  it("disables add operation button when amount is empty", () => {
    cy.contains("Salary deposit").should("be.visible");

    cy.get("[aria-label='Add operation']").click();

    cy.get("[role='dialog']").within(() => {
      cy.get("input[placeholder='500']").clear();
      cy.contains("button", "Add").should("be.disabled");
      cy.contains("button", /cancel/i).click();
    });
    cy.get("[role='dialog']").should("not.exist");
  });

  it("deletes a goal after confirmation", () => {
    stubDashboardGraphQL([]);
    cy.get("[aria-label='Manage goals']").click();
    cy.get("[aria-label='Remove Emergency Fund']").click();

    cy.get("[role='dialog']").within(() => {
      cy.contains("button", /^remove$/i).click();
    });

    cy.wait("@graphql");
  });
});

