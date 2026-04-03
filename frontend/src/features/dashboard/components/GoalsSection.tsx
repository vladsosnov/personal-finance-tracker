import { Tabs } from "@mantine/core";
import { GoalsList } from "@/features/dashboard/components/goals-list";
import type { Goal } from "@/features/dashboard/types";
import type { useGoalDrag } from "@/features/dashboard/hooks/useGoalDrag";
import type { GoalManageMode, GoalEmptyState } from "@/features/dashboard/components/goals-list";

type GoalsSectionProps = {
  activeGoals: Goal[];
  completedGoals: Goal[];
  visibleGoals: Goal[];
  isLoadingGoals: boolean;
  selectedGoalId: string | null;
  goalStatusTab: "active" | "completed";
  goalsError: Error | null | undefined;
  emptyState: GoalEmptyState;
  manageMode: GoalManageMode;
  drag: ReturnType<typeof useGoalDrag>;
  onSelectGoal: (goalId: string) => void;
  onTabChange: (tab: "active" | "completed") => void;
  onRetry: () => void;
};

export const GoalsSection = ({
  activeGoals,
  completedGoals,
  visibleGoals,
  isLoadingGoals,
  selectedGoalId,
  goalStatusTab,
  goalsError,
  emptyState,
  manageMode,
  drag,
  onSelectGoal,
  onTabChange,
  onRetry,
}: GoalsSectionProps) => {
  const isCompletedTab = goalStatusTab === "completed";

  return (
    <>
      <Tabs value={goalStatusTab} onChange={(value) => onTabChange((value as "active" | "completed") ?? "active")}>
        <Tabs.List mb="sm">
          <Tabs.Tab value="active">In progress ({activeGoals.length})</Tabs.Tab>
          <Tabs.Tab value="completed" disabled={!completedGoals.length}>
            Completed ({completedGoals.length})
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>
      <GoalsList
        goals={visibleGoals}
        isLoadingGoals={isLoadingGoals}
        selectedGoalId={selectedGoalId}
        allowDrag={!isCompletedTab}
        errorMessage={!visibleGoals.length && goalsError ? goalsError.message : null}
        emptyState={emptyState}
        manageMode={manageMode}
        drag={isCompletedTab ? { ...drag, draggingGoalId: null, dragOverGoalId: null } : drag}
        onSelectGoal={onSelectGoal}
        onRetry={onRetry}
      />
    </>
  );
};
