import { listAllOperationsByUser, listOperationsByGoal } from "./operation.repository";
import { convert, getRates } from "../exchange-rates/exchange-rate.service";
import type { Goal, GoalOperation, GoalOperationView, GoalView } from "./types";

const convertOperations = (
  operations: GoalOperation[],
  goalCurrency: string,
  rates: Record<string, number>
): GoalOperationView[] =>
  operations.map((op) => ({
    ...op,
    convertedAmount:
      op.currency === goalCurrency
        ? op.amount
        : convert(op.amount, op.currency, goalCurrency, rates),
  }));

const buildGoalViewFromOperations = (
  goal: Goal,
  operations: GoalOperationView[]
): GoalView => {
  const operationsTotal = operations.reduce(
    (sum, op) =>
      op.type === "INCREASE" ? sum + op.convertedAmount : sum - op.convertedAmount,
    0
  );
  const currentAmount = Number((goal.initialAmount + operationsTotal).toFixed(2));
  const progress = goal.targetAmount > 0 ? Math.min((currentAmount / goal.targetAmount) * 100, 100) : 0;

  return {
    id: goal.id,
    title: goal.title,
    targetAmount: goal.targetAmount,
    initialAmount: goal.initialAmount,
    currency: goal.currency,
    color: goal.color,
    sortOrder: goal.sortOrder,
    isCompleted: goal.isCompleted,
    completedAt: goal.completedAt,
    currentAmount,
    progress,
    createdAt: goal.createdAt,
    operations,
  };
};

const collectCurrencies = (goals: Goal[], operations: GoalOperation[]): Set<string> => {
  const currencies = new Set<string>();
  for (const g of goals) currencies.add(g.currency);
  for (const op of operations) currencies.add(op.currency);
  return currencies;
};

const getRatesForCurrencies = async (
  goalCurrency: string,
  currencies: Set<string>
): Promise<Record<string, number>> => {
  const needsConversion = [...currencies].some((c) => c !== goalCurrency);
  if (!needsConversion) return {};
  const { rates } = await getRates(goalCurrency);
  return rates;
};

export const buildGoalView = async (userId: string, goal: Goal): Promise<GoalView> => {
  const operations = await listOperationsByGoal(userId, goal.id);
  const currencies = collectCurrencies([goal], operations);
  const rates = await getRatesForCurrencies(goal.currency, currencies);
  const convertedOps = convertOperations(operations, goal.currency, rates);
  return buildGoalViewFromOperations(goal, convertedOps);
};

export const buildGoalViews = async (userId: string, goals: Goal[]): Promise<GoalView[]> => {
  const allOperations = await listAllOperationsByUser(userId);
  const operationsByGoal = new Map<string, GoalOperation[]>();
  for (const op of allOperations) {
    const list = operationsByGoal.get(op.goalId) ?? [];
    list.push(op);
    operationsByGoal.set(op.goalId, list);
  }

  // Pre-fetch rates for all unique goal currencies in parallel
  const allCurrencies = collectCurrencies(goals, allOperations);
  const uniqueBaseCurrencies = [...new Set(goals.map((g) => g.currency))];
  const rateEntries = await Promise.all(
    uniqueBaseCurrencies.map(async (base) => [base, await getRatesForCurrencies(base, allCurrencies)] as const)
  );
  const ratesByBase = new Map(rateEntries);

  return goals.map((goal) => {
    const ops = operationsByGoal.get(goal.id) ?? [];
    const rates = ratesByBase.get(goal.currency) ?? {};
    const convertedOps = convertOperations(ops, goal.currency, rates);
    return buildGoalViewFromOperations(goal, convertedOps);
  });
};
