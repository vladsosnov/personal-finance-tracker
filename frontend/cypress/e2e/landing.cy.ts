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
      cy.contains("Dashboard").should("be.visible");
      cy.contains("Feedback").should("be.visible");
    });
  });

  it("renders product features section", () => {
    cy.contains("What's already inside").should("exist");
  });

  it("renders plans section", () => {
    cy.contains("Free").should("exist");
  });

  it("renders CTA section with sign-up link", () => {
    cy.contains(/get started|sign up|create account/i).should("exist");
  });

  it("navigates to dashboard page", () => {
    cy.get("nav").contains("Dashboard").click();
    cy.url().should("include", "/dashboard");
  });

  it("navigates to feedback page", () => {
    cy.get("nav").contains("Feedback").click();
    cy.url().should("include", "/feedback");
  });
});
