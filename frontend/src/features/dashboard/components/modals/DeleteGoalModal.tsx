import { ConfirmationModal } from "@/shared/components/confirmation-modal";

type DeleteGoalModalProps = {
  goalTitle: string | null;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const DeleteGoalModal = ({ goalTitle, isLoading, onConfirm, onClose }: DeleteGoalModalProps) => (
  <ConfirmationModal
    opened={Boolean(goalTitle)}
    title="Remove goal?"
    description={<>Remove <strong>{goalTitle ?? "this goal"}</strong> and all of its operations? This action cannot be undone.</>}
    confirmLabel="Remove"
    isLoading={isLoading}
    onConfirm={onConfirm}
    onClose={onClose}
  />
);
