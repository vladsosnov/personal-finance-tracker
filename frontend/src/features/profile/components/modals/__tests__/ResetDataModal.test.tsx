import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { ResetDataModal } from '../ResetDataModal';

describe('ResetDataModal', () => {
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
    render(<ResetDataModal {...defaultProps} />);

    expect(screen.getByText('Reset all data?')).toBeInTheDocument();
    expect(screen.getByText(/permanently remove all goals/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ResetDataModal {...defaultProps} opened={false} />);

    expect(screen.queryByText('Reset all data?')).not.toBeInTheDocument();
  });

  it('renders cancel and reset buttons', () => {
    render(<ResetDataModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('calls onConfirm when reset button clicked', async () => {
    const user = userEvent.setup();
    render(<ResetDataModal {...defaultProps} />);

    const resetButton = screen.getByRole('button', { name: /^reset$/i });
    await user.click(resetButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<ResetDataModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on reset button', () => {
    render(<ResetDataModal {...defaultProps} isLoading={true} />);

    const resetButton = screen.getByRole('button', { name: /^reset$/i });
    expect(resetButton).toHaveAttribute('data-loading', 'true');
  });

  it('disables cancel button when loading', () => {
    render(<ResetDataModal {...defaultProps} isLoading={true} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
  });

  it('has proper accessibility attributes', () => {
    render(<ResetDataModal {...defaultProps} />);

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-describedby');

    const description = screen.getByText(/permanently remove all goals/i);
    expect(description).toHaveAttribute('id', 'reset-data-desc');
  });

  it('autofocuses cancel button', () => {
    render(<ResetDataModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toHaveAttribute('data-autofocus');
  });
});
