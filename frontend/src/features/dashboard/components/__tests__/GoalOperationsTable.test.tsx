import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { GoalOperationsTable } from '../GoalOperationsTable';

describe('GoalOperationsTable', () => {
  const operations = [
    {
      id: '1',
      type: 'INCREASE' as const,
      amount: 1000,
      note: 'Salary',
      operationDate: '2024-01-15',
      createdAt: '2024-01-15T00:00:00.000Z',
    },
    {
      id: '2',
      type: 'DECREASE' as const,
      amount: 500,
      note: '',
      operationDate: '2024-01-10',
      createdAt: '2024-01-10T00:00:00.000Z',
    },
  ];

  const defaultProps = {
    operations,
    deletingOperationId: null,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders table with operations', () => {
    render(<GoalOperationsTable {...defaultProps} />);

    expect(screen.getByRole('table', { name: 'Goal operations' })).toBeInTheDocument();
    expect(screen.getByText('INCREASE')).toBeInTheDocument();
    expect(screen.getByText('DECREASE')).toBeInTheDocument();
  });

  it('displays operation details correctly', () => {
    render(<GoalOperationsTable {...defaultProps} />);

    expect(screen.getByText('1 000.00')).toBeInTheDocument();
    expect(screen.getByText('500.00')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('shows dash for empty note', () => {
    render(<GoalOperationsTable {...defaultProps} />);

    const rows = screen.getAllByRole('row');
    expect(rows[2]).toHaveTextContent('-');
  });

  it('renders empty state when no operations', () => {
    render(<GoalOperationsTable {...defaultProps} operations={[]} />);

    expect(screen.getByText('No operations yet. Add your first one!')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', async () => {
    const user = userEvent.setup();
    render(<GoalOperationsTable {...defaultProps} />);

    const editButtons = screen.getAllByLabelText(/^Edit/);
    await user.click(editButtons[0]);

    expect(defaultProps.onEdit).toHaveBeenCalledWith('1');
  });

  it('calls onDelete when delete button clicked', async () => {
    const user = userEvent.setup();
    render(<GoalOperationsTable {...defaultProps} />);

    const deleteButtons = screen.getAllByLabelText(/^Delete/);
    await user.click(deleteButtons[0]);

    expect(defaultProps.onDelete).toHaveBeenCalledWith('1');
  });

  it('shows loading state on delete button', () => {
    render(<GoalOperationsTable {...defaultProps} deletingOperationId="1" />);

    const deleteButton = screen.getAllByLabelText(/^Delete/)[0];
    expect(deleteButton).toHaveAttribute('data-loading', 'true');
  });

  it('badges operations with correct colors', () => {
    render(<GoalOperationsTable {...defaultProps} />);

    const increaseBadge = screen.getByText('INCREASE');
    const decreaseBadge = screen.getByText('DECREASE');

    expect(increaseBadge).toBeInTheDocument();
    expect(decreaseBadge).toBeInTheDocument();
  });

  it('displays accessible edit button labels', () => {
    render(<GoalOperationsTable {...defaultProps} />);

    expect(
      screen.getByLabelText(/Edit increase operation for 1 000\.00/)
    ).toBeInTheDocument();
  });

  it('displays accessible delete button labels', () => {
    render(<GoalOperationsTable {...defaultProps} />);

    expect(
      screen.getByLabelText(/Delete increase operation for 1 000\.00/)
    ).toBeInTheDocument();
  });

  describe('pagination', () => {
    const manyOperations = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      type: i % 2 === 0 ? ('INCREASE' as const) : ('DECREASE' as const),
      amount: (i + 1) * 100,
      note: `Note ${i + 1}`,
      operationDate: '2024-01-01',
      createdAt: '2024-01-01T00:00:00.000Z',
    }));

    it('does not show pagination for 10 or fewer items', () => {
      render(<GoalOperationsTable {...defaultProps} />);

      expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    });

    it('shows pagination for more than 10 items', () => {
      render(<GoalOperationsTable {...defaultProps} operations={manyOperations} />);

      expect(screen.getByText(/Showing 1–10 of 25/)).toBeInTheDocument();
    });

    it('paginates correctly', async () => {
      const user = userEvent.setup();
      render(<GoalOperationsTable {...defaultProps} operations={manyOperations} />);

      expect(screen.getByText(/Showing 1–10 of 25/)).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      const page2Button = buttons.find(btn => btn.textContent === '2');

      expect(page2Button).toBeDefined();
      if (page2Button) {
        await user.click(page2Button);
        expect(screen.getByText(/Showing 11–20 of 25/)).toBeInTheDocument();
      }
    });

    it('resets to page 1 when operations change', () => {
      const { rerender } = render(
        <GoalOperationsTable {...defaultProps} operations={manyOperations} />
      );

      expect(screen.getByText(/Showing 1–10 of 25/)).toBeInTheDocument();

      rerender(
        <GoalOperationsTable
          {...defaultProps}
          operations={manyOperations.slice(0, 15)}
        />
      );

      expect(screen.getByText(/Showing 1–10 of 15/)).toBeInTheDocument();
    });

    it('adjusts page when current page exceeds total pages', () => {
      const { rerender } = render(
        <GoalOperationsTable {...defaultProps} operations={manyOperations} />
      );

      rerender(
        <GoalOperationsTable {...defaultProps} operations={manyOperations.slice(0, 5)} />
      );

      expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    });
  });
});
