import type { ImportGoalEntry, PreparedImportGoal, PreparedImportOperation, PreparedImportResult, SkippedImportGoal } from "@/features/profile/types";
import { DEFAULT_GOAL_COLOR } from "@/shared/constants/goal-colors";

const toOperationDate = (value: string | undefined): string | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const normalizeColor = (value: string | undefined): string => {
  if (!value) return DEFAULT_GOAL_COLOR;
  const normalized = value.startsWith("#") ? value : `#${value}`;
  const match = normalized.match(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/);
  if (!match) return DEFAULT_GOAL_COLOR;
  return `#${match[1].slice(0, 6).toUpperCase()}`;
};

export const prepareImportGoals = (source: string, includedZeroTargetGoalIndexes: Set<number>, excludedGoalIndexes: Set<number> = new Set()): PreparedImportResult => {
  const parsed = JSON.parse(source) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Import file must contain an array of goals");
  }

  const goals: PreparedImportGoal[] = [];
  const skippedGoals: SkippedImportGoal[] = [];

  parsed.forEach((item, goalIndex) => {
    const goal = item as ImportGoalEntry;
    const title = goal.title?.trim() || `Goal ${goalIndex + 1}`;
    const targetAmount = Number(goal.targetValue);
    const initialAmount = Number(goal.initialValue ?? 0);

    if (excludedGoalIndexes.has(goalIndex)) {
      skippedGoals.push({ sourceIndex: goalIndex, title, reason: "Removed by user", canInclude: true });
      return;
    }

    if (!Number.isFinite(targetAmount) || targetAmount < 0) {
      skippedGoals.push({ sourceIndex: goalIndex, title, reason: "Target amount is invalid", canInclude: false });
      return;
    }
    if (targetAmount === 0 && !includedZeroTargetGoalIndexes.has(goalIndex)) {
      skippedGoals.push({ sourceIndex: goalIndex, title, reason: "Target amount is missing or zero", canInclude: true });
      return;
    }
    if (!Number.isFinite(initialAmount) || initialAmount < 0) {
      skippedGoals.push({ sourceIndex: goalIndex, title, reason: "Starting amount is invalid", canInclude: false });
      return;
    }

    const history = Array.isArray(goal.history) ? goal.history : [];
    const normalizedHistory = [];

    for (let i = 0; i < history.length; i++) {
      const entry = history[i];
      const value = Number(entry.value);
      const operationDate = toOperationDate(entry.date);
      const timestamp = entry.date ? new Date(entry.date).getTime() : Number.NaN;

      if (!Number.isFinite(value) || !operationDate || Number.isNaN(timestamp)) {
        skippedGoals.push({ sourceIndex: goalIndex, title, reason: `History item ${i + 1} is invalid`, canInclude: false });
        return;
      }

      normalizedHistory.push({ value, note: entry.note?.trim() || undefined, operationDate, timestamp });
    }

    normalizedHistory.sort((a, b) => a.timestamp - b.timestamp);

    let previousValue = initialAmount;
    const operations: PreparedImportOperation[] = [];

    for (const entry of normalizedHistory) {
      const delta = Number((entry.value - previousValue).toFixed(2));
      if (delta !== 0) {
        operations.push({
          type: delta > 0 ? "INCREASE" : "DECREASE",
          amount: Math.abs(delta),
          note: entry.note,
          operationDate: entry.operationDate,
        });
      }
      previousValue = entry.value;
    }

    goals.push({
      sourceIndex: goalIndex,
      title,
      targetAmount,
      initialAmount,
      color: normalizeColor(goal.display?.bar?.colors?.primary),
      operationCount: operations.length,
      operations,
      canRemoveFromImport: true,
    });
  });

  return { goals, skippedGoals };
};
