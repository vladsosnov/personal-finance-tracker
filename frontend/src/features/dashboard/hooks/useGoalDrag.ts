import { useState } from "react";

export const useGoalDrag = (onDrop: (fromId: string, toId: string) => void) => {
  const [draggingGoalId, setDraggingGoalId] = useState<string | null>(null);
  const [dragOverGoalId, setDragOverGoalId] = useState<string | null>(null);

  const handleDragStart = (goalId: string) => {
    setDraggingGoalId(goalId);
    setDragOverGoalId(goalId);
  };

  const handleDragOver = (goalId: string) => {
    if (!draggingGoalId || draggingGoalId === goalId) return;
    setDragOverGoalId(goalId);
  };

  const handleDragEnd = () => {
    setDraggingGoalId(null);
    setDragOverGoalId(null);
  };

  const handleDrop = async (goalId: string) => {
    if (!draggingGoalId || draggingGoalId === goalId) {
      handleDragEnd();
      return;
    }

    const fromId = draggingGoalId;
    handleDragEnd();
    await onDrop(fromId, goalId);
  };

  return {
    draggingGoalId,
    dragOverGoalId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
  };
};
