import { buildSchema } from "graphql";
import { findUserById } from "./modules/auth/user.repository";
import { getEventCounts, getUniqueUserLogins, getRecentEvents } from "./modules/analytics/analytics.repository";
import { bulkCreateGoals, countGoalsByUser, createGoal, deleteAllGoalsByUser, deleteGoal, getGoalById, listGoalsByUser, reorderGoals, updateGoal, updateGoalColor, updateGoalCompletion } from "./modules/goals/goal.repository";
import { bulkCreateGoalOperations, createGoalOperation, deleteAllOperationsByUser, deleteGoalOperation, deleteOperationsByGoal, getGoalOperationById, updateGoalOperation } from "./modules/goals/operation.repository";
import { buildGoalView, buildGoalViews } from "./modules/goals/goal.service";
import { createProposal, listProposals, voteProposal, updateProposalStatus } from "./modules/proposals/proposal.repository";
import type { OperationType } from "./modules/goals/types";
import type { UserRole } from "./modules/auth/types";
import {
  ensureAuthed,
  ensureAdmin,
  toSafeUser,
  assertFiniteNonNegative,
  assertValidGoalTitle,
  assertValidNote,
  getEffectiveSubscription,
  getMaxGoals,
} from "./utils/validation";

type Context = {
  userId: string | null;
  userRole: UserRole;
  tokenVersion: number;
  clientIp: string;
};

type GoalArgs = {
  title: string;
  targetAmount: number;
  initialAmount?: number;
  color?: string;
};

type GoalOperationArgs = {
  goalId: string;
  type: OperationType;
  amount: number;
  note?: string;
  operationDate?: string;
};

type EditGoalOperationArgs = {
  operationId: string;
  type: OperationType;
  amount: number;
  note?: string;
  operationDate?: string;
};

type DeleteGoalOperationArgs = {
  operationId: string;
};

type GoalLookupArgs = {
  id: string;
};

type ReorderGoalsArgs = {
  goalIds: string[];
};

type UpdateGoalColorArgs = {
  goalId: string;
  color: string;
};

type DeleteGoalArgs = {
  goalId: string;
};

type CompleteGoalArgs = {
  goalId: string;
};

type EditGoalArgs = {
  goalId: string;
  title: string;
  targetAmount: number;
  initialAmount?: number;
  color: string;
};

type ImportGoalOperationInput = {
  type: OperationType;
  amount: number;
  note?: string;
  operationDate: string;
};

type ImportGoalInput = {
  title: string;
  targetAmount: number;
  initialAmount?: number;
  color: string;
  operations: ImportGoalOperationInput[];
};

type ImportGoalsArgs = {
  goals: ImportGoalInput[];
};

const MAX_IMPORT_GOALS = 200;
const MAX_IMPORT_OPERATIONS_PER_GOAL = 2000;

export const schema = buildSchema(`
  enum OperationType {
    INCREASE
    DECREASE
  }

  type User {
    id: ID!
    email: String!
    subscription: String!
    role: String!
    emailVerified: Boolean!
  }

  input ImportGoalOperationInput {
    type: OperationType!
    amount: Float!
    note: String
    operationDate: String!
  }

  input ImportGoalInput {
    title: String!
    targetAmount: Float!
    initialAmount: Float
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

  type GoalOperation {
    id: ID!
    type: OperationType!
    amount: Float!
    note: String
    operationDate: String!
    createdAt: String!
  }

  type Goal {
    id: ID!
    title: String!
    targetAmount: Float!
    initialAmount: Float!
    color: String!
    sortOrder: Int!
    isCompleted: Boolean!
    completedAt: String
    currentAmount: Float!
    progress: Float!
    createdAt: String!
    operations: [GoalOperation!]!
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
  }

  type Mutation {
    createGoal(title: String!, targetAmount: Float!, initialAmount: Float, color: String): Goal!
    editGoal(goalId: ID!, title: String!, targetAmount: Float!, initialAmount: Float, color: String!): Goal!
    updateGoalColor(goalId: ID!, color: String!): Goal!
    deleteGoal(goalId: ID!): Goal!
    reorderGoals(goalIds: [ID!]!): [Goal!]!
    importGoals(goals: [ImportGoalInput!]!): ImportGoalsPayload!
    resetAllData: ResetAllDataPayload!
    completeGoal(goalId: ID!): Goal!
    updateGoalProgress(goalId: ID!, type: OperationType!, amount: Float!, note: String, operationDate: String): Goal!
    editGoalOperation(operationId: ID!, type: OperationType!, amount: Float!, note: String, operationDate: String): Goal!
    deleteGoalOperation(operationId: ID!): Goal!
    createProposal(category: ProposalCategory!, title: String!, description: String!, contactEmail: String): Proposal!
    voteProposal(proposalId: ID!): Proposal
    updateProposalStatus(proposalId: ID!, status: ProposalStatus!): Proposal
  }
`);

const applyCompletionState = async (userId: string, goalView: import("./modules/goals/types").GoalView) => {
  const shouldBeCompleted = goalView.targetAmount > 0 && goalView.currentAmount >= goalView.targetAmount;

  if (goalView.isCompleted && !shouldBeCompleted) {
    const reopenedGoal = await updateGoalCompletion(userId, goalView.id, false);
    if (!reopenedGoal) {
      throw new Error("Goal not found");
    }
    return buildGoalView(userId, reopenedGoal);
  }

  return goalView;
};

const buildGoalViewWithCompletionState = async (userId: string, goal: import("./modules/goals/types").Goal) => {
  const goalView = await buildGoalView(userId, goal);
  return applyCompletionState(userId, goalView);
};

export const rootValue = {
  me: async (_args: unknown, context: Context) => {
    const userId = context.userId;
    if (!userId) {
      return null;
    }

    const user = await findUserById(userId);
    return user ? toSafeUser(user) : null;
  },
  goals: async (_args: unknown, context: Context) => {
    const userId = ensureAuthed(context);
    const goals = await listGoalsByUser(userId);
    const views = await buildGoalViews(userId, goals);
    return Promise.all(views.map((view) => applyCompletionState(userId, view)));
  },
  goal: async ({ id }: GoalLookupArgs, context: Context) => {
    const userId = ensureAuthed(context);
    const goal = await getGoalById(userId, id);
    return goal ? await buildGoalViewWithCompletionState(userId, goal) : null;
  },
  exportAllData: async (_args: unknown, context: Context) => {
    const userId = ensureAuthed(context);
    const goals = await listGoalsByUser(userId);
    const batchViews = await buildGoalViews(userId, goals);
    const goalViews = await Promise.all(batchViews.map((view) => applyCompletionState(userId, view)));

    const exportPayload = goalViews.map((goal) => {
      const sortedOperations = [...goal.operations].sort((left, right) => {
        const leftTimestamp = `${left.operationDate}T00:00:00.000Z`;
        const rightTimestamp = `${right.operationDate}T00:00:00.000Z`;

        if (leftTimestamp === rightTimestamp) {
          return left.createdAt.localeCompare(right.createdAt);
        }

        return leftTimestamp.localeCompare(rightTimestamp);
      });

      let runningValue = goal.initialAmount;
      const history: Array<{
        date: string;
        value: number;
        note?: string;
      }> = [];

      for (const operation of sortedOperations) {
        runningValue += operation.type === "INCREASE" ? operation.amount : -operation.amount;
        history.push({
          date: `${operation.operationDate}T00:00:00.000Z`,
          note: operation.note,
          value: Number(runningValue.toFixed(2)),
        });
      }

      return {
        createdDate: goal.createdAt,
        title: goal.title,
        targetValue: goal.targetAmount,
        initialValue: goal.initialAmount,
        sortOrder: goal.sortOrder,
        isCompleted: goal.isCompleted,
        completedAt: goal.completedAt ?? null,
        history,
        operations: sortedOperations.map((op) => ({
          type: op.type,
          amount: op.amount,
          note: op.note ?? null,
          operationDate: op.operationDate,
          createdAt: op.createdAt,
        })),
        display: {
          bar: {
            colors: {
              primary: goal.color,
            },
          },
        },
      };
    });

    return JSON.stringify(exportPayload, null, 2);
  },
  createGoal: async ({ title, targetAmount, initialAmount = 0, color = "#0F766E" }: GoalArgs, context: Context) => {
    const userId = ensureAuthed(context);
    assertValidGoalTitle(title);
    assertFiniteNonNegative(targetAmount, "Target amount");
    const newLocal = "Initial amount";
    assertFiniteNonNegative(initialAmount, newLocal);
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new Error("Goal color must be a valid hex color");
    }

    const user = await findUserById(userId);
    const maxGoals = getMaxGoals(getEffectiveSubscription(user));
    if (maxGoals !== null) {
      const currentCount = await countGoalsByUser(userId);
      if (currentCount >= maxGoals) {
        throw new Error(`Free plan is limited to ${maxGoals} goals. Upgrade to create more.`);
      }
    }

    const goal = await createGoal(userId, title.trim(), targetAmount, initialAmount, color);
    return buildGoalViewWithCompletionState(userId, goal);
  },
  editGoal: async ({ goalId, title, targetAmount, initialAmount = 0, color }: EditGoalArgs, context: Context) => {
    const userId = ensureAuthed(context);
    assertValidGoalTitle(title);
    assertFiniteNonNegative(targetAmount, "Target amount");
    assertFiniteNonNegative(initialAmount, "Initial amount");
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new Error("Goal color must be a valid hex color");
    }

    const goal = await updateGoal(userId, goalId, {
      title: title.trim(),
      targetAmount,
      initialAmount,
      color,
    });
    if (!goal) {
      throw new Error("Goal not found");
    }

    return buildGoalViewWithCompletionState(userId, goal);
  },
  updateGoalColor: async ({ goalId, color }: UpdateGoalColorArgs, context: Context) => {
    const userId = ensureAuthed(context);
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new Error("Goal color must be a valid hex color");
    }

    const goal = await updateGoalColor(userId, goalId, color);
    if (!goal) {
      throw new Error("Goal not found");
    }

    return buildGoalViewWithCompletionState(userId, goal);
  },
  deleteGoal: async ({ goalId }: DeleteGoalArgs, context: Context) => {
    const userId = ensureAuthed(context);
    const goal = await getGoalById(userId, goalId);
    if (!goal) {
      throw new Error("Goal not found");
    }

    await deleteOperationsByGoal(userId, goalId);
    const deletedGoal = await deleteGoal(userId, goalId);
    if (!deletedGoal) {
      throw new Error("Goal not found");
    }

    return buildGoalViewWithCompletionState(userId, goal);
  },
  reorderGoals: async ({ goalIds }: ReorderGoalsArgs, context: Context) => {
    const userId = ensureAuthed(context);
    await reorderGoals(userId, goalIds);
    const goals = await listGoalsByUser(userId);
    const views = await buildGoalViews(userId, goals);
    return Promise.all(views.map((view) => applyCompletionState(userId, view)));
  },
  importGoals: async ({ goals }: ImportGoalsArgs, context: Context) => {
    const userId = ensureAuthed(context);
    if (!goals.length) {
      return {
        importedGoalsCount: 0,
        importedOperationsCount: 0,
      };
    }

    if (goals.length > MAX_IMPORT_GOALS) {
      throw new Error(`Import is limited to ${MAX_IMPORT_GOALS} goals at a time`);
    }

    const user = await findUserById(userId);
    const maxGoals = getMaxGoals(getEffectiveSubscription(user));
    if (maxGoals !== null) {
      const currentCount = await countGoalsByUser(userId);
      const available = maxGoals - currentCount;
      if (available <= 0) {
        throw new Error(`Free plan is limited to ${maxGoals} goals. Upgrade to import more.`);
      }
      if (goals.length > available) {
        throw new Error(`Free plan is limited to ${maxGoals} goals. You can import ${available} more goal${available === 1 ? "" : "s"}.`);
      }
    }

    for (const goal of goals) {
      assertValidGoalTitle(goal.title);
      assertFiniteNonNegative(goal.targetAmount, "Target amount");
      assertFiniteNonNegative(goal.initialAmount ?? 0, "Initial amount");
      if (!/^#[0-9A-Fa-f]{6}$/.test(goal.color)) {
        throw new Error("Goal color must be a valid hex color");
      }
      if (goal.operations.length > MAX_IMPORT_OPERATIONS_PER_GOAL) {
        throw new Error(`Each goal import is limited to ${MAX_IMPORT_OPERATIONS_PER_GOAL} operations`);
      }

      for (const operation of goal.operations) {
        if (!Number.isFinite(operation.amount) || operation.amount <= 0) {
          throw new Error("Operation amount should be greater than 0");
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(operation.operationDate)) {
          throw new Error("Operation date must use YYYY-MM-DD format");
        }
        assertValidNote(operation.note);
      }
    }

    const createdGoals = await bulkCreateGoals(
      userId,
      goals.map((goal) => ({
        title: goal.title.trim(),
        targetAmount: goal.targetAmount,
        initialAmount: goal.initialAmount ?? 0,
        color: goal.color,
      }))
    );

    const operations = goals.flatMap((goal, index) =>
      goal.operations.map((operation) => ({
        userId,
        goalId: createdGoals[index].id,
        type: operation.type,
        amount: operation.amount,
        note: operation.note?.trim() || undefined,
        operationDate: operation.operationDate,
      }))
    );

    await bulkCreateGoalOperations(operations);

    return {
      importedGoalsCount: createdGoals.length,
      importedOperationsCount: operations.length,
    };
  },
  resetAllData: async (_args: unknown, context: Context) => {
    const userId = ensureAuthed(context);
    const deletedOperationsCount = await deleteAllOperationsByUser(userId);
    const deletedGoalsCount = await deleteAllGoalsByUser(userId);

    return {
      deletedGoalsCount,
      deletedOperationsCount,
    };
  },
  completeGoal: async ({ goalId }: CompleteGoalArgs, context: Context) => {
    const userId = ensureAuthed(context);
    const goal = await getGoalById(userId, goalId);
    if (!goal) {
      throw new Error("Goal not found");
    }

    const goalView = await buildGoalView(userId, goal);
    if (goalView.targetAmount <= 0 || goalView.currentAmount < goalView.targetAmount) {
      throw new Error("Goal is not ready to be completed");
    }

    const completedGoal = await updateGoalCompletion(userId, goalId, true, new Date().toISOString());
    if (!completedGoal) {
      throw new Error("Goal not found");
    }

    return buildGoalViewWithCompletionState(userId, completedGoal);
  },
  updateGoalProgress: async ({ goalId, type, amount, note, operationDate }: GoalOperationArgs, context: Context) => {
    const userId = ensureAuthed(context);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Amount should be greater than 0");
    }
    if (operationDate && !/^\d{4}-\d{2}-\d{2}$/.test(operationDate)) {
      throw new Error("Operation date must be in YYYY-MM-DD format");
    }
    assertValidNote(note);

    const goal = await getGoalById(userId, goalId);
    if (!goal) {
      throw new Error("Goal not found");
    }

    await createGoalOperation(userId, goalId, type, amount, note?.trim(), operationDate);
    return buildGoalViewWithCompletionState(userId, goal);
  },
  editGoalOperation: async ({ operationId, type, amount, note, operationDate }: EditGoalOperationArgs, context: Context) => {
    const userId = ensureAuthed(context);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Amount should be greater than 0");
    }
    if (operationDate && !/^\d{4}-\d{2}-\d{2}$/.test(operationDate)) {
      throw new Error("Operation date must be in YYYY-MM-DD format");
    }
    assertValidNote(note);

    const operation = await getGoalOperationById(userId, operationId);
    if (!operation) {
      throw new Error("Operation not found");
    }

    const updatedOperation = await updateGoalOperation(userId, operationId, {
      type,
      amount,
      note: note?.trim(),
      operationDate,
    });
    if (!updatedOperation) {
      throw new Error("Operation not found");
    }

    const goal = await getGoalById(userId, updatedOperation.goalId);
    if (!goal) {
      throw new Error("Goal not found");
    }

    return buildGoalViewWithCompletionState(userId, goal);
  },
  deleteGoalOperation: async ({ operationId }: DeleteGoalOperationArgs, context: Context) => {
    const userId = ensureAuthed(context);

    const operation = await getGoalOperationById(userId, operationId);
    if (!operation) {
      throw new Error("Operation not found");
    }

    const deletedOperation = await deleteGoalOperation(userId, operationId);
    if (!deletedOperation) {
      throw new Error("Operation not found");
    }

    const goal = await getGoalById(userId, deletedOperation.goalId);
    if (!goal) {
      throw new Error("Goal not found");
    }

    return buildGoalViewWithCompletionState(userId, goal);
  },
  analyticsStats: async (_args: unknown, context: Context) => {
    await ensureAdmin(context);
    const [eventCounts, uniqueUserLogins, recentEvents] = await Promise.all([
      getEventCounts(),
      getUniqueUserLogins(),
      getRecentEvents(100),
    ]);
    return { eventCounts, uniqueUserLogins, recentEvents };
  },
  proposals: async (_args: unknown, context: Context) => {
    const all = await listProposals();
    return all.map((p) => ({
      id: p.id,
      category: p.category.toUpperCase(),
      title: p.title,
      description: p.description,
      status: p.status.toUpperCase(),
      votes: p.votes,
      hasVoted: p.voterIps.includes(context.clientIp),
      createdAt: p.createdAt,
    }));
  },
  createProposal: async (
    { category, title, description, contactEmail }: { category: string; title: string; description: string; contactEmail?: string },
    context: Context
  ) => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) throw new Error("Title is required");
    if (trimmedTitle.length > 200) throw new Error("Title must be at most 200 characters");
    if (!trimmedDescription) throw new Error("Description is required");
    if (trimmedDescription.length > 2000) throw new Error("Description must be at most 2000 characters");

    if (contactEmail) {
      const email = contactEmail.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email address");
      }
    }

    const categoryMap: Record<string, "bug" | "feature" | "text_change" | "other"> = {
      BUG: "bug",
      FEATURE: "feature",
      TEXT_CHANGE: "text_change",
      OTHER: "other",
    };

    const mappedCategory = categoryMap[category];
    if (!mappedCategory) throw new Error("Invalid category");

    const proposal = await createProposal({
      category: mappedCategory,
      title: trimmedTitle,
      description: trimmedDescription,
      contactEmail: contactEmail?.trim() || undefined,
      submitterIp: context.clientIp,
    });

    return {
      id: proposal.id,
      category: proposal.category.toUpperCase(),
      title: proposal.title,
      description: proposal.description,
      status: proposal.status.toUpperCase(),
      votes: proposal.votes,
      hasVoted: false,
      createdAt: proposal.createdAt,
    };
  },
  voteProposal: async ({ proposalId }: { proposalId: string }, context: Context) => {
    const proposal = await voteProposal(proposalId, context.clientIp);
    if (!proposal) return null;

    return {
      id: proposal.id,
      category: proposal.category.toUpperCase(),
      title: proposal.title,
      description: proposal.description,
      status: proposal.status.toUpperCase(),
      votes: proposal.votes,
      hasVoted: true,
      createdAt: proposal.createdAt,
    };
  },
  updateProposalStatus: async ({ proposalId, status }: { proposalId: string; status: string }, context: Context) => {
    ensureAdmin(context);

    const statusMap: Record<string, "open" | "in_review" | "done" | "rejected"> = {
      OPEN: "open",
      IN_REVIEW: "in_review",
      DONE: "done",
      REJECTED: "rejected",
    };

    const mappedStatus = statusMap[status];
    if (!mappedStatus) throw new Error("Invalid status");

    const proposal = await updateProposalStatus(proposalId, mappedStatus);
    if (!proposal) throw new Error("Proposal not found");

    return {
      id: proposal.id,
      category: proposal.category.toUpperCase(),
      title: proposal.title,
      description: proposal.description,
      status: proposal.status.toUpperCase(),
      votes: proposal.votes,
      hasVoted: proposal.voterIps.includes(context.clientIp),
      createdAt: proposal.createdAt,
    };
  },
};
