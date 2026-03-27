import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { OperationModal } from '../OperationModal';

describe('OperationModal', () => {
  const defaultProps = {
    opened: true,
    isEditing: false,
    isLoading: false,
    isSubmitDisabled: false,
    operationType: 'INCREASE' as const,
    operationAmount: 500 as number | '',
    operationNote: '',
    operationDate: '2024-01-15',
    onChangeType: jest.fn(),
    onChangeAmount: jest.fn(),
    onChangeNote: jest.fn(),
    onChangeDate: jest.fn(),
    onSubmit: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders add mode title when not editing', () => {
    render(<OperationModal {...defaultProps} />);

    expect(screen.getByText('Add operation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument();
  });

  it('renders edit mode title when editing', () => {
    render(<OperationModal {...defaultProps} isEditing={true} />);

    expect(screen.getByText('Edit operation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<OperationModal {...defaultProps} opened={false} />);

    expect(screen.queryByText('Add operation')).not.toBeInTheDocument();
  });

  it('highlights increase button when type is INCREASE', () => {
    render(<OperationModal {...defaultProps} operationType="INCREASE" />);

    const increaseButton = screen.getByRole('button', { name: /increase/i });
    expect(increaseButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('highlights decrease button when type is DECREASE', () => {
    render(<OperationModal {...defaultProps} operationType="DECREASE" />);

    const decreaseButton = screen.getByRole('button', { name: /decrease/i });
    expect(decreaseButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onChangeType when type button clicked', async () => {
    const user = userEvent.setup();
    render(<OperationModal {...defaultProps} />);

    const decreaseButton = screen.getByRole('button', { name: /decrease/i });
    await user.click(decreaseButton);

    expect(defaultProps.onChangeType).toHaveBeenCalledWith('DECREASE');
  });

  it('calls onSubmit when form submitted', async () => {
    const user = userEvent.setup();
    render(<OperationModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /^add$/i });
    await user.click(submitButton);

    expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not call onSubmit when disabled', async () => {
    const user = userEvent.setup();
    render(<OperationModal {...defaultProps} isSubmitDisabled={true} />);

    const submitButton = screen.getByRole('button', { name: /^add$/i });
    await user.click(submitButton);

    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('calls onClose when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<OperationModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('disables submit button when isSubmitDisabled is true', () => {
    render(<OperationModal {...defaultProps} isSubmitDisabled={true} />);

    const submitButton = screen.getByRole('button', { name: /^add$/i });
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state on submit button', () => {
    render(<OperationModal {...defaultProps} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /^add$/i });
    expect(submitButton).toHaveAttribute('data-loading', 'true');
  });

  it('disables cancel button when loading', () => {
    render(<OperationModal {...defaultProps} isLoading={true} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
  });

  it('renders all form fields', () => {
    render(<OperationModal {...defaultProps} />);

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/note/i)).toBeInTheDocument();
  });

  it('marks required fields', () => {
    render(<OperationModal {...defaultProps} />);

    expect(screen.getByLabelText(/amount/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/date/i)).toHaveAttribute('aria-required', 'true');
  });

  it('has proper accessibility for operation type group', () => {
    render(<OperationModal {...defaultProps} />);

    const typeGroup = screen.getByRole('group', { name: /operation type/i });
    expect(typeGroup).toBeInTheDocument();
  });
});
