import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { CompleteGoalModal } from '../CompleteGoalModal';
import { mockGoal } from '@/__tests__/mock-data';

describe('CompleteGoalModal', () => {
  const defaultProps = {
    goal: mockGoal,
    isLoading: false,
    onConfirm: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when goal is provided', () => {
    render(<CompleteGoalModal {...defaultProps} />);

    expect(screen.getByText('Complete goal?')).toBeInTheDocument();
    expect(screen.getByText(mockGoal.title)).toBeInTheDocument();
    expect(screen.getByText(/reached its target/i)).toBeInTheDocument();
  });

  it('does not render when goal is null', () => {
    render(<CompleteGoalModal {...defaultProps} goal={null} />);

    expect(screen.queryByText('Complete goal?')).not.toBeInTheDocument();
  });

  it('calls onConfirm when complete button clicked', async () => {
    const user = userEvent.setup();
    render(<CompleteGoalModal {...defaultProps} />);

    const completeButton = screen.getByRole('button', { name: /complete/i });
    await user.click(completeButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when keep active button clicked', async () => {
    const user = userEvent.setup();
    render(<CompleteGoalModal {...defaultProps} />);

    const keepActiveButton = screen.getByRole('button', { name: /keep active/i });
    await user.click(keepActiveButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on complete button', () => {
    render(<CompleteGoalModal {...defaultProps} isLoading={true} />);

    const completeButton = screen.getByRole('button', { name: /complete/i });
    expect(completeButton).toHaveAttribute('data-loading', 'true');
  });

  it('disables keep active button when loading', () => {
    render(<CompleteGoalModal {...defaultProps} isLoading={true} />);

    const keepActiveButton = screen.getByRole('button', { name: /keep active/i });
    expect(keepActiveButton).toBeDisabled();
  });

  it('displays fallback text when goal has no title', () => {
    render(<CompleteGoalModal {...defaultProps} goal={{ ...mockGoal, title: '' }} />);

    expect(screen.getByText(/has reached its target/i)).toBeInTheDocument();
  });

  it('prevents modal close when loading', () => {
    const { baseElement } = render(<CompleteGoalModal {...defaultProps} isLoading={true} />);

    const overlay = baseElement.querySelector('.mantine-Modal-overlay');
    if (overlay) {
      (overlay as HTMLElement).click();
    }

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('allows modal close when not loading', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<CompleteGoalModal {...defaultProps} />);

    const closeButton = baseElement.querySelector('.mantine-Modal-close') as HTMLElement;
    await user.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
