import { ConfirmationModal } from "@/shared/components/confirmation-modal";

type ResetDataModalProps = {
  opened: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const ResetDataModal = ({ opened, isLoading, onConfirm, onClose }: ResetDataModalProps) => (
  <ConfirmationModal
    opened={opened}
    title="Reset all data?"
    description="This will permanently remove all goals and operations from your account."
    confirmLabel="Reset"
    isLoading={isLoading}
    onConfirm={onConfirm}
    onClose={onClose}
  />
);
