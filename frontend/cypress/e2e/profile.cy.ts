export {};

function stubProfileGraphQL() {
  cy.intercept("POST", `${Cypress.env("apiUrl")}/graphql`, (req) => {
    const query = req.body.query ?? "";
    if (query.includes("query Me")) {
      req.reply({
        body: {
          data: {
            me: { id: "user-1", email: "test@example.com", subscription: "Pro", role: "user", primaryCurrency: "USD", emailVerified: true },
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
                currency: "USD",
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
    } else if (query.includes("query ExchangeRates")) {
      req.reply({ body: { data: { exchangeRates: { base: "USD", rates: JSON.stringify({ EUR: 0.92, PLN: 3.72, GBP: 0.79 }), fetchedAt: new Date().toISOString() } } } });
    } else if (query.includes("mutation SetPrimaryCurrency")) {
      req.reply({ body: { data: { setPrimaryCurrency: { id: "user-1", email: "test@example.com", subscription: "Pro", role: "user", primaryCurrency: req.body.variables?.currency ?? "USD", emailVerified: true } } } });
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

  describe("Import Progress", () => {
    it("shows the import progress card", () => {
      cy.contains("Import progress").should("be.visible");
    });

    it("shows the file input", () => {
      cy.contains("Progress file").should("be.visible");
    });

    it("does not show import button before file is selected", () => {
      cy.contains("button", /^import$/i).should("not.exist");
    });

    it("shows import button, preview table, remove button, and can remove a goal", () => {
      const fileContent = JSON.stringify([
        {
          title: "Emergency fund",
          targetValue: 10000,
          initialValue: 500,
          history: [
            { date: "2026-01-31T10:00:00Z", value: 1200 },
            { date: "2026-02-28T10:00:00Z", value: 1800, note: "Monthly top-up" },
          ],
        },
      ]);

      cy.get("input[type='file']").selectFile(
        { contents: Cypress.Buffer.from(fileContent), fileName: "progress.txt", mimeType: "text/plain" },
        { force: true }
      );

      cy.contains("button", /^import$/i).should("be.visible");
      cy.get("[aria-label='Goals ready to import']").should("be.visible");
      cy.contains("Emergency fund").should("be.visible");
      cy.get("[aria-label='Remove Emergency fund from import']").should("be.visible");

      cy.get("[aria-label='Remove Emergency fund from import']").click();
      cy.get("[aria-label='Goals ready to import']").should("not.exist");
    });

    it("shows currency badge and formatted amounts for imported goals with currency", () => {
      const fileContent = JSON.stringify([
        {
          title: "Car Fund",
          targetValue: 50000,
          initialValue: 0,
          currency: "PLN",
          operations: [
            { type: "INCREASE", amount: 800, currency: "PLN", operationDate: "2024-08-15" },
            { type: "INCREASE", amount: 900, currency: "USD", operationDate: "2025-07-29" },
          ],
        },
      ]);

      cy.get("input[type='file']").selectFile(
        { contents: Cypress.Buffer.from(fileContent), fileName: "progress.txt", mimeType: "text/plain" },
        { force: true }
      );

      cy.get("[aria-label='Goals ready to import']").should("be.visible");
      cy.contains("Car Fund").should("be.visible");
      cy.contains("PLN").should("be.visible");
      cy.contains("zł 50 000.00").should("be.visible");
    });

    it("imports goals without currency field defaulting to no badge", () => {
      const fileContent = JSON.stringify([
        {
          title: "Simple Goal",
          targetValue: 5000,
          initialValue: 0,
          history: [
            { date: "2026-01-15T00:00:00Z", value: 1000 },
          ],
        },
      ]);

      cy.get("input[type='file']").selectFile(
        { contents: Cypress.Buffer.from(fileContent), fileName: "progress.txt", mimeType: "text/plain" },
        { force: true }
      );

      cy.get("[aria-label='Goals ready to import']").should("be.visible");
      cy.contains("Simple Goal").should("be.visible");
      // Should show plain number without currency symbol (no currency in source)
      cy.contains("5 000.00").should("be.visible");
    });
  });

  describe("Currency Settings", () => {
    beforeEach(() => {
      stubProfileGraphQL();
      cy.visit("/profile");
    });

    it("shows the currency settings card", () => {
      cy.contains("Currency").should("be.visible");
      cy.contains("Primary currency").should("be.visible");
    });

    it("displays the current primary currency", () => {
      cy.contains("USD ($)").should("exist");
    });
  });

  describe("Custom Colors", () => {
    beforeEach(() => {
      stubProfileGraphQL();
      cy.visit("/profile");
    });

    it("shows the custom color palette card", () => {
      cy.contains("Custom color palette").should("be.visible");
    });

    it("shows the color input and label input", () => {
      cy.get("input[placeholder='#FF5500']").should("be.visible");
      cy.get("input[placeholder='Color name']").should("be.visible");
    });

    it("shows validation error for invalid hex", () => {
      cy.get("input[placeholder='#FF5500']").type("notahex");
      cy.contains("button", "Add").click();
      cy.contains("Enter a valid hex color").should("be.visible");
    });

    it("adds a valid color to the palette", () => {
      cy.get("input[placeholder='#FF5500']").clear().type("#FF5500");
      cy.get("input[placeholder='Color name']").type("Sunset Orange");
      cy.contains("button", "Add").click();
      cy.contains("Sunset Orange").should("be.visible");
    });

    it("shows duplicate color error", () => {
      // Add first
      cy.get("input[placeholder='#FF5500']").clear().type("#FF5500");
      cy.get("input[placeholder='Color name']").type("Orange");
      cy.contains("button", "Add").click();
      // Try to add same hex again
      cy.get("input[placeholder='#FF5500']").clear().type("#FF5500");
      cy.contains("button", "Add").click();
      cy.contains("already in your palette").should("be.visible");
    });

    it("removes a color from the palette", () => {
      cy.get("input[placeholder='#FF5500']").clear().type("#AABBCC");
      cy.get("input[placeholder='Color name']").type("Custom Blue");
      cy.contains("button", "Add").click();
      cy.contains("Custom Blue").should("be.visible");

      cy.get("[aria-label='Remove Custom Blue']").click();
      cy.contains("Custom Blue").should("not.exist");
    });
  });
});
