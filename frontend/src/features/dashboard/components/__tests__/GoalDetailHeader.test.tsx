import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { GoalDetailHeader } from '../GoalDetailHeader';
import { mockGoal, mockCompletedGoal } from '@/__tests__/mock-data';

describe('GoalDetailHeader', () => {
  const goalWithOperations = {
    ...mockGoal,
    operations: [],
  };

  const defaultProps = {
    goal: goalWithOperations,
    chartRange: 'all' as const,
    showTrend: false,
    isRangePickerOpen: false,
    onToggleRangePicker: jest.fn(),
    onChangeRange: jest.fn(),
    onToggleTrend: jest.fn(),
    onExpandChart: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders goal title', () => {
    render(<GoalDetailHeader {...defaultProps} />);

    expect(screen.getByRole('heading', { name: mockGoal.title })).toBeInTheDocument();
  });

  it('does not show completed badge for active goal', () => {
    render(<GoalDetailHeader {...defaultProps} />);

    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
  });

  it('shows completed badge for completed goal', () => {
    const completedGoalWithOps = { ...mockCompletedGoal, operations: [] };
    render(<GoalDetailHeader {...defaultProps} goal={completedGoalWithOps} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows completion date when available', () => {
    const goalWithDate = {
      ...mockCompletedGoal,
      completedAt: '2024-01-15T10:00:00.000Z',
      operations: [],
    };
    render(<GoalDetailHeader {...defaultProps} goal={goalWithDate} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
  });

  it('does not show completion date when not available', () => {
    const goalWithoutDate = {
      ...mockCompletedGoal,
      completedAt: undefined,
      operations: [],
    };
    render(<GoalDetailHeader {...defaultProps} goal={goalWithoutDate} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.queryByText(/\d+\/\d+\/\d+/)).not.toBeInTheDocument();
  });

  it('renders chart range picker', () => {
    render(<GoalDetailHeader {...defaultProps} />);

    expect(screen.getByRole('button', { name: /chart range/i })).toBeInTheDocument();
  });

  it('renders expand chart button', () => {
    render(<GoalDetailHeader {...defaultProps} />);

    expect(screen.getByLabelText('Expand chart')).toBeInTheDocument();
  });

  it('calls onExpandChart when expand button clicked', async () => {
    const user = userEvent.setup();
    render(<GoalDetailHeader {...defaultProps} />);

    const expandButton = screen.getByLabelText('Expand chart');
    await user.click(expandButton);

    expect(defaultProps.onExpandChart).toHaveBeenCalledTimes(1);
  });

  it('passes chartRange to picker', () => {
    render(<GoalDetailHeader {...defaultProps} chartRange="7d" />);

    expect(screen.getByText('7D')).toBeInTheDocument();
  });

  it('passes isRangePickerOpen to picker', () => {
    render(<GoalDetailHeader {...defaultProps} isRangePickerOpen={true} />);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('calls onToggleRangePicker when picker toggled', async () => {
    const user = userEvent.setup();
    render(<GoalDetailHeader {...defaultProps} />);

    const pickerButton = screen.getByRole('button', { name: /chart range/i });
    await user.click(pickerButton);

    expect(defaultProps.onToggleRangePicker).toHaveBeenCalledTimes(1);
  });

  it('calls onChangeRange and onToggleRangePicker when range changed', async () => {
    const user = userEvent.setup();
    render(<GoalDetailHeader {...defaultProps} isRangePickerOpen={true} />);

    const option = screen.getByRole('option', { name: '7D' });
    await user.click(option);

    expect(defaultProps.onChangeRange).toHaveBeenCalledWith('7d');
    expect(defaultProps.onToggleRangePicker).toHaveBeenCalledTimes(1);
  });
});
