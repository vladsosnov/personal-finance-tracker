import { useState } from "react";
import type { GoalOperation } from "@/features/dashboard/types";
import type { OperationType } from "@/shared/gql/__generated__/schema-types";
import { getTodayDateValue } from "@/shared/utils/date";

export const useOperationForm = () => {
  const [operationType, setOperationType] = useState<OperationType>("INCREASE");
  const [operationAmount, setOperationAmount] = useState<number | "">("");
  const [operationNote, setOperationNote] = useState("");
  const [operationDate, setOperationDate] = useState(getTodayDateValue);
  const [editingOperationId, setEditingOperationId] = useState<string | null>(null);

  const reset = () => {
    setOperationType("INCREASE");
    setOperationAmount("");
    setOperationNote("");
    setOperationDate(getTodayDateValue());
    setEditingOperationId(null);
  };

  const startEdit = (operation: GoalOperation) => {
    setEditingOperationId(operation.id);
    setOperationType(operation.type);
    setOperationAmount(operation.amount);
    setOperationNote(operation.note ?? "");
    setOperationDate(operation.operationDate);
  };

  return {
    operationType,
    operationAmount,
    operationNote,
    operationDate,
    editingOperationId,
    setOperationType,
    setOperationAmount,
    setOperationNote,
    setOperationDate,
    reset,
    startEdit,
  };
};
