export {};

describe("Expenses Page", () => {
  beforeEach(() => {
    cy.visit("/expenses");
  });

  it("renders the page header and description", () => {
    cy.contains("Expenses").should("be.visible");
    cy.contains("Track where your money goes").should("be.visible");
  });

  it("shows feature list of what users will be able to do", () => {
    cy.contains("Log expenses instantly").should("be.visible");
    cy.contains("Organize by category").should("be.visible");
    cy.contains("See spending breakdowns").should("be.visible");
    cy.contains("Browse your full history").should("be.visible");
  });

  it("shows Coming Soon badge", () => {
    cy.contains("Coming Soon").should("be.visible");
    cy.contains("currently in development").should("be.visible");
  });

  it("has a working nav link from the header", () => {
    cy.visit("/");
    cy.get("nav").contains("Expenses").click();
    cy.url().should("include", "/expenses");
    cy.contains("Expenses").should("be.visible");
  });
});
