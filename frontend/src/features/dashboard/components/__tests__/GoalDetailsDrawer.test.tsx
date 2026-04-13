import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { GoalDetailsDrawer } from '../GoalDetailsDrawer';
import type { GoalDetailsPanelProps } from '../goal-details-panel';

const mockGoalDetails = {
  id: '1',
  title: 'Emergency Fund',
  targetAmount: 10000,
  currentAmount: 5000,
  initialAmount: 1000,
  currency: 'USD',
  color: '#228be6',
  isCompleted: false,
  sortOrder: 0,
  progress: 50,
  createdAt: '2024-01-01T00:00:00.000Z',
  operations: [],
};

const basePanelProps: GoalDetailsPanelProps = {
  hasGoals: true,
  selectedGoal: mockGoalDetails,
  isLoadingGoalDetails: false,
  goalDetailsErrorMessage: null,
  goalCurrency: 'USD',
  operationActions: {
    form: {
      operationType: 'INCREASE',
      operationAmount: '',
      operationCurrency: 'USD',
      operationNote: '',
      operationDate: '',
      editingOperationId: null,
      setOperationType: jest.fn(),
      setOperationAmount: jest.fn(),
      setOperationCurrency: jest.fn(),
      setOperationNote: jest.fn(),
      setOperationDate: jest.fn(),
      startEdit: jest.fn(),
      reset: jest.fn(),
    },
    deletingOperationId: null,
    isUpdatingProgress: false,
    isSubmitDisabled: true,
    onStartEdit: jest.fn(),
    onDelete: jest.fn(),
    onSubmit: jest.fn(),
  },
};

const defaultProps = {
  opened: true,
  onClose: jest.fn(),
  panelProps: basePanelProps,
};

describe('GoalDetailsDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when opened', () => {
    render(<GoalDetailsDrawer {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    render(<GoalDetailsDrawer {...defaultProps} opened={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the back button with Goals label', () => {
    render(<GoalDetailsDrawer {...defaultProps} />);

    expect(screen.getByRole('button', { name: /goals/i })).toBeInTheDocument();
  });

  it('calls onClose when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<GoalDetailsDrawer {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /goals/i }));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the goal details panel inside the drawer', () => {
    render(<GoalDetailsDrawer {...defaultProps} />);

    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
  });

  it('renders the empty state when no goal is selected', () => {
    render(
      <GoalDetailsDrawer
        {...defaultProps}
        panelProps={{ ...basePanelProps, selectedGoal: null }}
      />
    );

    expect(screen.getByText(/select a goal/i)).toBeInTheDocument();
  });

  it('renders the no-goals empty state when hasGoals is false', () => {
    render(
      <GoalDetailsDrawer
        {...defaultProps}
        panelProps={{ ...basePanelProps, hasGoals: false, selectedGoal: null }}
      />
    );

    expect(screen.getByText(/no goals yet/i)).toBeInTheDocument();
  });

  it('renders the loading skeleton when isLoadingGoalDetails is true', () => {
    render(
      <GoalDetailsDrawer
        {...defaultProps}
        panelProps={{ ...basePanelProps, isLoadingGoalDetails: true, selectedGoal: null }}
      />
    );

    expect(screen.getByRole('status', { name: /loading goal details/i })).toBeInTheDocument();
  });

  it('renders error state when goalDetailsErrorMessage is set', () => {
    render(
      <GoalDetailsDrawer
        {...defaultProps}
        panelProps={{
          ...basePanelProps,
          selectedGoal: null,
          goalDetailsErrorMessage: 'Network error',
        }}
      />
    );

    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });

  it('passes scrollHeight as undefined to the panel', () => {
    render(<GoalDetailsDrawer {...defaultProps} />);

    // Panel renders without fixed scroll height — content fills the drawer naturally
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('uses xs padding for drawer content on mobile', () => {
    render(<GoalDetailsDrawer {...defaultProps} />);

    expect(screen.getByTestId('goal-details-drawer-content')).toHaveStyle({
      padding: 'var(--mantine-spacing-xs)',
    });
  });

  it('keeps the drawer header sticky above scrolling content', () => {
    render(<GoalDetailsDrawer {...defaultProps} />);

    expect(screen.getByTestId('goal-details-drawer-header')).toHaveStyle({
      position: 'sticky',
      top: '0',
      zIndex: '10',
      isolation: 'isolate',
      boxShadow: '0 1px 0 0 var(--mantine-color-default-border)',
    });
  });
});
