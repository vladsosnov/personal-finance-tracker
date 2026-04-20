import { buildSchema } from "graphql";
import { goalResolvers } from "./modules/goals/goal.resolvers";
import { userResolvers } from "./modules/auth/user.resolvers";
import { billingResolvers } from "./modules/billing/billing.resolvers";
import { proposalResolvers } from "./modules/proposals/proposal.resolvers";
import { analyticsResolvers } from "./modules/analytics/analytics.resolvers";
import { exchangeRateResolvers } from "./modules/exchange-rates/exchange-rate.resolvers";

export const schema = buildSchema(`
  enum OperationType {
    INCREASE
    DECREASE
  }

  enum BillingPlan {
    FREE
    PRO
    LIFETIME
  }

  type User {
    id: ID!
    email: String!
    plan: String!
    billingStatus: String!
    subscription: String!
    role: String!
    primaryCurrency: String!
    emailVerified: Boolean!
  }

  input ImportGoalOperationInput {
    type: OperationType!
    amount: Float!
    currency: String
    note: String
    operationDate: String!
  }

  input ImportGoalInput {
    title: String!
    targetAmount: Float!
    initialAmount: Float
    currency: String
    color: String!
    operations: [ImportGoalOperationInput!]!
  }

  type ImportGoalsPayload {
    importedGoalsCount: Int!
    importedOperationsCount: Int!
  }

  type ResetAllDataPayload {
    deletedGoalsCount: Int!
    deletedOperationsCount: Int!
  }

  type BillingCheckoutPayload {
    url: String!
  }

  type BillingPortalPayload {
    url: String!
  }

  type GoalOperation {
    id: ID!
    type: OperationType!
    amount: Float!
    currency: String!
    convertedAmount: Float!
    note: String
    operationDate: String!
    createdAt: String!
  }

  type Goal {
    id: ID!
    title: String!
    targetAmount: Float!
    initialAmount: Float!
    currency: String!
    color: String!
    sortOrder: Int!
    isCompleted: Boolean!
    completedAt: String
    currentAmount: Float!
    progress: Float!
    createdAt: String!
    operations: [GoalOperation!]!
  }

  type ExchangeRates {
    base: String!
    rates: String!
    fetchedAt: String!
  }

  type CurrencyInfo {
    code: String!
    symbol: String!
    name: String!
  }

  enum ProposalCategory {
    BUG
    FEATURE
    TEXT_CHANGE
    OTHER
  }

  enum ProposalStatus {
    OPEN
    IN_REVIEW
    DONE
    REJECTED
  }

  type Proposal {
    id: ID!
    category: ProposalCategory!
    title: String!
    description: String!
    status: ProposalStatus!
    votes: Int!
    hasVoted: Boolean!
    createdAt: String!
  }

  type EventCount {
    event: String!
    count: Int!
  }

  type RecentEvent {
    id: ID!
    event: String!
    userId: String
    createdAt: String!
  }

  type AnalyticsStats {
    eventCounts: [EventCount!]!
    uniqueUserLogins: Int!
    recentEvents: [RecentEvent!]!
  }

  type Query {
    me: User
    goals: [Goal!]!
    goal(id: ID!): Goal
    exportAllData: String!
    proposals: [Proposal!]!
    analyticsStats: AnalyticsStats!
    exchangeRates(base: String!): ExchangeRates!
    supportedCurrencies: [CurrencyInfo!]!
  }

  type Mutation {
    createBillingCheckout(plan: BillingPlan!): BillingCheckoutPayload!
    createBillingPortalSession: BillingPortalPayload!
    createGoal(title: String!, targetAmount: Float!, initialAmount: Float, color: String, currency: String): Goal!
    editGoal(goalId: ID!, title: String!, targetAmount: Float!, initialAmount: Float, color: String!, currency: String): Goal!
    updateGoalColor(goalId: ID!, color: String!): Goal!
    deleteGoal(goalId: ID!): Goal!
    reorderGoals(goalIds: [ID!]!): [Goal!]!
    importGoals(goals: [ImportGoalInput!]!): ImportGoalsPayload!
    resetAllData: ResetAllDataPayload!
    completeGoal(goalId: ID!): Goal!
    updateGoalProgress(goalId: ID!, type: OperationType!, amount: Float!, currency: String, note: String, operationDate: String): Goal!
    editGoalOperation(operationId: ID!, type: OperationType!, amount: Float!, currency: String, note: String, operationDate: String): Goal!
    deleteGoalOperation(operationId: ID!): Goal!
    setPrimaryCurrency(currency: String!): User!
    createProposal(category: ProposalCategory!, title: String!, description: String!, contactEmail: String): Proposal!
    voteProposal(proposalId: ID!): Proposal
    updateProposalStatus(proposalId: ID!, status: ProposalStatus!): Proposal
    deleteProposal(proposalId: ID!): Boolean!
  }
`);

export const rootValue = {
  ...userResolvers,
  ...goalResolvers,
  ...billingResolvers,
  ...proposalResolvers,
  ...analyticsResolvers,
  ...exchangeRateResolvers,
};
