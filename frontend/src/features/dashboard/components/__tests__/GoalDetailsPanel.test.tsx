import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { GoalDetailsPanel, type GoalDetailsPanelProps, type GoalOperationActions } from '../goal-details-panel';
import type { GoalDetails, GoalOperation } from '@/features/dashboard/types';
import { useMediaQuery } from '@mantine/hooks';
import { mockCompletedGoal, mockGoal } from '@/__tests__/mock-data';

jest.mock('@mantine/hooks', () => ({
  ...jest.requireActual('@mantine/hooks'),
  useMediaQuery: jest.fn(() => false),
}));

const mockUseMediaQuery = useMediaQuery as jest.Mock;

jest.mock('next/dynamic', () => {
  const names = ['GoalChart', 'DeleteOperationModal', 'OperationModal'];
  let callIndex = 0;

  return (loader: () => Promise<unknown>) => {
    const name = names[callIndex++] ?? `Dynamic${callIndex}`;

    const DynamicComponent = (props: Record<string, unknown>) => (
      <div data-testid={`dynamic-${name}`}>
        {typeof props.onClose === 'function' && (
          <button data-testid={`${name}-close`} onClick={props.onClose as () => void}>Close</button>
        )}
        {typeof props.onSubmit === 'function' && (
          <button data-testid={`${name}-submit`} onClick={props.onSubmit as () => void}>Submit</button>
        )}
        {typeof props.onConfirm === 'function' && (
          <button data-testid={`${name}-confirm`} onClick={props.onConfirm as () => void}>Confirm</button>
        )}
      </div>
    );
    DynamicComponent.displayName = name;
    return DynamicComponent;
  };
});

jest.mock('@/features/dashboard/components/GoalDetailHeader', () => ({
  GoalDetailHeader: ({
    goal,
    onExpandChart,
    onCloseSelection,
  }: {
    goal: { title: string };
    onExpandChart: () => void;
    onCloseSelection?: () => void;
  }) => (
    <div data-testid="goal-detail-header">
      {goal.title}
      <button data-testid="expand-chart" onClick={onExpandChart}>Expand</button>
      {onCloseSelection && <button data-testid="close-goal-details" onClick={onCloseSelection}>Close</button>}
    </div>
  ),
}));

jest.mock('@/features/dashboard/components/GoalOperationsTable', () => ({
  GoalOperationsTable: ({
    onEdit,
    onDelete,
  }: {
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
  }) => (
    <div data-testid="goal-operations-table">
      <button data-testid="op-edit-btn" onClick={() => onEdit('op1')}>Edit Op</button>
      <button data-testid="op-delete-btn" onClick={() => onDelete('op1')}>Delete Op</button>
    </div>
  ),
}));

jest.mock('@/features/dashboard/components/ChartRangePicker', () => ({
  ChartRangePicker: () => <div data-testid="chart-range-picker" />,
}));

const mockGoalDetails: GoalDetails = {
  id: '1',
  title: 'Emergency Fund',
  targetAmount: 10000,
  initialAmount: 1000,
  currency: 'USD',
  color: '#228be6',
  sortOrder: 0,
  isCompleted: false,
  currentAmount: 5000,
  progress: 50,
  createdAt: '2024-01-01T00:00:00.000Z',
  operations: [
    {
      id: 'op1',
      type: 'INCREASE',
      amount: 500,
      currency: 'USD',
      convertedAmount: 500,
      operationDate: '2024-01-15',
      createdAt: '2024-01-15T10:00:00Z',
    },
  ],
};

const makeOperationActions = (overrides: Partial<GoalOperationActions> = {}): GoalOperationActions => ({
  form: {
    operationType: 'INCREASE' as const,
    operationAmount: '' as number | '',
    operationNote: '',
    operationDate: '2024-01-01',
    operationCurrency: 'USD',
    editingOperationId: null,
    setOperationType: jest.fn(),
    setOperationAmount: jest.fn(),
    setOperationNote: jest.fn(),
    setOperationDate: jest.fn(),
    setOperationCurrency: jest.fn(),
    reset: jest.fn(),
    startEdit: jest.fn(),
  },
  deletingOperationId: null,
  isUpdatingProgress: false,
  isSubmitDisabled: true,
  onStartEdit: jest.fn(),
  onDelete: jest.fn().mockResolvedValue(undefined),
  onSubmit: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const defaultProps: GoalDetailsPanelProps = {
  hasGoals: true,
  activeGoals: [],
  allGoals: [],
  selectedGoal: null,
  isLoadingGoalDetails: false,
  goalCurrency: 'USD',
  operationActions: makeOperationActions(),
};

describe('GoalDetailsPanel', () => {
  beforeEach(() => {
    mockUseMediaQuery.mockReturnValue(false);
  });

  it('shows loading skeleton when loading', () => {
    render(<GoalDetailsPanel {...defaultProps} isLoadingGoalDetails={true} />);

    expect(screen.getByRole('status', { name: /loading goal details/i })).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    const onRetry = jest.fn();
    render(
      <GoalDetailsPanel
        {...defaultProps}
        goalDetailsErrorMessage="Something went wrong"
        onRetryGoalDetails={onRetry}
      />
    );

    expect(screen.getByText("Couldn't load goal details")).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('shows active goal previews when goals exist but no goal is selected', () => {
    render(
      <GoalDetailsPanel
        {...defaultProps}
        hasGoals={true}
        activeGoals={[mockGoal]}
        allGoals={[mockGoal, mockCompletedGoal]}
        selectedGoal={null}
        onSelectGoal={jest.fn()}
      />
    );

    expect(screen.getByRole('tab', { name: /active/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open emergency fund details/i })).toBeInTheDocument();
    expect(screen.getByTestId('goal-previews-grid')).toHaveStyle({ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' });
    expect(screen.queryByText('Select a goal')).not.toBeInTheDocument();
  });

  it('renders only active goals in the preview state', () => {
    render(
        <GoalDetailsPanel
          {...defaultProps}
          hasGoals={true}
          activeGoals={[mockGoal]}
          allGoals={[mockGoal, mockCompletedGoal]}
          selectedGoal={null}
          onSelectGoal={jest.fn()}
        />
      );

    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.queryByText('Vacation Fund')).not.toBeInTheDocument();
  });

  it('shows all goals after switching preview tab', async () => {
    const user = userEvent.setup();

    render(
      <GoalDetailsPanel
        {...defaultProps}
        hasGoals={true}
        activeGoals={[mockGoal]}
        allGoals={[mockGoal, mockCompletedGoal]}
        selectedGoal={null}
        onSelectGoal={jest.fn()}
      />
    );

    await user.click(screen.getByRole('tab', { name: /all/i }));

    expect(screen.getByText('Vacation Fund')).toBeInTheDocument();
  });

  it('matches the desktop preview height to the goals sidebar height', () => {
    render(
      <GoalDetailsPanel
        {...defaultProps}
        hasGoals={true}
        activeGoals={[mockGoal]}
        allGoals={[mockGoal, mockCompletedGoal]}
        selectedGoal={null}
        onSelectGoal={jest.fn()}
      />
    );

    expect(screen.getByTestId('goal-preview-scroll-area')).toHaveStyle({
      height: 'calc(32.5rem * var(--mantine-scale))',
    });
  });

  it('renders a single preview column on mobile', () => {
    mockUseMediaQuery.mockReturnValue(true);

    render(
      <GoalDetailsPanel
        {...defaultProps}
        hasGoals={true}
        activeGoals={[mockGoal]}
        allGoals={[mockGoal, mockCompletedGoal]}
        selectedGoal={null}
        onSelectGoal={jest.fn()}
      />
    );

    expect(screen.getByTestId('goal-previews-grid')).toHaveStyle({ gridTemplateColumns: '1fr' });
  });

  it('calls onSelectGoal when a preview card is clicked', async () => {
    const user = userEvent.setup();
    const onSelectGoal = jest.fn();

    render(
        <GoalDetailsPanel
          {...defaultProps}
          hasGoals={true}
          activeGoals={[mockGoal]}
          allGoals={[mockGoal, mockCompletedGoal]}
          selectedGoal={null}
          onSelectGoal={onSelectGoal}
        />
      );

    await user.click(screen.getByRole('button', { name: /open emergency fund details/i }));

    expect(onSelectGoal).toHaveBeenCalledWith('1');
  });

  it('shows "No goals yet" when no goals and no selectedGoal', () => {
    render(<GoalDetailsPanel {...defaultProps} hasGoals={false} selectedGoal={null} />);

    expect(screen.getByText('No goals yet')).toBeInTheDocument();
    expect(screen.getByText(/create your first goal/i)).toBeInTheDocument();
  });

  it('shows create goal button when no goals and onCreateGoal provided', async () => {
    const user = userEvent.setup();
    const onCreateGoal = jest.fn();
    render(
      <GoalDetailsPanel {...defaultProps} hasGoals={false} selectedGoal={null} onCreateGoal={onCreateGoal} />
    );

    const btn = screen.getByRole('button', { name: /create a goal/i });
    expect(btn).toBeInTheDocument();
    await user.click(btn);
    expect(onCreateGoal).toHaveBeenCalledTimes(1);
  });

  it('does not show create goal button when hasGoals is true', () => {
    render(
      <GoalDetailsPanel
        {...defaultProps}
        hasGoals={true}
        activeGoals={[mockGoal]}
        allGoals={[mockGoal, mockCompletedGoal]}
        selectedGoal={null}
      />
    );

    expect(screen.queryByRole('button', { name: /create a goal/i })).not.toBeInTheDocument();
  });

  it('renders goal detail content when selectedGoal is provided', () => {
    render(
      <GoalDetailsPanel {...defaultProps} selectedGoal={mockGoalDetails} />
    );

    expect(screen.getByTestId('goal-detail-header')).toBeInTheDocument();
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add operation/i })).toBeInTheDocument();
    expect(screen.getByTestId('goal-operations-table')).toBeInTheDocument();
  });

  it('returns to previews when close action is clicked from selected goal view', async () => {
    const user = userEvent.setup();
    const onClearSelection = jest.fn();

    render(
      <GoalDetailsPanel
        {...defaultProps}
        activeGoals={[mockGoal]}
        allGoals={[mockGoal, mockCompletedGoal]}
        selectedGoal={mockGoalDetails}
        onClearSelection={onClearSelection}
      />
    );

    await user.click(screen.getByTestId('close-goal-details'));

    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });

  it('removes scrollbar offset padding on mobile', () => {
    mockUseMediaQuery.mockReturnValue(true);

    render(
      <GoalDetailsPanel {...defaultProps} selectedGoal={mockGoalDetails} />
    );

    expect(screen.getByTestId('goal-details-scroll-area')).not.toHaveAttribute('data-offset-scrollbars');
  });

  it('uses xs card padding on mobile', () => {
    mockUseMediaQuery.mockReturnValue(true);

    render(
      <GoalDetailsPanel {...defaultProps} selectedGoal={mockGoalDetails} />
    );

    expect(screen.getByTestId('goal-details-card')).toHaveStyle({
      padding: 'var(--mantine-spacing-xs)',
    });
  });

  it('opens operation modal on "Add operation" click', async () => {
    const user = userEvent.setup();
    const actions = makeOperationActions();
    render(
      <GoalDetailsPanel {...defaultProps} selectedGoal={mockGoalDetails} operationActions={actions} />
    );

    await user.click(screen.getByRole('button', { name: /add operation/i }));

    expect(actions.form.reset).toHaveBeenCalledWith('USD');
  });

  describe('operation modal interactions', () => {
    it('closes operation modal and resets form', async () => {
      const user = userEvent.setup();
      const actions = makeOperationActions();
      render(
        <GoalDetailsPanel {...defaultProps} selectedGoal={mockGoalDetails} operationActions={actions} />
      );

      // Close the OperationModal via its onClose prop
      await user.click(screen.getByTestId('OperationModal-close'));

      expect(actions.form.reset).toHaveBeenCalledWith();
    });

    it('does not close operation modal when isUpdatingProgress', async () => {
      const user = userEvent.setup();
      const actions = makeOperationActions({ isUpdatingProgress: true });
      render(
        <GoalDetailsPanel {...defaultProps} selectedGoal={mockGoalDetails} operationActions={actions} />
      );

      await user.click(screen.getByTestId('OperationModal-close'));

      // reset should not be called when updating is in progress
      expect(actions.form.reset).not.toHaveBeenCalled();
    });

    it('calls onStartEdit and opens modal when editing operation', async () => {
      const user = userEvent.setup();
      const actions = makeOperationActions();
      render(
        <GoalDetailsPanel {...defaultProps} selectedGoal={mockGoalDetails} operationActions={actions} />
      );

      await user.click(screen.getByTestId('op-edit-btn'));

      expect(actions.onStartEdit).toHaveBeenCalledWith('op1');
    });

    it('calls onSubmit and closes modal on submit', async () => {
      const user = userEvent.setup();
      const actions = makeOperationActions();
      render(
        <GoalDetailsPanel {...defaultProps} selectedGoal={mockGoalDetails} operationActions={actions} />
      );

      await user.click(screen.getByTestId('OperationModal-submit'));

      expect(actions.onSubmit).toHaveBeenCalled();
    });
  });

  describe('delete operation flow', () => {
    it('sets pending delete when GoalOperationsTable onDelete is called', async () => {
      const user = userEvent.setup();
      const actions = makeOperationActions();
      render(
        <GoalDetailsPanel {...defaultProps} selectedGoal={mockGoalDetails} operationActions={actions} />
      );

      // Click the delete button exposed by GoalOperationsTable mock
      await user.click(screen.getByTestId('op-delete-btn'));

      // The DeleteOperationModal should now have the operation prop set
      // We verify by confirming the delete
      await user.click(screen.getByTestId('DeleteOperationModal-confirm'));

      expect(actions.onDelete).toHaveBeenCalledWith('op1');
    });

    it('closes delete modal when no pending operation and close clicked', async () => {
      const user = userEvent.setup();
      const actions = makeOperationActions();
      render(
        <GoalDetailsPanel {...defaultProps} selectedGoal={mockGoalDetails} operationActions={actions} />
      );

      // Click close without setting a pending operation - should just close
      await user.click(screen.getByTestId('DeleteOperationModal-close'));

      expect(actions.onDelete).not.toHaveBeenCalled();
    });
  });

  describe('chart modal', () => {
    it('triggers chart expand without error', async () => {
      const user = userEvent.setup();
      render(
        <GoalDetailsPanel {...defaultProps} selectedGoal={mockGoalDetails} />
      );

      // Click expand chart - exercises setIsChartModalOpen(true)
      await user.click(screen.getByTestId('expand-chart'));

      // Component should still be stable
      expect(screen.getByTestId('goal-detail-header')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getAllByTestId('dynamic-GoalChart')).toHaveLength(2);
      });
    });
  });
});
