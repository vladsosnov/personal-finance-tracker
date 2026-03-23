import { buildSchema } from "graphql";
import { hashPassword, signJwt, verifyPassword } from "./auth";
import { createUser, findUserByEmail, findUserById } from "./modules/auth/user.repository";
import { createGoal, deleteGoal, getGoalById, listGoalsByUser, reorderGoals, updateGoalColor } from "./modules/goals/goal.repository";
import { createGoalOperation, deleteGoalOperation, deleteOperationsByGoal, getGoalOperationById, updateGoalOperation } from "./modules/goals/operation.repository";
import { buildGoalView } from "./modules/goals/goal.service";
import type { OperationType } from "./modules/goals/types";

type Context = {
  userId: string | null;
};

type RegisterArgs = {
  email: string;
  password: string;
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

const ensureAuthed = (context: Context): string => {
  if (!context.userId) {
    throw new Error("Unauthorized");
  }
  return context.userId;
};

const toSafeUser = (user: { id: string; email: string }) => ({
  id: user.id,
  email: user.email,
});

export const schema = buildSchema(`
  enum OperationType {
    INCREASE
    DECREASE
  }

  type User {
    id: ID!
    email: String!
  }

  type AuthPayload {
    token: String!
    user: User!
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
    currentAmount: Float!
    progress: Float!
    createdAt: String!
    operations: [GoalOperation!]!
  }

  type Query {
    me: User
    goals: [Goal!]!
    goal(id: ID!): Goal
  }

  type Mutation {
    register(email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createGoal(title: String!, targetAmount: Float!, initialAmount: Float, color: String): Goal!
    updateGoalColor(goalId: ID!, color: String!): Goal!
    deleteGoal(goalId: ID!): Goal!
    reorderGoals(goalIds: [ID!]!): [Goal!]!
    updateGoalProgress(goalId: ID!, type: OperationType!, amount: Float!, note: String, operationDate: String): Goal!
    editGoalOperation(operationId: ID!, type: OperationType!, amount: Float!, note: String, operationDate: String): Goal!
    deleteGoalOperation(operationId: ID!): Goal!
  }
`);

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
    return Promise.all(goals.map((goal) => buildGoalView(userId, goal)));
  },
  goal: async ({ id }: GoalLookupArgs, context: Context) => {
    const userId = ensureAuthed(context);
    const goal = await getGoalById(userId, id);
    return goal ? await buildGoalView(userId, goal) : null;
  },
  register: async ({ email, password }: RegisterArgs) => {
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    if (await findUserByEmail(email)) {
      throw new Error("Email already exists");
    }

    const { hash, salt } = hashPassword(password);
    const user = await createUser(email, hash, salt);
    const token = signJwt(user.id);
    return {
      token,
      user: toSafeUser(user),
    };
  },
  login: async ({ email, password }: RegisterArgs) => {
    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
      throw new Error("Invalid credentials");
    }

    const token = signJwt(user.id);
    return {
      token,
      user: toSafeUser(user),
    };
  },
  createGoal: async ({ title, targetAmount, initialAmount = 0, color = "#0F766E" }: GoalArgs, context: Context) => {
    const userId = ensureAuthed(context);
    if (targetAmount <= 0) {
      throw new Error("Target amount should be greater than 0");
    }
    if (initialAmount < 0) {
      throw new Error("Initial amount cannot be negative");
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new Error("Goal color must be a valid hex color");
    }

    const goal = await createGoal(userId, title.trim(), targetAmount, initialAmount, color);
    return buildGoalView(userId, goal);
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

    return buildGoalView(userId, goal);
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

    return buildGoalView(userId, goal);
  },
  reorderGoals: async ({ goalIds }: ReorderGoalsArgs, context: Context) => {
    const userId = ensureAuthed(context);
    await reorderGoals(userId, goalIds);
    const goals = await listGoalsByUser(userId);
    return Promise.all(goals.map((goal) => buildGoalView(userId, goal)));
  },
  updateGoalProgress: async ({ goalId, type, amount, note, operationDate }: GoalOperationArgs, context: Context) => {
    const userId = ensureAuthed(context);
    if (amount <= 0) {
      throw new Error("Amount should be greater than 0");
    }
    if (operationDate && !/^\d{4}-\d{2}-\d{2}$/.test(operationDate)) {
      throw new Error("Operation date must be in YYYY-MM-DD format");
    }

    const goal = await getGoalById(userId, goalId);
    if (!goal) {
      throw new Error("Goal not found");
    }

    await createGoalOperation(userId, goalId, type, amount, note?.trim(), operationDate);
    return buildGoalView(userId, goal);
  },
  editGoalOperation: async ({ operationId, type, amount, note, operationDate }: EditGoalOperationArgs, context: Context) => {
    const userId = ensureAuthed(context);
    if (amount <= 0) {
      throw new Error("Amount should be greater than 0");
    }
    if (operationDate && !/^\d{4}-\d{2}-\d{2}$/.test(operationDate)) {
      throw new Error("Operation date must be in YYYY-MM-DD format");
    }

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

    return buildGoalView(userId, goal);
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

    return buildGoalView(userId, goal);
  },
};
