export {};
const API_URL = "http://localhost:4000";

describe("Auth Page", () => {
  beforeEach(() => {
    cy.visit("/auth");
  });

  it("renders the login form by default", () => {
    cy.contains("Financial Goals Tracker").should("be.visible");
    cy.contains("Log In").should("be.visible");
    cy.get("input[type='email']").should("be.visible");
    cy.get("[type='password']").should("exist");
  });

  it("toggles between login and register modes", () => {
    cy.contains("Register").click();
    cy.get("button[type='submit']").should("contain.text", "Create Account");

    cy.contains("Log In").click();
    cy.get("button[type='submit']").should("contain.text", "Log In");
  });

  it("shows forgot password link in login mode", () => {
    cy.contains("Forgot password?").should("be.visible");
  });

  it("hides forgot password link in register mode", () => {
    cy.contains("Register").click();
    cy.contains("Forgot password?").should("not.exist");
  });

  describe("Login", () => {
    it("submits login and redirects to dashboard on success", () => {
      cy.intercept("POST", `${API_URL}/auth/login`, {
        statusCode: 200,
        body: { user: { id: "user-1", email: "test@example.com", subscription: "Free" } },
      }).as("login");

      cy.intercept("POST", `${API_URL}/graphql`, (req) => {
        if (req.body.query?.includes("Me")) {
          req.reply({
            body: {
              data: {
                me: { id: "user-1", email: "test@example.com", subscription: "Free", role: "user", emailVerified: true },
              },
            },
          });
        }
      });

      cy.get("input[type='email']").type("test@example.com");
      cy.get("[type='password']").type("password123");
      cy.get("button[type='submit']").click();

      cy.wait("@login");
      cy.url().should("include", "/dashboard");
    });

    it("displays error on failed login", () => {
      cy.intercept("POST", `${API_URL}/auth/login`, {
        statusCode: 401,
        body: { error: "Invalid credentials" },
      }).as("loginFail");

      cy.get("input[type='email']").type("wrong@example.com");
      cy.get("[type='password']").type("wrongpass");
      cy.get("button[type='submit']").click();

      cy.wait("@loginFail");
      cy.contains("Invalid credentials").should("be.visible");
    });
  });

  describe("Register", () => {
    it("submits registration and redirects to dashboard", () => {
      cy.intercept("POST", `${API_URL}/auth/register`, {
        statusCode: 201,
        body: { user: { id: "user-2", email: "new@example.com", subscription: "Free" } },
      }).as("register");

      cy.intercept("POST", `${API_URL}/graphql`, (req) => {
        if (req.body.query?.includes("Me")) {
          req.reply({
            body: {
              data: {
                me: { id: "user-2", email: "new@example.com", subscription: "Free", role: "user", emailVerified: false },
              },
            },
          });
        }
      });

      cy.contains("Register").click();
      cy.get("input[type='email']").type("new@example.com");
      cy.get("[type='password']").type("newpassword123");
      cy.get("button[type='submit']").click();

      cy.wait("@register");
      cy.url().should("include", "/dashboard");
    });

    it("displays error when email already exists", () => {
      cy.intercept("POST", `${API_URL}/auth/register`, {
        statusCode: 409,
        body: { error: "Email already exists" },
      }).as("registerFail");

      cy.contains("Register").click();
      cy.get("input[type='email']").type("existing@example.com");
      cy.get("[type='password']").type("password123");
      cy.get("button[type='submit']").click();

      cy.wait("@registerFail");
      cy.contains("Email already exists").should("be.visible");
    });
  });
});
