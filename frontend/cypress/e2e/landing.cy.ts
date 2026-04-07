export {};
describe("Landing Page", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("renders the hero section with social proof", () => {
    cy.contains("Financial Goals Tracker").should("be.visible");
    cy.contains("Free forever").should("be.visible");
    cy.contains("20+ currencies").should("be.visible");
    cy.contains("Works on any device").should("be.visible");
  });

  it("renders navigation links", () => {
    cy.get("nav").within(() => {
      cy.contains("Home").should("be.visible");
      cy.contains("Goals").should("be.visible");
      cy.contains("Feedback").should("be.visible");
    });
  });

  it("renders product features section with multi-currency", () => {
    cy.contains("What's already inside").should("exist");
    cy.contains("Multi-currency goals").scrollIntoView();
    cy.contains("Multi-currency goals").should("be.visible");
  });

  it("renders future features section with roadmap items", () => {
    cy.contains("We are actively building what comes next").should("exist");
    cy.contains("Internationalization").should("exist");
    cy.contains("Recurring operations").should("exist");
    cy.contains("Goal reminders").should("exist");
    cy.contains("Community-driven roadmap").should("exist");
  });

  it("renders plans section", () => {
    cy.contains("Free").should("exist");
  });

  it("renders FAQ section with accordion items", () => {
    cy.contains("Common questions").scrollIntoView();
    cy.contains("Common questions").should("be.visible");
    cy.contains("Is it really free?").should("be.visible");
    cy.contains("Where is my data stored?").should("be.visible");
    cy.contains("Can I track goals in different currencies?").should("be.visible");
    cy.contains("Does it work on mobile?").should("be.visible");
  });

  it("expands a FAQ accordion item", () => {
    cy.contains("Is it really free?").scrollIntoView();
    cy.contains("Is it really free?").click();
    cy.contains("free stays free").should("be.visible");
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
