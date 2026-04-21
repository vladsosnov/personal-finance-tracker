import { findUserById } from "../auth/user.repository";
import {
  bulkCreateGoals,
  countGoalsByUser,
  createGoal,
  deleteAllGoalsByUser,
  deleteGoal,
  getGoalById,
  listGoalsByUser,
  reorderGoals,
  updateGoal,
  updateGoalColor,
  updateGoalCompletion,
} from "./goal.repository";
import {
  bulkCreateGoalOperations,
  createGoalOperation,
  deleteAllOperationsByUser,
  deleteGoalOperation,
  deleteOperationsByGoal,
  getGoalOperationById,
  updateGoalOperation,
} from "./operation.repository";
import { buildGoalView, buildGoalViews } from "./goal.service";
import type { OperationType, Goal, GoalView } from "./types";
import {
  ensureAuthed,
  assertFiniteNonNegative,
  assertValidGoalTitle,
  assertValidNote,
  assertValidCurrency,
  getEffectivePlan,
  getMaxGoals,
} from "../../utils/validation";
import { assertValidObjectId } from "../../utils/object-id";

type Context = {
  userId: string | null;
  userRole: "user" | "admin";
  tokenVersion: number;
  clientIp: string;
};

type GoalArgs = {
  title: string;
  targetAmount: number;
  initialAmount?: number;
  color?: string;
  currency?: string;
};

type GoalOperationArgs = {
  goalId: string;
  type: OperationType;
  amount: number;
  currency?: string;
  note?: string;
  operationDate?: string;
};

type GoalOperationInput = {
  type: OperationType;
  amount: number;
  currency?: string;
  note?: string;
  operationDate: string;
};

type AddGoalOperationsArgs = {
  goalId: string;
  operations: GoalOperationInput[];
};

type EditGoalOperationArgs = {
  operationId: string;
  type: OperationType;
  amount: number;
  currency?: string;
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
  currency?: string;
};

type ImportGoalOperationInput = {
  type: OperationType;
  amount: number;
  currency?: string;
  note?: string;
  operationDate: string;
};

type ImportGoalInput = {
  title: string;
  targetAmount: number;
  initialAmount?: number;
  currency?: string;
  color: string;
  operations: ImportGoalOperationInput[];
};

type ImportGoalsArgs = {
  goals: ImportGoalInput[];
};

const MAX_IMPORT_GOALS = 200;
const MAX_IMPORT_OPERATIONS_PER_GOAL = 2000;

const applyCompletionState = async (userId: string, goalView: GoalView) => {
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

const buildGoalViewWithCompletionState = async (userId: string, goal: Goal) => {
  const goalView = await buildGoalView(userId, goal);
  return applyCompletionState(userId, goalView);
};

const assertValidOperationInput = (operation: GoalOperationInput) => {
  if (!Number.isFinite(operation.amount) || operation.amount <= 0) {
    throw new Error("Amount should be greater than 0");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(operation.operationDate)) {
    throw new Error("Operation date must be in YYYY-MM-DD format");
  }
  assertValidNote(operation.note);
};

export const goalResolvers = {
  goals: async (_args: unknown, context: Context) => {
    const userId = ensureAuthed(context);
    const goals = await listGoalsByUser(userId);
    const views = await buildGoalViews(userId, goals);
    return Promise.all(views.map((view) => applyCompletionState(userId, view)));
  },
  goal: async ({ id }: GoalLookupArgs, context: Context) => {
    const userId = ensureAuthed(context);
    assertValidObjectId(id, "goal ID");
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
        runningValue += operation.type === "INCREASE" ? operation.convertedAmount : -operation.convertedAmount;
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
        currency: goal.currency,
        sortOrder: goal.sortOrder,
        isCompleted: goal.isCompleted,
        completedAt: goal.completedAt ?? null,
        history,
        operations: sortedOperations.map((op) => ({
          type: op.type,
          amount: op.amount,
          currency: op.currency,
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
  createGoal: async ({ title, targetAmount, initialAmount = 0, color = "#0F766E", currency }: GoalArgs, context: Context) => {
    const userId = ensureAuthed(context);
    assertValidGoalTitle(title);
    assertFiniteNonNegative(targetAmount, "Target amount");
    assertFiniteNonNegative(initialAmount, "Initial amount");
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new Error("Goal color must be a valid hex color");
    }

    const user = await findUserById(userId);
    const goalCurrency = currency ?? user?.primaryCurrency ?? "USD";
    assertValidCurrency(goalCurrency);

    const maxGoals = getMaxGoals(getEffectivePlan(user));
    if (maxGoals !== null) {
      const currentCount = await countGoalsByUser(userId);
      if (currentCount >= maxGoals) {
        throw new Error(`Free plan is limited to ${maxGoals} goals. Upgrade to create more.`);
      }
    }

    const goal = await createGoal(userId, title.trim(), targetAmount, initialAmount, color, goalCurrency);
    return buildGoalViewWithCompletionState(userId, goal);
  },
  editGoal: async ({ goalId, title, targetAmount, initialAmount = 0, color, currency }: EditGoalArgs, context: Context) => {
    const userId = ensureAuthed(context);
    assertValidObjectId(goalId, "goal ID");
    assertValidGoalTitle(title);
    assertFiniteNonNegative(targetAmount, "Target amount");
    assertFiniteNonNegative(initialAmount, "Initial amount");
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new Error("Goal color must be a valid hex color");
    }

    const existingGoal = await getGoalById(userId, goalId);
    if (!existingGoal) {
      throw new Error("Goal not found");
    }
    const goalCurrency = currency ?? existingGoal.currency;
    assertValidCurrency(goalCurrency);

    const goal = await updateGoal(userId, goalId, {
      title: title.trim(),
      targetAmount,
      initialAmount,
      color,
      currency: goalCurrency,
    });
    if (!goal) {
      throw new Error("Goal not found");
    }

    return buildGoalViewWithCompletionState(userId, goal);
  },
  updateGoalColor: async ({ goalId, color }: UpdateGoalColorArgs, context: Context) => {
    const userId = ensureAuthed(context);
    assertValidObjectId(goalId, "goal ID");
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
    assertValidObjectId(goalId, "goal ID");
    const goal = await getGoalById(userId, goalId);
    if (!goal) {
      throw new Error("Goal not found");
    }

    // Build the view before deletion so we return meaningful data
    const goalView = await buildGoalView(userId, goal);
    const deletedGoal = await deleteGoal(userId, goalId);
    if (!deletedGoal) {
      throw new Error("Goal not found");
    }
    // Delete operations after the goal to avoid orphaned goals (operations are harmless orphans)
    await deleteOperationsByGoal(userId, goalId);

    return goalView;
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
    const maxGoals = getMaxGoals(getEffectivePlan(user));
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
        currency: goal.currency ?? "USD",
        color: goal.color,
      }))
    );

    const operations = goals.flatMap((goal, index) =>
      goal.operations.map((operation) => ({
        userId,
        goalId: createdGoals[index].id,
        type: operation.type,
        amount: operation.amount,
        currency: operation.currency ?? goal.currency ?? "USD",
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
    const deletedGoalsCount = await deleteAllGoalsByUser(userId);
    const deletedOperationsCount = await deleteAllOperationsByUser(userId);

    return {
      deletedGoalsCount,
      deletedOperationsCount,
    };
  },
  completeGoal: async ({ goalId }: CompleteGoalArgs, context: Context) => {
    const userId = ensureAuthed(context);
    assertValidObjectId(goalId, "goal ID");
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
  addGoalOperations: async ({ goalId, operations }: AddGoalOperationsArgs, context: Context) => {
    const userId = ensureAuthed(context);
    assertValidObjectId(goalId, "goal ID");

    if (!operations.length) {
      throw new Error("At least one operation is required");
    }

    const goal = await getGoalById(userId, goalId);
    if (!goal) {
      throw new Error("Goal not found");
    }

    const preparedOperations = operations.map((operation) => {
      assertValidOperationInput(operation);
      const opCurrency = operation.currency ?? goal.currency;
      assertValidCurrency(opCurrency);

      return {
        userId,
        goalId,
        type: operation.type,
        amount: operation.amount,
        currency: opCurrency,
        note: operation.note?.trim() || undefined,
        operationDate: operation.operationDate,
      };
    });

    await bulkCreateGoalOperations(preparedOperations);
    return buildGoalViewWithCompletionState(userId, goal);
  },
  updateGoalProgress: async ({ goalId, type, amount, currency, note, operationDate }: GoalOperationArgs, context: Context) => {
    const userId = ensureAuthed(context);
    assertValidObjectId(goalId, "goal ID");
    assertValidOperationInput({
      type,
      amount,
      currency,
      note,
      operationDate: operationDate ?? new Date().toISOString().slice(0, 10),
    });

    const goal = await getGoalById(userId, goalId);
    if (!goal) {
      throw new Error("Goal not found");
    }

    const opCurrency = currency ?? goal.currency;
    assertValidCurrency(opCurrency);

    await createGoalOperation(userId, goalId, type, amount, note?.trim(), operationDate, opCurrency);
    return buildGoalViewWithCompletionState(userId, goal);
  },
  editGoalOperation: async ({ operationId, type, amount, currency, note, operationDate }: EditGoalOperationArgs, context: Context) => {
    const userId = ensureAuthed(context);
    assertValidObjectId(operationId, "operation ID");
    assertValidOperationInput({
      type,
      amount,
      currency,
      note,
      operationDate: operationDate ?? new Date().toISOString().slice(0, 10),
    });

    const operation = await getGoalOperationById(userId, operationId);
    if (!operation) {
      throw new Error("Operation not found");
    }

    const opCurrency = currency ?? operation.currency;
    assertValidCurrency(opCurrency);

    const updatedOperation = await updateGoalOperation(userId, operationId, {
      type,
      amount,
      currency: opCurrency,
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
    assertValidObjectId(operationId, "operation ID");

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
