import { buildSchema } from "graphql";
import { hashPassword, signJwt, verifyPassword } from "./auth";
import { createUser, findUserByEmail, findUserById } from "./modules/auth/user.repository";
import { createGoal, getGoalById, listGoalsByUser } from "./modules/goals/goal.repository";
import { createGoalOperation } from "./modules/goals/operation.repository";
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
};

type GoalOperationArgs = {
  goalId: string;
  type: OperationType;
  amount: number;
  note?: string;
};

type GoalLookupArgs = {
  id: string;
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
    createdAt: String!
  }

  type Goal {
    id: ID!
    title: String!
    targetAmount: Float!
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
    createGoal(title: String!, targetAmount: Float!): Goal!
    updateGoalProgress(goalId: ID!, type: OperationType!, amount: Float!, note: String): Goal!
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
  createGoal: async ({ title, targetAmount }: GoalArgs, context: Context) => {
    const userId = ensureAuthed(context);
    if (targetAmount <= 0) {
      throw new Error("Target amount should be greater than 0");
    }

    const goal = await createGoal(userId, title.trim(), targetAmount);
    return buildGoalView(userId, goal);
  },
  updateGoalProgress: async ({ goalId, type, amount, note }: GoalOperationArgs, context: Context) => {
    const userId = ensureAuthed(context);
    if (amount <= 0) {
      throw new Error("Amount should be greater than 0");
    }

    const goal = await getGoalById(userId, goalId);
    if (!goal) {
      throw new Error("Goal not found");
    }

    await createGoalOperation(userId, goalId, type, amount, note?.trim());
    return buildGoalView(userId, goal);
  },
};
