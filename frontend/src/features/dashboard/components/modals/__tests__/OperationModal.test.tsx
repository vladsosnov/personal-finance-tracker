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
    operationCurrency: 'USD',
    operationNote: '',
    operationDate: '2024-01-15',
    operations: [
      {
        id: 'draft-1',
        type: 'INCREASE' as const,
        amount: 500 as number | '',
        currency: 'USD',
        note: '',
        operationDate: '2024-01-15',
      },
    ],
    onChangeType: jest.fn(),
    onChangeAmount: jest.fn(),
    onChangeCurrency: jest.fn(),
    onChangeNote: jest.fn(),
    onChangeDate: jest.fn(),
    onAddOperation: jest.fn(),
    onRemoveOperation: jest.fn(),
    onChangeOperationType: jest.fn(),
    onChangeOperationAmount: jest.fn(),
    onChangeOperationCurrency: jest.fn(),
    onChangeOperationNote: jest.fn(),
    onChangeOperationDate: jest.fn(),
    onSubmit: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders add mode title and multi-operation actions', () => {
    render(<OperationModal {...defaultProps} />);

    expect(screen.getByText('Add operations')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save operations/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add another operation/i })).toBeInTheDocument();
    expect(screen.getByText('Operation 1')).toBeInTheDocument();
  });

  it('renders edit mode title when editing', () => {
    render(<OperationModal {...defaultProps} isEditing={true} />);

    expect(screen.getByText('Edit operation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add another operation/i })).not.toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<OperationModal {...defaultProps} opened={false} />);

    expect(screen.queryByText('Add operations')).not.toBeInTheDocument();
  });

  it('highlights increase button when type is INCREASE in edit mode', () => {
    render(<OperationModal {...defaultProps} isEditing={true} operationType="INCREASE" />);

    const increaseButton = screen.getByRole('button', { name: /increase/i });
    expect(increaseButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('highlights decrease button when type is DECREASE in edit mode', () => {
    render(<OperationModal {...defaultProps} isEditing={true} operationType="DECREASE" />);

    const decreaseButton = screen.getByRole('button', { name: /decrease/i });
    expect(decreaseButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onChangeType when edit type button clicked', async () => {
    const user = userEvent.setup();
    render(<OperationModal {...defaultProps} isEditing={true} />);

    await user.click(screen.getByRole('button', { name: /decrease/i }));

    expect(defaultProps.onChangeType).toHaveBeenCalledWith('DECREASE');
  });

  it('calls onChangeType with INCREASE in edit mode when toggled back', async () => {
    const user = userEvent.setup();
    render(<OperationModal {...defaultProps} isEditing={true} operationType="DECREASE" />);

    await user.click(screen.getByRole('button', { name: /increase/i }));

    expect(defaultProps.onChangeType).toHaveBeenCalledWith('INCREASE');
  });

  it('calls onSubmit when form submitted in add mode', async () => {
    const user = userEvent.setup();
    render(<OperationModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /save operations/i }));

    expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not call onSubmit when disabled', async () => {
    const user = userEvent.setup();
    render(<OperationModal {...defaultProps} isSubmitDisabled={true} />);

    await user.click(screen.getByRole('button', { name: /save operations/i }));

    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('calls onClose when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<OperationModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('disables submit and cancel buttons when loading', () => {
    render(<OperationModal {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('button', { name: /save operations/i })).toHaveAttribute('data-loading', 'true');
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /add another operation/i })).toBeDisabled();
  });

  it('renders all fields for each add row', () => {
    render(
      <OperationModal
        {...defaultProps}
        operations={[
          defaultProps.operations[0],
          { ...defaultProps.operations[0], id: 'draft-2', operationDate: '2024-01-16' },
        ]}
      />
    );

    expect(screen.getByLabelText(/amount 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount 2/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/note 2/i)).toBeInTheDocument();
  });

  it('adds a new operation row when requested', async () => {
    const user = userEvent.setup();
    render(<OperationModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /add another operation/i }));

    expect(defaultProps.onAddOperation).toHaveBeenCalledTimes(1);
  });

  it('removes an operation row when remove is clicked', async () => {
    const user = userEvent.setup();
    render(
      <OperationModal
        {...defaultProps}
        operations={[
          defaultProps.operations[0],
          { ...defaultProps.operations[0], id: 'draft-2', operationDate: '2024-01-16' },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /remove operation 2/i }));

    expect(defaultProps.onRemoveOperation).toHaveBeenCalledWith(1);
  });

  it('disables remove when only one row remains', () => {
    render(<OperationModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: /remove operation 1/i })).toBeDisabled();
  });

  it('disables adding more operations at the 10-row limit', () => {
    render(
      <OperationModal
        {...defaultProps}
        operations={Array.from({ length: 10 }, (_, index) => ({
          ...defaultProps.operations[0],
          id: `draft-${index + 1}`,
          operationDate: `2024-01-${String(index + 10).padStart(2, '0')}`,
        }))}
      />
    );

    expect(screen.getByRole('button', { name: /maximum 10 operations reached/i })).toBeDisabled();
  });

  it('calls row-specific change handlers in add mode', async () => {
    const user = userEvent.setup();
    render(
      <OperationModal
        {...defaultProps}
        operations={[
          defaultProps.operations[0],
          { ...defaultProps.operations[0], id: 'draft-2', operationDate: '2024-01-16' },
        ]}
      />
    );

    await user.click(screen.getAllByRole('button', { name: /decrease/i })[1]);
    await user.type(screen.getByLabelText(/note 2/i), 'Transfer');

    expect(defaultProps.onChangeOperationType).toHaveBeenCalledWith(1, 'DECREASE');
    expect(defaultProps.onChangeOperationNote).toHaveBeenCalled();
  });

  it('uses single-form field labels in edit mode', () => {
    render(<OperationModal {...defaultProps} isEditing={true} />);

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/note/i)).toBeInTheDocument();
  });

  it('calls edit-mode amount and date handlers', async () => {
    const user = userEvent.setup();
    render(<OperationModal {...defaultProps} isEditing={true} />);

    await user.clear(screen.getByLabelText(/amount/i));
    await user.type(screen.getByLabelText(/amount/i), '750');
    await user.clear(screen.getByLabelText(/date/i));
    await user.type(screen.getByLabelText(/date/i), '2024-02-15');

    expect(defaultProps.onChangeAmount).toHaveBeenCalled();
    expect(defaultProps.onChangeDate).toHaveBeenCalled();
  });

  it('submits edit mode via enter key when valid', async () => {
    const user = userEvent.setup();
    render(<OperationModal {...defaultProps} isEditing={true} />);

    await user.click(screen.getByLabelText(/amount/i));
    await user.keyboard('{Enter}');

    expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
  });
});
