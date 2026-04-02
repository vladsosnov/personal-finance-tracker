export {};
const API_URL = "http://localhost:4000";

const mockProposals = [
  {
    id: "p-1",
    category: "FEATURE",
    title: "Add dark mode",
    description: "Please add dark mode support",
    status: "OPEN",
    votes: 5,
    hasVoted: false,
    createdAt: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "p-2",
    category: "BUG",
    title: "Fix login issue",
    description: "Login button not working on mobile",
    status: "IN_REVIEW",
    votes: 12,
    hasVoted: true,
    createdAt: "2024-02-01T00:00:00.000Z",
  },
];

function stubFeedbackGraphQL(proposals = mockProposals) {
  cy.intercept("POST", `${API_URL}/graphql`, (req) => {
    const query = req.body.query ?? "";
    if (query.includes("query Me")) {
      req.reply({
        body: {
          data: { me: { id: "user-1", email: "test@example.com", subscription: "Free", role: "user", emailVerified: true } },
        },
      });
    } else if (query.includes("proposals")) {
      req.reply({ body: { data: { proposals } } });
    } else if (query.includes("mutation CreateProposal")) {
      const newProposal = {
        id: "p-new",
        category: req.body.variables?.category ?? "FEATURE",
        title: req.body.variables?.title ?? "New Proposal",
        description: req.body.variables?.description ?? "",
        status: "OPEN",
        votes: 0,
        hasVoted: false,
        createdAt: new Date().toISOString(),
      };
      req.reply({ body: { data: { createProposal: newProposal } } });
    } else if (query.includes("mutation VoteProposal")) {
      const voted = { ...proposals[0], votes: proposals[0].votes + 1, hasVoted: true };
      req.reply({ body: { data: { voteProposal: voted } } });
    } else {
      req.reply({ body: { data: {} } });
    }
  }).as("graphql");
}

describe("Feedback Page", () => {
  beforeEach(() => {
    stubFeedbackGraphQL();
    cy.visit("/feedback");
  });

  it("renders the feedback page header", () => {
    cy.contains("Feedback").should("be.visible");
    cy.contains(/report bugs|suggest features/i).should("be.visible");
  });

  it("displays proposals list", () => {
    cy.contains("Add dark mode").should("be.visible");
    cy.contains("Fix login issue").should("be.visible");
  });

  it("shows vote counts", () => {
    cy.contains("5").should("exist");
    cy.contains("12").should("exist");
  });

  describe("Filters and Sorting", () => {
    it("has category filter", () => {
      cy.get("[aria-label='Filter by category']").should("exist");
    });

    it("has status filter", () => {
      cy.get("[aria-label='Filter by status']").should("exist");
    });

    it("has sort control", () => {
      cy.get("[aria-label='Sort proposals']").should("exist");
      cy.contains("Newest").should("be.visible");
      cy.contains("Most voted").should("be.visible");
    });

    it("switches sort to most voted", () => {
      cy.contains("Most voted").click();
      // Fix login issue (12 votes) should appear before Add dark mode (5 votes)
      cy.get("table tbody tr").first().should("contain.text", "Fix login issue");
    });
  });

  describe("Submit Feedback", () => {
    it("opens the create proposal modal", () => {
      cy.contains("button", "Submit feedback").click();

      cy.get("[role='dialog']").should("be.visible");
      cy.get("[role='dialog']").within(() => {
        cy.contains(/title/i).should("exist");
        cy.contains(/description/i).should("exist");
      });
    });

    it("submits a new proposal", () => {
      cy.contains("button", "Submit feedback").click();

      cy.get("[role='dialog']").within(() => {
        cy.get("input[placeholder='Brief summary of your feedback']").type("Better charts");
        cy.get("textarea").type("Please add more chart types");
        cy.contains("button", /submit/i).click();
      });

      cy.wait("@graphql");
    });
  });

  describe("Voting", () => {
    it("shows vote buttons on proposals", () => {
      cy.get("table").should("exist");
    });
  });
});
