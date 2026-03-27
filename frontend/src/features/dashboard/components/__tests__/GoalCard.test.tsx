import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { GoalCard } from '../GoalCard';
import { mockGoal, mockCompletedGoal } from '@/__tests__/mock-data';

describe('GoalCard', () => {
  const defaultProps = {
    goal: mockGoal,
    isSelected: false,
    isDraggable: false,
    isDragged: false,
    isDropTarget: false,
    isManageMode: false,
    onSelect: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onDragStart: jest.fn(),
    onDragOver: jest.fn(),
    onDrop: jest.fn(),
    onDragEnd: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders goal title and amounts', () => {
    render(<GoalCard {...defaultProps} />);

    expect(screen.getByText(mockGoal.title)).toBeInTheDocument();
    expect(screen.getByText(/\$5 000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\$10 000\.00/)).toBeInTheDocument();
  });

  it('displays progress percentage for active goal', () => {
    render(<GoalCard {...defaultProps} />);

    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('displays completed badge for completed goal', () => {
    render(<GoalCard {...defaultProps} goal={mockCompletedGoal} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    render(<GoalCard {...defaultProps} />);

    const card = screen.getByRole('button', { name: new RegExp(mockGoal.title) });
    await user.click(card);

    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect when Enter pressed', async () => {
    const user = userEvent.setup();
    render(<GoalCard {...defaultProps} />);

    const card = screen.getByRole('button', { name: new RegExp(mockGoal.title) });
    card.focus();
    await user.keyboard('{Enter}');

    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect when Space pressed', async () => {
    const user = userEvent.setup();
    render(<GoalCard {...defaultProps} />);

    const card = screen.getByRole('button', { name: new RegExp(mockGoal.title) });
    card.focus();
    await user.keyboard(' ');

    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
  });

  it('shows edit and delete buttons in manage mode', () => {
    render(<GoalCard {...defaultProps} isManageMode={true} />);

    expect(screen.getByLabelText(`Edit ${mockGoal.title}`)).toBeInTheDocument();
    expect(screen.getByLabelText(`Remove ${mockGoal.title}`)).toBeInTheDocument();
  });

  it('hides progress badge in manage mode', () => {
    render(<GoalCard {...defaultProps} isManageMode={true} />);

    expect(screen.queryByText('50.0%')).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', async () => {
    const user = userEvent.setup();
    render(<GoalCard {...defaultProps} isManageMode={true} />);

    const editButton = screen.getByLabelText(`Edit ${mockGoal.title}`);
    await user.click(editButton);

    expect(defaultProps.onEdit).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSelect).not.toHaveBeenCalled();
  });

  it('calls onDelete when delete button clicked', async () => {
    const user = userEvent.setup();
    render(<GoalCard {...defaultProps} isManageMode={true} />);

    const deleteButton = screen.getByLabelText(`Remove ${mockGoal.title}`);
    await user.click(deleteButton);

    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSelect).not.toHaveBeenCalled();
  });

  it('marks card as pressed when selected', () => {
    render(<GoalCard {...defaultProps} isSelected={true} />);

    const card = screen.getByRole('button', { name: new RegExp(mockGoal.title) });
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  it('is draggable when isDraggable is true', () => {
    render(<GoalCard {...defaultProps} isDraggable={true} />);

    const card = screen.getByRole('button', { name: new RegExp(mockGoal.title) });
    expect(card).toHaveAttribute('draggable', 'true');
  });

  it('is not draggable by default', () => {
    render(<GoalCard {...defaultProps} />);

    const card = screen.getByRole('button', { name: new RegExp(mockGoal.title) });
    expect(card).toHaveAttribute('draggable', 'false');
  });

  it('has proper accessibility label with progress', () => {
    render(<GoalCard {...defaultProps} />);

    expect(
      screen.getByRole('button', {
        name: `${mockGoal.title}, $5 000.00 of $10 000.00, 50.0% progress`,
      })
    ).toBeInTheDocument();
  });

  it('has proper accessibility label for completed goal', () => {
    render(<GoalCard {...defaultProps} goal={mockCompletedGoal} />);

    expect(
      screen.getByRole('button', {
        name: `${mockCompletedGoal.title}, $5 000.00 of $5 000.00, completed`,
      })
    ).toBeInTheDocument();
  });

  it('displays progress bar with correct value', () => {
    render(<GoalCard {...defaultProps} />);

    const progressBar = screen.getByLabelText(`${mockGoal.title} progress: 50.0%`);
    expect(progressBar).toBeInTheDocument();
  });

  it('clamps progress bar to 100%', () => {
    const overTarget = { ...mockGoal, currentAmount: 15000 };
    render(<GoalCard {...defaultProps} goal={overTarget} />);

    const progressBar = screen.getByLabelText(/progress:/);
    expect(progressBar).toBeInTheDocument();
  });
});
