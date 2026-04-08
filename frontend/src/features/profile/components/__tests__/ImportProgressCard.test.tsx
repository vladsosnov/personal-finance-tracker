import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { ImportProgressCard } from '../ImportProgressCard';
import type { PreparedImportGoal, SkippedImportGoal, ImportProgressState } from '@/features/profile/types';

const defaultProps = {
  file: null as File | null,
  preparedGoals: [] as PreparedImportGoal[],
  skippedGoals: [] as SkippedImportGoal[],
  importTotals: { goals: 0, operations: 0 },
  importProgress: null as ImportProgressState | null,
  importProgressValue: 0,
  importLimitMessage: null as string | null,
  isImportOverLimit: false,
  isPreparingImport: false,
  isImporting: false,
  includedZeroTargetGoalIndexes: [] as number[],
  onFileChange: jest.fn(),
  onImport: jest.fn(),
  onToggleZeroTargetGoal: jest.fn(),
  onRemoveFromImport: jest.fn(),
};

const mockPreparedGoal: PreparedImportGoal = {
  sourceIndex: 0,
  title: 'Emergency Fund',
  targetAmount: 10000,
  initialAmount: 500,
  currency: 'USD',
  color: '#228be6',
  operationCount: 3,
  operations: [],
  canRemoveFromImport: true,
};

const mockSkippedGoal: SkippedImportGoal = {
  sourceIndex: 1,
  title: 'Vacation',
  reason: 'Target amount is missing or zero',
  canInclude: true,
};

describe('ImportProgressCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the card title and description', () => {
    render(<ImportProgressCard {...defaultProps} />);

    expect(screen.getByText('Import progress')).toBeInTheDocument();
    expect(screen.getByText(/reads the exported json/i)).toBeInTheDocument();
  });

  it('renders file input', () => {
    render(<ImportProgressCard {...defaultProps} />);

    expect(screen.getByLabelText(/progress file/i)).toBeInTheDocument();
  });

  it('renders expected file format hint', () => {
    render(<ImportProgressCard {...defaultProps} />);

    expect(screen.getByText('Expected file format')).toBeInTheDocument();
  });

  it('does not show import action button when no file selected', () => {
    render(<ImportProgressCard {...defaultProps} />);

    expect(screen.queryByRole('button', { name: /^import$/i })).not.toBeInTheDocument();
  });

  it('shows import action button when file is selected', () => {
    const file = new File(['[]'], 'test.txt', { type: 'text/plain' });
    render(<ImportProgressCard {...defaultProps} file={file} preparedGoals={[mockPreparedGoal]} />);

    expect(screen.getByRole('button', { name: /^import$/i })).toBeInTheDocument();
  });

  it('disables import action button when no prepared goals', () => {
    const file = new File(['[]'], 'test.txt', { type: 'text/plain' });
    render(<ImportProgressCard {...defaultProps} file={file} preparedGoals={[]} />);

    expect(screen.getByRole('button', { name: /^import$/i })).toBeDisabled();
  });

  it('disables import action button when over limit', () => {
    const file = new File(['[]'], 'test.txt', { type: 'text/plain' });
    render(
      <ImportProgressCard
        {...defaultProps}
        file={file}
        preparedGoals={[mockPreparedGoal]}
        isImportOverLimit={true}
        importLimitMessage="Free plan is limited to 3 goals."
      />
    );

    expect(screen.getByRole('button', { name: /^import$/i })).toBeDisabled();
    expect(screen.getByText('Free plan is limited to 3 goals.')).toBeInTheDocument();
  });

  it('renders prepared goals table', () => {
    render(<ImportProgressCard {...defaultProps} preparedGoals={[mockPreparedGoal]} importTotals={{ goals: 1, operations: 3 }} />);

    expect(screen.getByText(/ready to import 1 goals and 3 operations/i)).toBeInTheDocument();
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /goals ready to import/i })).toBeInTheDocument();
  });

  it('renders remove button for removable goals', async () => {
    const user = userEvent.setup();
    render(<ImportProgressCard {...defaultProps} preparedGoals={[mockPreparedGoal]} />);

    const removeBtn = screen.getByRole('button', { name: /remove emergency fund/i });
    expect(removeBtn).toBeInTheDocument();

    await user.click(removeBtn);
    expect(defaultProps.onRemoveFromImport).toHaveBeenCalledWith(0);
  });

  it('renders skipped goals table', () => {
    render(<ImportProgressCard {...defaultProps} skippedGoals={[mockSkippedGoal]} />);

    expect(screen.getByText('Skipped items')).toBeInTheDocument();
    expect(screen.getByText('Vacation')).toBeInTheDocument();
    expect(screen.getByText('Target amount is missing or zero')).toBeInTheDocument();
  });

  it('renders include checkbox for skipped goals that can be included', async () => {
    const user = userEvent.setup();
    render(<ImportProgressCard {...defaultProps} skippedGoals={[mockSkippedGoal]} />);

    const checkbox = screen.getByRole('checkbox', { name: /include vacation/i });
    expect(checkbox).toBeInTheDocument();

    await user.click(checkbox);
    expect(defaultProps.onToggleZeroTargetGoal).toHaveBeenCalledWith(1, true);
  });

  it('renders import progress bar when importing', () => {
    render(
      <ImportProgressCard
        {...defaultProps}
        isImporting={true}
        importProgress={{ completedSteps: 1, totalSteps: 3, currentLabel: 'Sending import request...' }}
        importProgressValue={33}
      />
    );

    expect(screen.getByText('Importing progress')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByText('Sending import request...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /import progress/i })).toBeInTheDocument();
  });

  it('calls onImport when import button clicked', async () => {
    const user = userEvent.setup();
    const file = new File(['[]'], 'test.txt', { type: 'text/plain' });
    render(<ImportProgressCard {...defaultProps} file={file} preparedGoals={[mockPreparedGoal]} />);

    await user.click(screen.getByRole('button', { name: /^import$/i }));
    expect(defaultProps.onImport).toHaveBeenCalledTimes(1);
  });
});
