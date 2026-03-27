import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { DataManagementCard } from '../DataManagementCard';

describe('DataManagementCard', () => {
  const defaultProps = {
    hasStoredData: true,
    isLoadingGoals: false,
    goalsError: undefined,
    isExportingAllData: false,
    onExport: jest.fn(),
    onOpenResetModal: jest.fn(),
    onRetry: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders data management section', () => {
    render(<DataManagementCard {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /data management/i })).toBeInTheDocument();
    expect(screen.getByText(/export your goals/i)).toBeInTheDocument();
  });

  it('renders export and reset buttons', () => {
    render(<DataManagementCard {...defaultProps} />);

    expect(screen.getByRole('button', { name: /export all data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset all data/i })).toBeInTheDocument();
  });

  it('calls onExport when export button clicked', async () => {
    const user = userEvent.setup();
    render(<DataManagementCard {...defaultProps} />);

    const exportButton = screen.getByRole('button', { name: /export all data/i });
    await user.click(exportButton);

    expect(defaultProps.onExport).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenResetModal when reset button clicked', async () => {
    const user = userEvent.setup();
    render(<DataManagementCard {...defaultProps} />);

    const resetButton = screen.getByRole('button', { name: /reset all data/i });
    await user.click(resetButton);

    expect(defaultProps.onOpenResetModal).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when no stored data', () => {
    render(<DataManagementCard {...defaultProps} hasStoredData={false} />);

    const exportButton = screen.getByRole('button', { name: /export all data/i });
    const resetButton = screen.getByRole('button', { name: /reset all data/i });

    expect(exportButton).toBeDisabled();
    expect(resetButton).toBeDisabled();
  });

  it('disables buttons when loading goals', () => {
    render(<DataManagementCard {...defaultProps} isLoadingGoals={true} />);

    const exportButton = screen.getByRole('button', { name: /export all data/i });
    const resetButton = screen.getByRole('button', { name: /reset all data/i });

    expect(exportButton).toBeDisabled();
    expect(resetButton).toBeDisabled();
  });

  it('disables buttons when goals error', () => {
    const error = new Error('Failed to load');
    render(<DataManagementCard {...defaultProps} goalsError={error} />);

    const exportButton = screen.getByRole('button', { name: /export all data/i });
    const resetButton = screen.getByRole('button', { name: /reset all data/i });

    expect(exportButton).toBeDisabled();
    expect(resetButton).toBeDisabled();
  });

  it('shows loading state on export button', () => {
    render(<DataManagementCard {...defaultProps} isExportingAllData={true} />);

    const exportButton = screen.getByRole('button', { name: /export all data/i });
    expect(exportButton).toHaveAttribute('data-loading', 'true');
  });

  it('displays error message when goals error', () => {
    const error = new Error('Network connection failed');
    render(<DataManagementCard {...defaultProps} goalsError={error} />);

    expect(screen.getByText("Couldn't load saved data")).toBeInTheDocument();
    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
  });

  it('shows retry button on error', async () => {
    const user = userEvent.setup();
    const error = new Error('Network error');
    render(<DataManagementCard {...defaultProps} goalsError={error} />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    expect(defaultProps.onRetry).toHaveBeenCalledTimes(1);
  });

  it('enables buttons when has data and no errors', () => {
    render(<DataManagementCard {...defaultProps} />);

    const exportButton = screen.getByRole('button', { name: /export all data/i });
    const resetButton = screen.getByRole('button', { name: /reset all data/i });

    expect(exportButton).not.toBeDisabled();
    expect(resetButton).not.toBeDisabled();
  });
});
