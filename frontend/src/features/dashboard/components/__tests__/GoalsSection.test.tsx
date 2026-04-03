import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { GoalsSection } from '../GoalsSection';
import { mockGoal, mockCompletedGoal } from '@/__tests__/mock-data';

const defaultDrag = {
  draggingGoalId: null,
  dragOverGoalId: null,
  handleDragStart: jest.fn(),
  handleDragOver: jest.fn(),
  handleDrop: jest.fn(),
  handleDragEnd: jest.fn(),
};

const defaultManageMode = {
  isActive: false,
  showToggle: true as const,
  canManage: true,
  onToggle: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
};

const defaultProps = {
  activeGoals: [mockGoal],
  completedGoals: [],
  visibleGoals: [mockGoal],
  isLoadingGoals: false,
  selectedGoalId: null,
  goalStatusTab: 'active' as const,
  goalsError: null,
  emptyState: { title: 'No goals yet', description: 'Create one.' },
  manageMode: defaultManageMode,
  drag: defaultDrag,
  onSelectGoal: jest.fn(),
  onTabChange: jest.fn(),
  onRetry: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('GoalsSection', () => {
  it('renders active tab with count', () => {
    render(<GoalsSection {...defaultProps} />);
    expect(screen.getByRole('tab', { name: /in progress \(1\)/i })).toBeInTheDocument();
  });

  it('renders completed tab with count', () => {
    render(<GoalsSection {...defaultProps} completedGoals={[mockCompletedGoal]} />);
    expect(screen.getByRole('tab', { name: /completed \(1\)/i })).toBeInTheDocument();
  });

  it('disables completed tab when no completed goals', () => {
    render(<GoalsSection {...defaultProps} completedGoals={[]} />);
    expect(screen.getByRole('tab', { name: /completed \(0\)/i })).toBeDisabled();
  });

  it('enables completed tab when completed goals exist', () => {
    render(<GoalsSection {...defaultProps} completedGoals={[mockCompletedGoal]} />);
    expect(screen.getByRole('tab', { name: /completed \(1\)/i })).not.toBeDisabled();
  });

  it('calls onTabChange when tab clicked', async () => {
    const user = userEvent.setup();
    render(<GoalsSection {...defaultProps} completedGoals={[mockCompletedGoal]} />);
    await user.click(screen.getByRole('tab', { name: /completed/i }));
    expect(defaultProps.onTabChange).toHaveBeenCalledWith('completed');
  });

  it('renders goals list', () => {
    render(<GoalsSection {...defaultProps} />);
    expect(screen.getByText(mockGoal.title)).toBeInTheDocument();
  });

  it('calls onSelectGoal when goal clicked', async () => {
    const user = userEvent.setup();
    render(<GoalsSection {...defaultProps} />);
    await user.click(screen.getByText(mockGoal.title));
    expect(defaultProps.onSelectGoal).toHaveBeenCalledWith(mockGoal.id);
  });

  it('shows active tab selected', () => {
    render(<GoalsSection {...defaultProps} goalStatusTab="active" />);
    expect(screen.getByRole('tab', { name: /in progress/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('shows error message when goalsError present and no visible goals', () => {
    render(<GoalsSection {...defaultProps} visibleGoals={[]} goalsError={new Error('Network error')} />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('shows empty state when no goals and no error', () => {
    render(<GoalsSection {...defaultProps} visibleGoals={[]} activeGoals={[]} goalsError={null} />);
    expect(screen.getByText('No goals yet')).toBeInTheDocument();
  });
});
