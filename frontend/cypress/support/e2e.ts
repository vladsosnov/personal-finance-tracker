// Global Cypress configuration and custom commands
export {};

// Ignore Next.js / React internal errors — they are not test failures
Cypress.on("uncaught:exception", (err) => {
  if (
    err.message.includes("Hydration failed") ||
    err.message.includes("Minified React error") ||
    err.message.includes("There was an error while hydrating") ||
    err.message.includes("Unknown root exit status") ||
    err.message.includes("Unauthorized") ||
    err.message.includes("CombinedGraphQLErrors")
  ) {
    return false;
  }
});

// Stub the GraphQL endpoint with a custom command
Cypress.Commands.add("interceptGraphQL", (operationName: string, response: object, alias?: string) => {
  cy.intercept("POST", `${Cypress.env("apiUrl")}/graphql`, (req) => {
    if (req.body.query?.includes(operationName)) {
      req.reply({ body: { data: response } });
    }
  }).as(alias ?? operationName);
});

// Stub the REST auth endpoints
Cypress.Commands.add("interceptAuth", (endpoint: string, statusCode: number, body: object) => {
  cy.intercept("POST", `${Cypress.env("apiUrl")}/auth/${endpoint}`, {
    statusCode,
    body,
  }).as(endpoint);
});

// Login by stubbing the auth response and seeding cookies-based session via GraphQL me query
Cypress.Commands.add("loginByStub", (user?: { id?: string; email?: string; subscription?: string; role?: string; primaryCurrency?: string }) => {
  const me = {
    id: user?.id ?? "user-1",
    email: user?.email ?? "test@example.com",
    subscription: user?.subscription ?? "Free",
    role: user?.role ?? "user",
    primaryCurrency: user?.primaryCurrency ?? "USD",
    emailVerified: true,
  };

  cy.intercept("POST", `${Cypress.env("apiUrl")}/graphql`, (req) => {
    if (req.body.query?.includes("Me")) {
      req.reply({ body: { data: { me } } });
    }
  }).as("getMe");
});

declare global {
  namespace Cypress {
    interface Chainable {
      interceptGraphQL(operationName: string, response: object, alias?: string): Chainable;
      interceptAuth(endpoint: string, statusCode: number, body: object): Chainable;
      loginByStub(user?: { id?: string; email?: string; subscription?: string; role?: string; primaryCurrency?: string }): Chainable;
    }
  }
}
