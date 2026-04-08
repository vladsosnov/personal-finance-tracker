import { ConfirmationModal } from "@/shared/components/confirmation-modal";

type DeleteAccountModalProps = {
  opened: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const DeleteAccountModal = ({ opened, isLoading, onConfirm, onClose }: DeleteAccountModalProps) => (
  <ConfirmationModal
    opened={opened}
    title="Delete account?"
    description="This will permanently delete your account and all associated goals and operations. This action cannot be undone."
    confirmLabel="Delete account"
    isLoading={isLoading}
    onConfirm={onConfirm}
    onClose={onClose}
  />
);
