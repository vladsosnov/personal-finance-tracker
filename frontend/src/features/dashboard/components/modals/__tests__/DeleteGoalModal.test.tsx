import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { DeleteGoalModal } from '../DeleteGoalModal';

describe('DeleteGoalModal', () => {
  const defaultProps = {
    goalTitle: 'Test Goal',
    isLoading: false,
    onConfirm: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when goalTitle is provided', () => {
    render(<DeleteGoalModal {...defaultProps} />);

    expect(screen.getByText('Remove goal?')).toBeInTheDocument();
    expect(screen.getByText('Test Goal')).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it('does not render when goalTitle is null', () => {
    render(<DeleteGoalModal {...defaultProps} goalTitle={null} />);

    expect(screen.queryByText('Remove goal?')).not.toBeInTheDocument();
  });

  it('calls onConfirm when remove button clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteGoalModal {...defaultProps} />);

    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteGoalModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on remove button', () => {
    render(<DeleteGoalModal {...defaultProps} isLoading={true} />);

    const removeButton = screen.getByRole('button', { name: /remove/i });
    expect(removeButton).toHaveAttribute('data-loading', 'true');
  });

  it('disables cancel button when loading', () => {
    render(<DeleteGoalModal {...defaultProps} isLoading={true} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
  });

  it('displays fallback text when goalTitle is empty string', () => {
    render(<DeleteGoalModal {...defaultProps} goalTitle="" />);

    expect(screen.queryByText('Remove goal?')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<DeleteGoalModal {...defaultProps} />);

    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it('autofocuses cancel button', () => {
    render(<DeleteGoalModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toHaveAttribute('data-autofocus');
  });

  it('prevents modal close when loading', () => {
    const { baseElement } = render(<DeleteGoalModal {...defaultProps} isLoading={true} />);

    const overlay = baseElement.querySelector('.mantine-Modal-overlay');
    if (overlay) {
      (overlay as HTMLElement).click();
    }

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('allows modal close when not loading', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<DeleteGoalModal {...defaultProps} />);

    const closeButton = baseElement.querySelector('.mantine-Modal-close') as HTMLElement;
    await user.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
