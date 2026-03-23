import { Badge, Button, Card, Group, Progress, ScrollArea, Skeleton, Stack, Text, Title } from "@mantine/core";
import type { Goal } from "@/features/dashboard/types";
import { hexToRgba } from "@/shared/utils/color";
import { formatMoney, getProgressPercentage } from "@/shared/utils/number";

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="m13.5 6.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ManageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    <circle cx="17" cy="12" r="1.5" fill="currentColor" />
    <circle cx="10" cy="17" r="1.5" fill="currentColor" />
  </svg>
);

const ManageActiveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

type GoalsListProps = {
  title: string;
  goals: Goal[];
  isLoadingGoals: boolean;
  selectedGoalId: string | null;
  isManageMode: boolean;
  showManageToggle?: boolean;
  canManage?: boolean;
  showDragHint?: boolean;
  allowDrag?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onSelectGoal: (goalId: string) => void;
  onToggleManageMode: () => void;
  onStartEditGoal: (goalId: string) => void;
  onStartDeleteGoal: (goalId: string) => void;
  draggingGoalId: string | null;
  dragOverGoalId: string | null;
  onDragStart: (goalId: string) => void;
  onDragOver: (goalId: string) => void;
  onDrop: (goalId: string) => void;
  onDragEnd: () => void;
};

export const GoalsList = ({
  title,
  goals,
  isLoadingGoals,
  selectedGoalId,
  isManageMode,
  showManageToggle = true,
  canManage = goals.length > 0,
  showDragHint = true,
  allowDrag = true,
  emptyTitle = "No goals yet",
  emptyDescription = "Create your first goal to start tracking progress.",
  onSelectGoal,
  onToggleManageMode,
  onStartEditGoal,
  onStartDeleteGoal,
  draggingGoalId,
  dragOverGoalId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: GoalsListProps) => {
  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap={6}>
        <Group justify="space-between" align="center">
          <Title order={4}>
            {title} ({goals.length})
          </Title>
          {showManageToggle && canManage && (
            <Button variant={isManageMode ? "light" : "subtle"} px={10} aria-label="Manage goals" onClick={onToggleManageMode}>
              {isManageMode ? <ManageActiveIcon /> : <ManageIcon />}
            </Button>
          )}
        </Group>
        {showDragHint && goals.length > 0 && (
          <Text size="sm" c="dimmed">
            Drag and drop cards to change their order.
          </Text>
        )}
        <ScrollArea h={540} offsetScrollbars scrollbarSize={8}>
          <Stack gap="sm" pr={4}>
            {isLoadingGoals
              ? Array.from({ length: 5 }).map((_, index) => (
                  <Card key={index} withBorder radius="md" p="md">
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Skeleton height={20} width="42%" />
                        <Skeleton height={24} width={64} radius="xl" />
                      </Group>
                      <Skeleton height={16} width="58%" />
                      <Skeleton height={12} radius="xl" />
                    </Stack>
                  </Card>
                ))
              : goals.map((goal) => {
              const goalProgress = getProgressPercentage(goal.currentAmount, goal.targetAmount);
              const isDragged = draggingGoalId === goal.id;
              const isDropTarget = dragOverGoalId === goal.id && draggingGoalId !== goal.id;

              return (
                <Card
                  key={goal.id}
                  withBorder
                  radius="md"
                  p="md"
                  draggable={allowDrag && !isManageMode}
                  style={{
                    cursor: allowDrag && !isManageMode ? (isDragged ? "grabbing" : "grab") : "pointer",
                    borderColor: isDropTarget
                      ? goal.color
                      : selectedGoalId === goal.id
                        ? goal.color
                        : undefined,
                    boxShadow: selectedGoalId === goal.id ? `0 0 0 1px ${hexToRgba(goal.color, 0.2)}` : undefined,
                    backgroundColor: selectedGoalId === goal.id ? hexToRgba(goal.color, 0.05) : undefined,
                    opacity: isDragged ? 0.55 : 1,
                  }}
                  onDragStart={() => {
                    if (allowDrag && !isManageMode) {
                      onDragStart(goal.id);
                    }
                  }}
                  onDragOver={(event) => {
                    if (allowDrag && !isManageMode) {
                      event.preventDefault();
                      onDragOver(goal.id);
                    }
                  }}
                  onDrop={(event) => {
                    if (allowDrag && !isManageMode) {
                      event.preventDefault();
                      onDrop(goal.id);
                    }
                  }}
                  onDragEnd={() => {
                    if (allowDrag && !isManageMode) {
                      onDragEnd();
                    }
                  }}
                  onClick={() => onSelectGoal(goal.id)}
                >
                  <Stack gap="xs">
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Text fw={700} style={{ flex: 1, minWidth: 0 }}>
                        {goal.title}
                      </Text>
                      {isManageMode ? (
                        <Group gap={4} wrap="nowrap" style={{ minHeight: 28 }}>
                          <Button
                            variant="light"
                            size="compact-sm"
                            px={8}
                            styles={{
                              root: {
                                minHeight: 28,
                                backgroundColor: "rgba(15, 23, 42, 0.06)",
                                color: "var(--mantine-color-text)",
                              },
                            }}
                            aria-label={`Edit ${goal.title}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              onStartEditGoal(goal.id);
                            }}
                          >
                            <EditIcon />
                          </Button>
                          <Button
                            color="red"
                            variant="light"
                            size="compact-sm"
                            px={8}
                            styles={{
                              root: {
                                minHeight: 28,
                              },
                            }}
                            aria-label={`Remove ${goal.title}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              onStartDeleteGoal(goal.id);
                            }}
                          >
                            <DeleteIcon />
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
                            },
                          }}
                        >
                          {goal.isCompleted ? "Completed" : `${goalProgress.toFixed(1)}%`}
                        </Badge>
                      )}
                    </Group>
                    <Text size="sm" c="dimmed">
                      {formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)}
                    </Text>
                    <Progress
                      value={Math.max(0, Math.min(goalProgress, 100))}
                      styles={{
                        section: {
                          backgroundColor: goal.color,
                        },
                      }}
                    />
                  </Stack>
                </Card>
              );
            })}
            {!isLoadingGoals && !goals.length && (
              <Card withBorder radius="md" p="xl">
                <Stack gap={6} align="center">
                  <Title order={5}>{emptyTitle}</Title>
                  <Text c="dimmed" ta="center">
                    {emptyDescription}
                  </Text>
                </Stack>
              </Card>
            )}
          </Stack>
        </ScrollArea>
      </Stack>
    </Card>
  );
};
