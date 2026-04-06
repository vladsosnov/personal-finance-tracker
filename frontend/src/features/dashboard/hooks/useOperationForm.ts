import { useState } from "react";
import type { GoalOperation } from "@/features/dashboard/types";
import type { OperationType } from "@/shared/gql/__generated__/schema-types";
import { getTodayDateValue } from "@/shared/utils/date";
import { DEFAULT_CURRENCY } from "@/shared/constants/currencies";

export const useOperationForm = (defaultCurrency = DEFAULT_CURRENCY) => {
  const [operationType, setOperationType] = useState<OperationType>("INCREASE");
  const [operationAmount, setOperationAmount] = useState<number | "">("");
  const [operationNote, setOperationNote] = useState("");
  const [operationDate, setOperationDate] = useState(getTodayDateValue);
  const [operationCurrency, setOperationCurrency] = useState<string>(defaultCurrency);
  const [editingOperationId, setEditingOperationId] = useState<string | null>(null);

  const reset = (goalCurrency?: string) => {
    setOperationType("INCREASE");
    setOperationAmount("");
    setOperationNote("");
    setOperationDate(getTodayDateValue());
    setOperationCurrency(goalCurrency ?? defaultCurrency);
    setEditingOperationId(null);
  };

  const startEdit = (operation: GoalOperation) => {
    setEditingOperationId(operation.id);
    setOperationType(operation.type);
    setOperationAmount(operation.amount);
    setOperationNote(operation.note ?? "");
    setOperationDate(operation.operationDate);
    setOperationCurrency(operation.currency);
  };

  return {
    operationType,
    operationAmount,
    operationNote,
    operationDate,
    operationCurrency,
    editingOperationId,
    setOperationType,
    setOperationAmount,
    setOperationNote,
    setOperationDate,
    setOperationCurrency,
    reset,
    startEdit,
  };
};
