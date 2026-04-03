export {};

describe("Forgot Password Page", () => {
  beforeEach(() => {
    cy.visit("/auth/forgot-password");
  });

  it("renders the forgot password form", () => {
    cy.contains("Forgot password").should("be.visible");
    cy.get("input[type='email']").should("be.visible");
    cy.contains("button", "Send reset link").should("be.visible");
  });

  it("shows success state after submitting valid email", () => {
    cy.intercept("POST", `${Cypress.env("apiUrl")}/auth/forgot-password`, {
      statusCode: 200,
      body: { ok: true },
    }).as("forgotPassword");

    cy.get("input[type='email']").type("test@example.com");
    cy.contains("button", "Send reset link").click();

    cy.wait("@forgotPassword");
    cy.contains("Check your email").should("be.visible");
    cy.contains("test@example.com").should("be.visible");
  });

  it("shows email validation error for missing @ symbol", () => {
    cy.get("input[type='email']").type("notanemail");
    cy.contains("button", "Send reset link").click();

    cy.contains("Enter a valid email address").should("be.visible");
  });

  it("shows email validation error for missing domain", () => {
    cy.get("input[type='email']").type("user@");
    cy.contains("button", "Send reset link").click();

    cy.contains("Enter a valid email address").should("be.visible");
  });

  it("clears email error when user types valid email", () => {
    cy.get("input[type='email']").type("bad");
    cy.contains("button", "Send reset link").click();
    cy.contains("Enter a valid email address").should("be.visible");

    cy.get("input[type='email']").clear().type("valid@example.com");
    cy.contains("Enter a valid email address").should("not.exist");
  });

  it("does not call API for invalid email", () => {
    cy.intercept("POST", `${Cypress.env("apiUrl")}/auth/forgot-password`).as("forgotPassword");

    cy.get("input[type='email']").type("invalidemail");
    cy.contains("button", "Send reset link").click();

    cy.get("@forgotPassword.all").should("have.length", 0);
  });

  it("has back to sign in link", () => {
    cy.contains("Back to sign in").should("have.attr", "href", "/auth");
  });

  it("shows success page back to sign in link", () => {
    cy.intercept("POST", `${Cypress.env("apiUrl")}/auth/forgot-password`, {
      statusCode: 200,
      body: { ok: true },
    });

    cy.get("input[type='email']").type("test@example.com");
    cy.contains("button", "Send reset link").click();

    cy.contains("Back to sign in").should("be.visible");
  });
});

describe("Reset Password Page", () => {
  it("shows invalid link message when no token in URL", () => {
    cy.visit("/auth/reset-password");
    cy.contains("Invalid link").should("be.visible");
    cy.contains("Missing reset token").should("be.visible");
  });

  it("renders reset password form when token is present", () => {
    cy.visit("/auth/reset-password?token=abc123");
    cy.contains("Reset password").should("be.visible");
    cy.get("input[autocomplete='new-password']").should("have.length", 2);
    cy.contains("button", "Reset password").should("be.visible");
  });

  it("shows password too short error inline", () => {
    cy.visit("/auth/reset-password?token=abc123");

    cy.get("input[autocomplete='new-password']").first().type("short");
    cy.get("input[autocomplete='new-password']").first().blur();

    cy.contains("Must be at least 8 characters").should("be.visible");
  });

  it("shows passwords do not match error", () => {
    cy.visit("/auth/reset-password?token=abc123");

    cy.get("input[autocomplete='new-password']").first().type("password123");
    cy.get("input[autocomplete='new-password']").last().type("different123");
    cy.get("input[autocomplete='new-password']").last().blur();

    cy.contains("Passwords do not match").should("be.visible");
  });

  it("submit button is disabled when passwords do not match", () => {
    cy.visit("/auth/reset-password?token=abc123");

    cy.get("input[autocomplete='new-password']").first().type("password123");
    cy.get("input[autocomplete='new-password']").last().type("different123");

    cy.contains("button", "Reset password").should("be.disabled");
  });

  it("submit button is disabled when password is too short", () => {
    cy.visit("/auth/reset-password?token=abc123");

    cy.get("input[autocomplete='new-password']").first().type("short");
    cy.get("input[autocomplete='new-password']").last().type("short");

    cy.contains("button", "Reset password").should("be.disabled");
  });

  it("shows success state after successful reset", () => {
    cy.intercept("POST", `${Cypress.env("apiUrl")}/auth/reset-password`, {
      statusCode: 200,
      body: { ok: true },
    }).as("resetPassword");

    cy.visit("/auth/reset-password?token=validtoken");

    cy.get("input[autocomplete='new-password']").first().type("newpassword123");
    cy.get("input[autocomplete='new-password']").last().type("newpassword123");
    cy.contains("button", "Reset password").click();

    cy.wait("@resetPassword");
    cy.contains("Password reset").should("be.visible");
    cy.contains("successfully reset").should("be.visible");
    cy.contains("Sign in with your new password").should("be.visible");
  });

  it("shows error when token is invalid or expired", () => {
    cy.intercept("POST", `${Cypress.env("apiUrl")}/auth/reset-password`, {
      statusCode: 400,
      body: { error: "Invalid or expired reset link" },
    }).as("resetFail");

    cy.visit("/auth/reset-password?token=expiredtoken");

    cy.get("input[autocomplete='new-password']").first().type("newpassword123");
    cy.get("input[autocomplete='new-password']").last().type("newpassword123");
    cy.contains("button", "Reset password").click();

    cy.wait("@resetFail");
    cy.contains("Invalid or expired reset link").should("be.visible");
  });
});
