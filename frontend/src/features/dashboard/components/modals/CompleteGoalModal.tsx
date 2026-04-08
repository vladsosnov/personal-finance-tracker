import { ConfirmationModal } from "@/shared/components/confirmation-modal";
import type { Goal } from "@/features/dashboard/types";

type CompleteGoalModalProps = {
  goal: Goal | null;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const CompleteGoalModal = ({ goal, isLoading, onConfirm, onClose }: CompleteGoalModalProps) => (
  <ConfirmationModal
    opened={Boolean(goal)}
    title="Complete goal?"
    description={<><strong>{goal?.title ?? "This goal"}</strong> has reached its target. Do you want to move it to completed goals?</>}
    confirmLabel="Complete"
    confirmColor="teal"
    cancelLabel="Keep active"
    isLoading={isLoading}
    onConfirm={onConfirm}
    onClose={onClose}
  />
);
