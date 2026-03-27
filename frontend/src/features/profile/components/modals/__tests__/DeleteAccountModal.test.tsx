import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { DeleteAccountModal } from '../DeleteAccountModal';

describe('DeleteAccountModal', () => {
  const defaultProps = {
    opened: true,
    isLoading: false,
    onConfirm: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when opened', () => {
    render(<DeleteAccountModal {...defaultProps} />);

    expect(screen.getByText('Delete account?')).toBeInTheDocument();
    expect(screen.getByText(/permanently delete your account/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<DeleteAccountModal {...defaultProps} opened={false} />);

    expect(screen.queryByText('Delete account?')).not.toBeInTheDocument();
  });

  it('renders cancel and delete buttons', () => {
    render(<DeleteAccountModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
  });

  it('calls onConfirm when delete button clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteAccountModal {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    await user.click(deleteButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteAccountModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on delete button', () => {
    render(<DeleteAccountModal {...defaultProps} isLoading={true} />);

    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    expect(deleteButton).toHaveAttribute('data-loading', 'true');
  });

  it('disables cancel button when loading', () => {
    render(<DeleteAccountModal {...defaultProps} isLoading={true} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
  });

  it('has proper accessibility attributes', () => {
    render(<DeleteAccountModal {...defaultProps} />);

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-describedby');

    const description = screen.getByText(/permanently delete your account/i);
    expect(description).toHaveAttribute('id', 'delete-account-desc');
  });

  it('autofocuses cancel button', () => {
    render(<DeleteAccountModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toHaveAttribute('data-autofocus');
  });
});
