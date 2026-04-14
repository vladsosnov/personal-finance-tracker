import { useRef, useState } from "react";

export const useGoalDrag = (onDrop: (fromId: string, toId: string) => void) => {
  const [draggingGoalId, setDraggingGoalId] = useState<string | null>(null);
  const [dragOverGoalId, setDragOverGoalId] = useState<string | null>(null);
  const draggingGoalIdRef = useRef<string | null>(null);

  const handleDragStart = (goalId: string) => {
    setDraggingGoalId(goalId);
    setDragOverGoalId(goalId);
    draggingGoalIdRef.current = goalId;
  };

  const handleDragOver = (goalId: string) => {
    if (!draggingGoalIdRef.current || draggingGoalIdRef.current === goalId) return;
    setDragOverGoalId(goalId);
  };

  const handleDragEnd = () => {
    setDraggingGoalId(null);
    setDragOverGoalId(null);
    draggingGoalIdRef.current = null;
  };

  const handleDrop = async (goalId: string) => {
    if (!draggingGoalIdRef.current || draggingGoalIdRef.current === goalId) {
      handleDragEnd();
      return;
    }

    const fromId = draggingGoalIdRef.current;
    handleDragEnd();
    await onDrop(fromId, goalId);
  };

  // Touch handlers - used by GoalCard for mobile drag-and-drop
  const handleTouchStart = (goalId: string) => {
    handleDragStart(goalId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggingGoalIdRef.current) return;
    const touch = e.touches[0];
    // Temporarily hide the dragged element so elementFromPoint finds the element underneath
    const dragged = (e.currentTarget as HTMLElement);
    dragged.style.pointerEvents = "none";
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    dragged.style.pointerEvents = "";
    const card = el?.closest("[data-goal-id]") as HTMLElement | null;
    if (card?.dataset.goalId) {
      handleDragOver(card.dataset.goalId);
    }
  };

  const handleTouchEnd = async () => {
    const toId = dragOverGoalId;
    const fromId = draggingGoalIdRef.current;
    handleDragEnd();
    if (fromId && toId && fromId !== toId) {
      await onDrop(fromId, toId);
    }
  };

  return {
    draggingGoalId,
    dragOverGoalId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
