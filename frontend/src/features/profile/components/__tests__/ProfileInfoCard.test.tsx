import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { ProfileInfoCard } from '../ProfileInfoCard';

describe('ProfileInfoCard', () => {
  const defaultProps = {
    email: 'user@example.com',
    subscription: 'Pro',
    isLoading: false,
    error: undefined,
    onRetry: jest.fn(),
    onDeleteAccount: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile information', () => {
    render(<ProfileInfoCard {...defaultProps} />);

    expect(screen.getByText('Personal information')).toBeInTheDocument();
    expect(screen.getByText('Email:')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText('Subscription:')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('displays dash when email is undefined', () => {
    render(<ProfileInfoCard {...defaultProps} email={undefined} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('defaults to Free subscription when undefined', () => {
    render(<ProfileInfoCard {...defaultProps} subscription={undefined} />);

    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('renders delete account button', () => {
    render(<ProfileInfoCard {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    expect(deleteButton).toBeInTheDocument();
  });

  it('calls onDeleteAccount when delete button clicked', async () => {
    const user = userEvent.setup();
    render(<ProfileInfoCard {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    await user.click(deleteButton);

    expect(defaultProps.onDeleteAccount).toHaveBeenCalledTimes(1);
  });

  it('shows loading skeleton when loading', () => {
    render(<ProfileInfoCard {...defaultProps} isLoading={true} />);

    const loadingStatus = screen.getByRole('status', { name: /loading profile/i });
    expect(loadingStatus).toBeInTheDocument();
    expect(screen.queryByText('Email:')).not.toBeInTheDocument();
  });

  it('displays error state with retry button', () => {
    const error = new Error('Network error');
    render(<ProfileInfoCard {...defaultProps} error={error} />);

    expect(screen.getByText("Couldn't load profile")).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls onRetry when retry button clicked', async () => {
    const user = userEvent.setup();
    const error = new Error('Network error');
    render(<ProfileInfoCard {...defaultProps} error={error} />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    expect(defaultProps.onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not show delete button when loading', () => {
    render(<ProfileInfoCard {...defaultProps} isLoading={true} />);

    expect(screen.queryByRole('button', { name: /delete account/i })).not.toBeInTheDocument();
  });

  it('does not show delete button when error', () => {
    const error = new Error('Network error');
    render(<ProfileInfoCard {...defaultProps} error={error} />);

    expect(screen.queryByRole('button', { name: /delete account/i })).not.toBeInTheDocument();
  });

  it('uses semantic HTML for profile data', () => {
    const { container } = render(<ProfileInfoCard {...defaultProps} />);

    const list = container.querySelector('dl');
    expect(list).toBeInTheDocument();
    expect(screen.getByText('Email:')).toBeInTheDocument();
    expect(screen.getByText('Subscription:')).toBeInTheDocument();
  });
});
