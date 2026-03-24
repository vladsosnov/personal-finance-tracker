import { buildSchema } from "graphql";
import { findUserById } from "./modules/auth/user.repository";
import { bulkCreateGoals, createGoal, deleteAllGoalsByUser, deleteGoal, getGoalById, listGoalsByUser, reorderGoals, updateGoal, updateGoalColor, updateGoalCompletion } from "./modules/goals/goal.repository";
import { bulkCreateGoalOperations, createGoalOperation, deleteAllOperationsByUser, deleteGoalOperation, deleteOperationsByGoal, getGoalOperationById, updateGoalOperation } from "./modules/goals/operation.repository";
import { buildGoalView } from "./modules/goals/goal.service";
import type { OperationType } from "./modules/goals/types";

type Context = {
  userId: string | null;
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

const MAX_GOAL_TITLE_LENGTH = 80;
const MAX_NOTE_LENGTH = 500;
const MAX_IMPORT_GOALS = 200;
const MAX_IMPORT_OPERATIONS_PER_GOAL = 2000;

const ensureAuthed = (context: Context): string => {
  if (!context.userId) {
    throw new Error("Unauthorized");
  }
  return context.userId;
};

const toSafeUser = (user: { id: string; email: string; subscription: string }) => ({
  id: user.id,
  email: user.email,
  subscription: user.subscription,
});

const assertFiniteNonNegative = (value: number, label: string) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} cannot be negative`);
  }
};

const assertValidGoalTitle = (title: string) => {
  if (!title.trim()) {
    throw new Error("Goal title is required");
  }

  if (title.trim().length > MAX_GOAL_TITLE_LENGTH) {
    throw new Error(`Goal title must be at most ${MAX_GOAL_TITLE_LENGTH} characters`);
  }
};

const assertValidNote = (note?: string) => {
  if (note && note.trim().length > MAX_NOTE_LENGTH) {
    throw new Error(`Note must be at most ${MAX_NOTE_LENGTH} characters`);
  }
};

export const schema = buildSchema(`
  enum OperationType {
    INCREASE
    DECREASE
  }

  type User {
    id: ID!
    email: String!
    subscription: String!
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

  type Query {
    me: User
    goals: [Goal!]!
    goal(id: ID!): Goal
    exportAllData: String!
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
  }
`);

const buildGoalViewWithCompletionState = async (userId: string, goal: import("./modules/goals/types").Goal) => {
  const goalView = await buildGoalView(userId, goal);
  const shouldBeCompleted = goalView.targetAmount > 0 && goalView.currentAmount >= goalView.targetAmount;

  if (goal.isCompleted && !shouldBeCompleted) {
    const reopenedGoal = await updateGoalCompletion(userId, goal.id, false);
    if (!reopenedGoal) {
      throw new Error("Goal not found");
    }

    return buildGoalView(userId, reopenedGoal);
  }

  return goalView;
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
    return Promise.all(goals.map((goal) => buildGoalViewWithCompletionState(userId, goal)));
  },
  goal: async ({ id }: GoalLookupArgs, context: Context) => {
    const userId = ensureAuthed(context);
    const goal = await getGoalById(userId, id);
    return goal ? await buildGoalViewWithCompletionState(userId, goal) : null;
  },
  exportAllData: async (_args: unknown, context: Context) => {
    const userId = ensureAuthed(context);
    const goals = await listGoalsByUser(userId);
    const goalViews = await Promise.all(goals.map((goal) => buildGoalViewWithCompletionState(userId, goal)));

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
      }> = [
        {
          date: goal.createdAt,
          value: goal.initialAmount,
        },
      ];

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
        history,
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
    assertFiniteNonNegative(initialAmount, "Initial amount");
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new Error("Goal color must be a valid hex color");
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
    return Promise.all(goals.map((goal) => buildGoalViewWithCompletionState(userId, goal)));
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
};
