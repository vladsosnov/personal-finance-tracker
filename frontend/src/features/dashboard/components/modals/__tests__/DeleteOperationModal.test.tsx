import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { DeleteOperationModal } from '../DeleteOperationModal';
import { mockOperation } from '@/__tests__/mock-data';

describe('DeleteOperationModal', () => {
  const operation = {
    ...mockOperation,
    type: 'INCREASE' as const,
    operationDate: '2024-01-01',
  };

  const defaultProps = {
    operation,
    isLoading: false,
    onConfirm: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when operation is provided', () => {
    render(<DeleteOperationModal {...defaultProps} />);

    expect(screen.getByText('Delete Operation')).toBeInTheDocument();
    expect(screen.getByText(/increase operation/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1 000\.00/)).toBeInTheDocument();
  });

  it('does not render when operation is null', () => {
    render(<DeleteOperationModal {...defaultProps} operation={null} />);

    expect(screen.queryByText('Delete Operation')).not.toBeInTheDocument();
  });

  it('calls onConfirm when delete button clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteOperationModal {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteOperationModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on delete button', () => {
    render(<DeleteOperationModal {...defaultProps} isLoading={true} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toHaveAttribute('data-loading', 'true');
  });

  it('disables cancel button when loading', () => {
    render(<DeleteOperationModal {...defaultProps} isLoading={true} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
  });

  it('displays decrease operation type correctly', () => {
    const decreaseOperation = { ...operation, type: 'DECREASE' as const };
    render(<DeleteOperationModal {...defaultProps} operation={decreaseOperation} />);

    expect(screen.getByText(/decrease operation/i)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<DeleteOperationModal {...defaultProps} />);

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-describedby');

    const description = screen.getByText(/increase operation/i);
    expect(description).toHaveAttribute('id', 'delete-operation-desc');
  });

  it('autofocuses cancel button', () => {
    render(<DeleteOperationModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toHaveAttribute('data-autofocus');
  });
});
