import { useEffect, useState } from "react";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { ActionIcon, Badge, Card, Group, Progress, Stack, Text, Tooltip } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
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
  const isMobile = useMediaQuery("(max-width: 768px)", false);
  const goalProgress = getProgressPercentage(goal.currentAmount, goal.targetAmount);
  const remaining = goal.targetAmount - goal.currentAmount;
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const touchSize = isMobile ? 36 : 28;

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimatedProgress(goalProgress));
    return () => cancelAnimationFrame(id);
  }, [goalProgress]);

  return (
    <div style={{ position: "relative" }}>
      {isDropTarget && !isDragged && (
        <div
          style={{
            position: "absolute",
            top: -4,
            left: 8,
            right: 8,
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${goal.color}, ${hexToRgba(goal.color, 0.3)})`,
            zIndex: 5,
          }}
        />
      )}
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
        aria-label={`${goal.title}, ${formatMoney(goal.currentAmount, goal.currency)} of ${formatMoney(goal.targetAmount, goal.currency)}${goal.isCompleted ? ", completed" : `, ${goalProgress.toFixed(1)}% progress`}`}
        className={!isDraggable ? anim.hoverLift : undefined}
        style={{
          cursor: isDraggable ? (isDragged ? "grabbing" : "grab") : "pointer",
          borderColor: isDropTarget || isSelected ? goal.color : undefined,
          boxShadow: isDragged
            ? `0 12px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px ${hexToRgba(goal.color, 0.3)}`
            : isSelected
              ? `0 0 0 1px ${hexToRgba(goal.color, 0.2)}`
              : undefined,
          backgroundColor: isSelected ? hexToRgba(goal.color, 0.05) : undefined,
          opacity: isDragged ? 0.85 : 1,
          transform: isDragged ? "scale(1.03)" : undefined,
          transition: isDragged ? "none" : "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
          zIndex: isDragged ? 10 : undefined,
          position: isDragged ? "relative" as const : undefined,
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
              <Group gap={4} wrap="nowrap">
                <ActionIcon
                  variant="light"
                  color="gray"
                  size={touchSize}
                  aria-label={`Edit ${goal.title}`}
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                >
                  <IconPencil size={16} stroke={2} />
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  color="red"
                  size={touchSize}
                  aria-label={`Remove ${goal.title}`}
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                  <IconTrash size={16} stroke={2} />
                </ActionIcon>
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
              {formatMoney(goal.currentAmount, goal.currency)} / {formatMoney(goal.targetAmount, goal.currency)}
            </Text>
            {!goal.isCompleted && remaining > 0 && (
              <Text size="xs" c="dimmed" style={{ color: goal.color, opacity: 0.8, whiteSpace: "nowrap" }}>
                {formatMoney(remaining, goal.currency)} left
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
    </div>
  );
};
