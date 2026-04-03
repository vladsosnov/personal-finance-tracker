export {};

function stubProfileGraphQL() {
  cy.intercept("POST", `${Cypress.env("apiUrl")}/graphql`, (req) => {
    const query = req.body.query ?? "";
    if (query.includes("query Me")) {
      req.reply({
        body: {
          data: {
            me: { id: "user-1", email: "test@example.com", subscription: "Pro", role: "user", emailVerified: true },
          },
        },
      });
    } else if (query.includes("query Goals")) {
      req.reply({
        body: {
          data: {
            goals: [
              {
                id: "g-1",
                title: "Emergency Fund",
                targetAmount: 10000,
                initialAmount: 0,
                color: "#228be6",
                sortOrder: 0,
                isCompleted: false,
                completedAt: null,
                currentAmount: 5000,
                progress: 50,
                createdAt: "2024-01-01T00:00:00.000Z",
              },
            ],
          },
        },
      });
    } else if (query.includes("mutation ResetAllData")) {
      req.reply({ body: { data: { resetAllData: { deletedGoalsCount: 1, deletedOperationsCount: 3 } } } });
    } else if (query.includes("query ExportAllData")) {
      req.reply({ body: { data: { exportAllData: "[]" } } });
    } else {
      req.reply({ body: { data: {} } });
    }
  }).as("graphql");

  // Stub analytics track endpoint
  cy.intercept("POST", `${Cypress.env("apiUrl")}/analytics/track`, { statusCode: 200, body: { ok: true } });
}

describe("Profile Page", () => {
  beforeEach(() => {
    stubProfileGraphQL();
    cy.visit("/profile");
  });

  it("renders profile page header", () => {
    cy.contains("Profile").should("be.visible");
    cy.contains("Account preferences").should("be.visible");
  });

  it("displays user email", () => {
    cy.contains("test@example.com").should("be.visible");
  });

  it("displays subscription plan", () => {
    cy.contains("Pro").should("be.visible");
  });

  describe("Theme", () => {
    it("renders theme card", () => {
      cy.contains(/theme|appearance/i).should("exist");
    });
  });

  describe("Data Management", () => {
    it("shows export and reset buttons", () => {
      cy.contains(/export/i).should("exist");
      cy.contains(/reset/i).should("exist");
    });

    it("opens reset data confirmation modal", () => {
      cy.contains("button", /reset/i).click();

      cy.get("[role='dialog']").should("be.visible");
      cy.contains("Reset all data").should("be.visible");
    });

    it("confirms reset data", () => {
      cy.contains("button", /reset/i).click();

      cy.get("[role='dialog']").within(() => {
        cy.contains("button", /^reset$/i).click();
      });

      cy.wait("@graphql");
    });

    it("cancels reset data", () => {
      cy.contains("button", /reset/i).click();

      cy.get("[role='dialog']").within(() => {
        cy.contains("button", /cancel/i).click();
      });

      cy.get("[role='dialog']").should("not.exist");
    });
  });

  describe("Delete Account", () => {
    it("shows delete account button", () => {
      cy.contains(/delete account/i).should("exist");
    });

    it("opens delete account confirmation modal", () => {
      cy.contains("button", /delete account/i).click();

      cy.get("[role='dialog']").should("be.visible");
      cy.contains(/permanently delete/i).should("be.visible");
    });
  });

  describe("Navigation", () => {
    it("shows authenticated nav items (Profile, Log Out)", () => {
      cy.get("nav").within(() => {
        cy.contains("Profile").should("be.visible");
        cy.contains("Log Out").should("be.visible");
      });
    });
  });
});
