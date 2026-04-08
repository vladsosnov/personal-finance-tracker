import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { GoalsList, type GoalManageMode } from '../goals-list';
import type { Goal } from '@/features/dashboard/types';
import { mockGoal, mockCompletedGoal } from '@/__tests__/mock-data';

// Mock useMediaQuery to return false (desktop)
jest.mock('@mantine/hooks', () => ({
  ...jest.requireActual('@mantine/hooks'),
  useMediaQuery: () => false,
}));

jest.mock('@/features/dashboard/components/GoalCard', () => ({
  GoalCard: ({
    goal, isSelected, onSelect, onEdit, onDelete,
    onDragStart, onDragOver, onDrop, onDragEnd,
    onTouchStart, onTouchMove, onTouchEnd,
  }: {
    goal: Goal; isSelected: boolean;
    onSelect: () => void; onEdit: () => void; onDelete: () => void;
    onDragStart: () => void; onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void; onDragEnd: () => void;
    onTouchStart?: () => void; onTouchMove?: (e: React.TouchEvent) => void; onTouchEnd?: () => void;
  }) => (
    <div
      data-testid={`goal-card-${goal.id}`}
      data-selected={isSelected}
      onClick={onSelect}
      role="button"
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver as unknown as React.DragEventHandler}
      onDrop={onDrop as unknown as React.DragEventHandler}
      onDragEnd={onDragEnd}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove as unknown as React.TouchEventHandler}
      onTouchEnd={onTouchEnd}
    >
      {goal.title}
      <button data-testid={`edit-${goal.id}`} onClick={onEdit}>Edit</button>
      <button data-testid={`delete-${goal.id}`} onClick={onDelete}>Delete</button>
    </div>
  ),
}));

const makeDrag = () => ({
  draggingGoalId: null as string | null,
  dragOverGoalId: null as string | null,
  handleDragStart: jest.fn(),
  handleDragOver: jest.fn(),
  handleDrop: jest.fn(),
  handleDragEnd: jest.fn(),
  handleTouchStart: jest.fn(),
  handleTouchMove: jest.fn(),
  handleTouchEnd: jest.fn(),
});

const makeManageMode = (overrides: Partial<GoalManageMode> = {}): GoalManageMode => ({
  isActive: false,
  onToggle: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  ...overrides,
});

const defaultProps = {
  goals: [mockGoal, mockCompletedGoal],
  isLoadingGoals: false,
  selectedGoalId: null as string | null,
  manageMode: makeManageMode(),
  drag: makeDrag(),
  onSelectGoal: jest.fn(),
};

describe('GoalsList', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders goal cards', () => {
    render(<GoalsList {...defaultProps} />);

    expect(screen.getByTestId('goal-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('goal-card-2')).toBeInTheDocument();
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('Vacation Fund')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    render(<GoalsList {...defaultProps} isLoadingGoals={true} />);

    expect(screen.getByRole('status', { name: /loading goals/i })).toBeInTheDocument();
  });

  it('shows error state with retry button', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    render(
      <GoalsList {...defaultProps} goals={[]} errorMessage="Network error" onRetry={onRetry} />
    );

    expect(screen.getByText("Couldn't load goals")).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no goals', () => {
    render(<GoalsList {...defaultProps} goals={[]} />);

    expect(screen.getByText('No goals yet')).toBeInTheDocument();
    expect(screen.getByText(/create your first goal/i)).toBeInTheDocument();
  });

  it('shows custom empty state', () => {
    render(
      <GoalsList
        {...defaultProps}
        goals={[]}
        emptyState={{ title: 'All done!', description: 'No completed goals.' }}
      />
    );

    expect(screen.getByText('All done!')).toBeInTheDocument();
    expect(screen.getByText('No completed goals.')).toBeInTheDocument();
  });

  it('calls onSelectGoal when goal card clicked', async () => {
    const user = userEvent.setup();
    const onSelectGoal = jest.fn();
    render(<GoalsList {...defaultProps} onSelectGoal={onSelectGoal} />);

    await user.click(screen.getByTestId('goal-card-1'));
    expect(onSelectGoal).toHaveBeenCalledWith('1');
  });

  it('marks selected goal card', () => {
    render(<GoalsList {...defaultProps} selectedGoalId="1" />);

    expect(screen.getByTestId('goal-card-1')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('goal-card-2')).toHaveAttribute('data-selected', 'false');
  });

  it('shows drag hint text on desktop with goals', () => {
    render(<GoalsList {...defaultProps} />);

    expect(screen.getByText(/drag and drop cards/i)).toBeInTheDocument();
  });

  it('shows manage mode toggle button', () => {
    render(<GoalsList {...defaultProps} />);

    expect(screen.getByRole('button', { name: /manage goals/i })).toBeInTheDocument();
  });

  it('toggles manage mode on button click', async () => {
    const user = userEvent.setup();
    const manageMode = makeManageMode();
    render(<GoalsList {...defaultProps} manageMode={manageMode} />);

    await user.click(screen.getByRole('button', { name: /manage goals/i }));
    expect(manageMode.onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows exit manage mode button when active', async () => {
    const user = userEvent.setup();
    const manageMode = makeManageMode({ isActive: true });
    render(<GoalsList {...defaultProps} manageMode={manageMode} />);

    const exitBtn = screen.getByRole('button', { name: /exit manage mode/i });
    expect(exitBtn).toBeInTheDocument();

    await user.click(exitBtn);
    expect(manageMode.onToggle).toHaveBeenCalledTimes(1);
  });

  it('hides manage toggle when showToggle is false', () => {
    render(<GoalsList {...defaultProps} manageMode={makeManageMode({ showToggle: false })} />);

    expect(screen.queryByRole('button', { name: /manage goals/i })).not.toBeInTheDocument();
  });

  describe('keyboard navigation', () => {
    const getScrollArea = () => document.querySelector('[data-mantine-stop-propagation]') ?? document.querySelector('[class*="ScrollArea"]')!;

    it('selects next goal on ArrowDown', () => {
      const onSelectGoal = jest.fn();
      render(<GoalsList {...defaultProps} selectedGoalId="1" onSelectGoal={onSelectGoal} />);

      const scrollArea = getScrollArea();
      scrollArea.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

      expect(onSelectGoal).toHaveBeenCalledWith('2');
    });

    it('selects previous goal on ArrowUp', () => {
      const onSelectGoal = jest.fn();
      render(<GoalsList {...defaultProps} selectedGoalId="2" onSelectGoal={onSelectGoal} />);

      const scrollArea = getScrollArea();
      scrollArea.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));

      expect(onSelectGoal).toHaveBeenCalledWith('1');
    });

    it('does not go below last goal on ArrowDown', () => {
      const onSelectGoal = jest.fn();
      render(<GoalsList {...defaultProps} selectedGoalId="2" onSelectGoal={onSelectGoal} />);

      const scrollArea = getScrollArea();
      scrollArea.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

      expect(onSelectGoal).not.toHaveBeenCalled();
    });

    it('does not go above first goal on ArrowUp', () => {
      const onSelectGoal = jest.fn();
      render(<GoalsList {...defaultProps} selectedGoalId="1" onSelectGoal={onSelectGoal} />);

      const scrollArea = getScrollArea();
      scrollArea.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));

      expect(onSelectGoal).not.toHaveBeenCalled();
    });

    it('ignores keyboard when no goals', () => {
      const onSelectGoal = jest.fn();
      render(<GoalsList {...defaultProps} goals={[]} onSelectGoal={onSelectGoal} />);

      const scrollArea = getScrollArea();
      scrollArea?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

      expect(onSelectGoal).not.toHaveBeenCalled();
    });
  });

  describe('drag and drop callbacks', () => {
    it('calls drag start and end handlers', () => {
      const drag = makeDrag();
      render(<GoalsList {...defaultProps} drag={drag} />);

      const card = screen.getByTestId('goal-card-1');

      card.dispatchEvent(new Event('dragstart', { bubbles: true }));
      expect(drag.handleDragStart).toHaveBeenCalledWith('1');

      card.dispatchEvent(new Event('dragend', { bubbles: true }));
      expect(drag.handleDragEnd).toHaveBeenCalled();
    });

    it('calls dragOver with preventDefault', () => {
      const drag = makeDrag();
      render(<GoalsList {...defaultProps} drag={drag} />);

      const card = screen.getByTestId('goal-card-1');
      const event = new Event('dragover', { bubbles: true, cancelable: true });
      card.dispatchEvent(event);

      expect(drag.handleDragOver).toHaveBeenCalledWith('1');
    });

    it('calls drop handler', () => {
      const drag = makeDrag();
      render(<GoalsList {...defaultProps} drag={drag} />);

      const card = screen.getByTestId('goal-card-1');
      const event = new Event('drop', { bubbles: true, cancelable: true });
      card.dispatchEvent(event);

      expect(drag.handleDrop).toHaveBeenCalledWith('1');
    });

    it('calls touch start, move and end handlers', () => {
      const drag = makeDrag();
      render(<GoalsList {...defaultProps} drag={drag} />);

      const card = screen.getByTestId('goal-card-1');

      card.dispatchEvent(new Event('touchstart', { bubbles: true }));
      expect(drag.handleTouchStart).toHaveBeenCalledWith('1');

      card.dispatchEvent(new TouchEvent('touchmove', { bubbles: true }));
      expect(drag.handleTouchMove).toHaveBeenCalled();

      card.dispatchEvent(new Event('touchend', { bubbles: true }));
      expect(drag.handleTouchEnd).toHaveBeenCalled();
    });

    it('does not call drag handlers when drag is disabled', () => {
      const drag = makeDrag();
      render(<GoalsList {...defaultProps} drag={drag} allowDrag={false} />);

      const card = screen.getByTestId('goal-card-1');
      card.dispatchEvent(new Event('dragstart', { bubbles: true }));

      expect(drag.handleDragStart).not.toHaveBeenCalled();
    });
  });

  describe('manage mode actions', () => {
    it('calls onEdit when edit button clicked in manage mode', async () => {
      const user = userEvent.setup();
      const manageMode = makeManageMode({ isActive: true });
      render(<GoalsList {...defaultProps} manageMode={manageMode} />);

      await user.click(screen.getByTestId('edit-1'));
      expect(manageMode.onEdit).toHaveBeenCalledWith('1');
    });

    it('calls onDelete when delete button clicked in manage mode', async () => {
      const user = userEvent.setup();
      const manageMode = makeManageMode({ isActive: true });
      render(<GoalsList {...defaultProps} manageMode={manageMode} />);

      await user.click(screen.getByTestId('delete-1'));
      expect(manageMode.onDelete).toHaveBeenCalledWith('1');
    });
  });
});
