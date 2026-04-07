export {};
describe("Landing Page", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("renders the hero section", () => {
    cy.contains("Financial Goals Tracker").should("be.visible");
  });

  it("renders navigation links", () => {
    cy.get("nav").within(() => {
      cy.contains("Home").should("be.visible");
      cy.contains("Goals").should("be.visible");
      cy.contains("Feedback").should("be.visible");
    });
  });

  it("renders product features section", () => {
    cy.contains("What's already inside").should("exist");
  });

  it("renders future features section with roadmap items", () => {
    cy.contains("We are actively building what comes next").should("exist");
    cy.contains("Multi-currency goals").should("exist");
    cy.contains("Internationalization").should("exist");
    cy.contains("Monthly budget planning").should("exist");
    cy.contains("Recurring operations").should("exist");
    cy.contains("Goal reminders").should("exist");
    cy.contains("Community-driven roadmap").should("exist");
  });

  it("shows Completed badge on multi-currency goals card", () => {
    cy.contains("Multi-currency goals").scrollIntoView();
    cy.contains("Multi-currency goals").closest("[class*='Card']").within(() => {
      cy.contains("Completed").should("be.visible");
    });
  });

  it("does not show Completed badge on other future feature cards", () => {
    cy.contains("Internationalization").scrollIntoView();
    cy.contains("Internationalization").closest("[class*='Card']").within(() => {
      cy.contains("Completed").should("not.exist");
    });
  });

  it("renders plans section", () => {
    cy.contains("Free").should("exist");
  });

  it("renders CTA section with sign-up link", () => {
    cy.contains(/get started|sign up|create account/i).should("exist");
  });

  it("navigates to dashboard page", () => {
    cy.get("nav").contains("Goals").click();
    cy.url().should("include", "/goals");
  });

  it("navigates to feedback page", () => {
    cy.get("nav").contains("Feedback").click();
    cy.url().should("include", "/feedback");
  });
});
