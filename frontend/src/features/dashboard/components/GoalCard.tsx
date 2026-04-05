import { useEffect, useState } from "react";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { Badge, Button, Card, Group, Progress, Stack, Text, Tooltip } from "@mantine/core";
import type { Goal } from "@/features/dashboard/types";
import { hexToRgba } from "@/shared/utils/color";
import { formatMoney, getProgressPercentage } from "@/shared/utils/number";
import anim from "@/shared/styles/page-animations.module.css";

export type GoalCardProps = {
  goal: Goal;
  isSelected: boolean;
  isDraggable: boolean;
  isDragged: boolean;
  isDropTarget: boolean;
  isManageMode: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onTouchStart?: () => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: () => void;
};

export const GoalCard = ({
  goal,
  isSelected,
  isDraggable,
  isDragged,
  isDropTarget,
  isManageMode,
  onSelect,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: GoalCardProps) => {
  const goalProgress = getProgressPercentage(goal.currentAmount, goal.targetAmount);
  const remaining = goal.targetAmount - goal.currentAmount;
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimatedProgress(goalProgress));
    return () => cancelAnimationFrame(id);
  }, [goalProgress]);

  return (
    <Tooltip label={goal.title} disabled={goal.title.length <= 28} openDelay={600} position="top-start">
      <Card
        withBorder
        radius="md"
        p="sm"
        draggable={isDraggable}
        data-goal-id={goal.id}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`${goal.title}, ${formatMoney(goal.currentAmount)} of ${formatMoney(goal.targetAmount)}${goal.isCompleted ? ", completed" : `, ${goalProgress.toFixed(1)}% progress`}`}
        className={!isDraggable ? anim.hoverLift : undefined}
        style={{
          cursor: isDraggable ? (isDragged ? "grabbing" : "grab") : "pointer",
          borderColor: isDropTarget || isSelected ? goal.color : undefined,
          boxShadow: isSelected ? `0 0 0 1px ${hexToRgba(goal.color, 0.2)}` : undefined,
          backgroundColor: isSelected ? hexToRgba(goal.color, 0.05) : undefined,
          opacity: isDragged ? 0.55 : 1,
        }}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onTouchStart={isDraggable ? onTouchStart : undefined}
        onTouchMove={isDraggable ? onTouchMove : undefined}
        onTouchEnd={isDraggable ? onTouchEnd : undefined}
        onClick={onSelect}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
      >
        <Stack gap="xs">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Text fw={700} lineClamp={1} style={{ flex: 1, minWidth: 0 }}>
              {goal.title}
            </Text>
            {isManageMode ? (
              <Group gap={4} wrap="nowrap" style={{ minHeight: 28 }}>
                <Button
                  variant="light"
                  size="compact-sm"
                  px={8}
                  styles={{ root: { minHeight: 28, backgroundColor: "rgba(15, 23, 42, 0.06)", color: "var(--mantine-color-text)" } }}
                  aria-label={`Edit ${goal.title}`}
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                >
                  <IconPencil size={16} stroke={2} />
                </Button>
                <Button
                  color="red"
                  variant="light"
                  size="compact-sm"
                  px={8}
                  styles={{ root: { minHeight: 28 } }}
                  aria-label={`Remove ${goal.title}`}
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                  <IconTrash size={16} stroke={2} />
                </Button>
              </Group>
            ) : (
              <Badge
                variant="light"
                styles={{
                  root: {
                    minHeight: 28,
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: hexToRgba(goal.color, 0.14),
                    color: goal.color,
                    border: `1px solid ${hexToRgba(goal.color, 0.3)}`,
                  },
                }}
              >
                {goal.isCompleted ? "Completed" : `${goalProgress.toFixed(1)}%`}
              </Badge>
            )}
          </Group>
          <Group justify="space-between" wrap="nowrap">
            <Text size="sm" c="dimmed">
              {formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)}
            </Text>
            {!goal.isCompleted && remaining > 0 && (
              <Text size="xs" c="dimmed" style={{ color: goal.color, opacity: 0.8, whiteSpace: "nowrap" }}>
                {formatMoney(remaining)} left
              </Text>
            )}
          </Group>
          <Progress
            value={Math.max(0, Math.min(animatedProgress, 100))}
            aria-label={`${goal.title} progress: ${goalProgress.toFixed(1)}%`}
            styles={{
              section: {
                backgroundColor: goal.color,
                transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
              },
            }}
          />
        </Stack>
      </Card>
    </Tooltip>
  );
};
